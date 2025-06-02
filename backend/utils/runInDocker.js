const { exec } = require('child_process'); // Để thực thi các lệnh hệ thống (Docker)
const fs = require('fs/promises');       // Sử dụng fs.promises cho các thao tác file bất đồng bộ
const path = require('path');             // Để xử lý đường dẫn file
const { v4: uuidv4 } = require('uuid');   // Để tạo ID duy nhất cho các thư mục sandbox

// Cấu hình giới hạn tài nguyên chung cho các lần thực thi
const TIME_LIMIT_SECONDS = 5; // Giới hạn thời gian chạy cho mỗi test case (5 giây)
const MEMORY_LIMIT_MB = 256;  // Giới hạn bộ nhớ cho mỗi test case (256 MB)

// Cấu hình cho từng ngôn ngữ: Docker image, tên file, lệnh biên dịch/chạy
const LANG_CONFIG = {
    python: {
        dockerImage: 'python:3.9-slim', // Image Docker cho Python
        fileName: 'main.py',           // Tên file code Python sẽ được lưu
        compileCommand: null,          // Python không cần biên dịch
        // Lệnh chạy code Python trong container, sử dụng /bin/bash -c để xử lý redirection
        runCommand: (filename) => `/bin/bash -c "python3 ${filename} < input.txt > output.txt 2> error.txt"`,
    },
    c_cpp: {
        dockerImage: 'gcc:latest',     // Image Docker cho C++ (hoặc g++:latest)
        fileName: 'main.cpp',          // Tên file code C++ sẽ được lưu
        compiledFileName: 'a.out',     // Tên file thực thi sau khi biên dịch
        // Lệnh biên dịch C++
        compileCommand: (filename, compiledFilename) => `g++ ${filename} -o ${compiledFilename} -Wall -Wextra`,
        // Lệnh chạy code C++ đã biên dịch trong container
        runCommand: (compiledFilename) => `/bin/bash -c "./${compiledFilename} < input.txt > output.txt 2> error.txt"`,
    },
    java: {
        dockerImage: 'openjdk:17-jdk-slim', // Image Docker cho Java
        fileName: 'Main.java',             // Tên file code Java (phải khớp tên class chính)
        className: 'Main',                 // Tên class chính để chạy
        // Lệnh biên dịch Java
        compileCommand: (filename) => `javac ${filename}`,
        // Lệnh chạy code Java đã biên dịch trong container
        runCommand: (className) => `/bin/bash -c "java ${className} < input.txt > output.txt 2> error.txt"`,
    },
    // Bạn có thể thêm cấu hình cho các ngôn ngữ khác tại đây
};

/**
 * Thực thi một lệnh Docker bên trong một container cô lập.
 * @param {string} dockerImage - Tên Docker image để sử dụng (ví dụ: 'python:3.9-slim').
 * @param {string} commandToRunInsideContainer - Lệnh sẽ được chạy bên trong container (ví dụ: 'python3 main.py < input.txt').
 * @param {string} sandboxPath - Đường dẫn tuyệt đối đến thư mục sandbox trên host.
 * @param {number} timeoutSeconds - Thời gian tối đa cho phép thực thi lệnh (giây).
 * @returns {Promise<Object>} - Kết quả thực thi bao gồm stdout, stderr, trạng thái timeout/memory/compile error.
 */
async function executeCommandInDocker(dockerImage, commandToRunInsideContainer, sandboxPath, timeoutSeconds) {
    return new Promise((resolve) => {
        // Lệnh Docker cơ bản với các giới hạn và mount volume
        const dockerBaseCommand = `docker run --rm -v "${sandboxPath}":/usr/src/app -w /usr/src/app --memory="${MEMORY_LIMIT_MB}m" --memory-swap="${MEMORY_LIMIT_MB}m" --network=none --pids-limit=100`;
        
        // Xây dựng lệnh Docker hoàn chỉnh: docker run [options] <image_name> <command_inside_container>
        // LƯU Ý QUAN TRỌNG: Đảm bảo cú pháp chính xác
        const fullCommand = `${dockerBaseCommand} ${dockerImage} ${commandToRunInsideContainer}`;

        console.log(`[Docker Exec] Running: ${fullCommand}`); // Debug log: Hiển thị lệnh Docker đầy đủ

        // Thực thi lệnh Docker
        exec(fullCommand, {
            timeout: timeoutSeconds * 1000, // Chuyển đổi timeout sang mili giây
            killSignal: 'SIGKILL',          // Tín hiệu gửi để dừng tiến trình nếu timeout
        }, async (error, stdoutBuffer, stderrBuffer) => { // async callback để dùng await cho fs.readFile
            // Đọc stdout và stderr từ các file trong sandbox (vì redirection)
            let stdout = '';
            let stderr = '';
            let timeTaken = 0; // Thời gian thực thi code trong container (sẽ được cập nhật sau)
            let memoryUsed = 'N/A'; // Bộ nhớ sử dụng (khó đo chính xác từ đây mà không dùng docker stats)

            try {
                // Cố gắng đọc output và error từ các file đã được redirect
                stdout = (await fs.readFile(path.join(sandboxPath, 'output.txt'), 'utf8')).trim();
                stderr = (await fs.readFile(path.join(sandboxPath, 'error.txt'), 'utf8')).trim();
            } catch (fileReadError) {
                // Nếu không đọc được file (có thể do lỗi sớm hoặc file không được tạo)
                console.warn(`[Docker Exec] Could not read output/error files: ${fileReadError.message}`);
                // Fallback: nếu có lỗi từ exec, sử dụng stderrBuffer
                stderr = stderr || stderrBuffer.toString().trim();
            }

            // Mongoose trả về trạng thái mặc định
            let isTimeout = false;
            let isMemoryLimit = false;
            let isCompileError = false; // Mặc định là false, sẽ kiểm tra sau

            if (error) {
                // Kiểm tra nếu là lỗi timeout
                if (error.killed && error.signal === 'SIGKILL') {
                    isTimeout = true;
                } else if (stderr.includes('Memory limit exceeded') || (stderrBuffer.toString().includes('killed') && stderrBuffer.toString().includes('memory'))) {
                    // Kiểm tra thông báo hết bộ nhớ từ Docker hoặc kernel
                    isMemoryLimit = true;
                } else {
                    // Các lỗi khác (lỗi Docker, lỗi lệnh không tìm thấy trong container, v.v.)
                    // Coi đây là Compile Error nếu nó xảy ra trong giai đoạn biên dịch,
                    // hoặc Runtime Error nếu xảy ra trong giai đoạn thực thi.
                    // Chúng ta sẽ phân loại chi tiết hơn ở hàm runInDocker chính.
                    isCompileError = true; // Mặc định là lỗi biên dịch/runtime nếu có error object
                    stderr = stderr || error.message; // Ưu tiên stderr từ file, nếu không có thì lấy từ error object
                }
            }

            resolve({
                stdout,
                stderr,
                isTimeout,
                isMemoryLimit,
                isCompileError, // `true` nếu có lỗi từ exec hoặc stderr (sẽ phân loại lại ở hàm gọi)
                timeTaken,      // Cập nhật sau
                memoryUsed,     // Cập nhật sau
            });
        });
    });
}

/**
 * Hàm chính để chạy code của người dùng trong môi trường Docker sandbox.
 * @param {string} code - Đoạn code của người dùng.
 * @param {string} language - Ngôn ngữ lập trình của code (ví dụ: 'python', 'c_cpp', 'java').
 * @param {string} input - Dữ liệu đầu vào cho chương trình.
 * @returns {Promise<Object>} - Kết quả chấm điểm.
 */
module.exports = async function runInDocker(code, language, input) {
    const config = LANG_CONFIG[language];
    if (!config) {
        // Trả về lỗi nếu ngôn ngữ không được hỗ trợ
        return {
            stdout: '',
            stderr: 'Error: Language not supported.',
            isCompileError: true,
            isTimeout: false,
            isMemoryLimit: false,
            timeTaken: 0,
            memoryUsed: 'N/A'
        };
    }

    const sandboxId = uuidv4(); // Tạo ID duy nhất cho thư mục sandbox
    // Đường dẫn đến thư mục sandbox trên host (tạo trong thư mục 'sandboxes' ở gốc dự án)
    const sandboxDir = path.join(process.cwd(), 'sandboxes', sandboxId); 

    let result = {
        stdout: '',
        stderr: '',
        isCompileError: false,
        isTimeout: false,
        isMemoryLimit: false,
        timeTaken: 0,
        memoryUsed: 'N/A' 
    };

    const startTime = process.hrtime.bigint(); // Bắt đầu tính thời gian tổng thể

    try {
        // 1. Tạo thư mục sandbox và ghi file code/input
        await fs.mkdir(sandboxDir, { recursive: true }); // Tạo thư mục, bao gồm cả thư mục cha nếu chưa có
        await fs.writeFile(path.join(sandboxDir, config.fileName), code); // Ghi code vào file
        await fs.writeFile(path.join(sandboxDir, 'input.txt'), input);   // Ghi input vào file

        // 2. Bước Biên dịch (nếu ngôn ngữ yêu cầu)
        if (config.compileCommand) {
            const compileCommand = config.compileCommand(config.fileName, config.compiledFileName);
            const compileResult = await executeCommandInDocker(config.dockerImage, compileCommand, sandboxDir, TIME_LIMIT_SECONDS);
            
            // Nếu có lỗi trong quá trình biên dịch (stderr hoặc timeout/memory limit)
            if (compileResult.stderr || compileResult.isTimeout || compileResult.isMemoryLimit) {
                result.stderr = compileResult.stderr || 'Compile Error: Unknown reason.';
                result.isCompileError = true;
                result.isTimeout = compileResult.isTimeout;
                result.isMemoryLimit = compileResult.isMemoryLimit;
                // Thêm một log để debug lỗi biên dịch cụ thể
                console.error(`[Compile Error] Problem ID: ${sandboxId}, Lang: ${language}, Stderr: ${result.stderr}`);
                return result; // Dừng lại ngay nếu biên dịch thất bại
            }
        }

        // 3. Bước Thực thi code
        const runCommand = config.runCommand(config.compiledFileName || config.fileName || config.className);
        const executionResult = await executeCommandInDocker(config.dockerImage, runCommand, sandboxDir, TIME_LIMIT_SECONDS);

        result.stdout = executionResult.stdout;
        result.stderr = executionResult.stderr;
        result.isTimeout = executionResult.isTimeout;
        result.isMemoryLimit = executionResult.isMemoryLimit;

        // Phân loại lỗi Runtime Error
        if (executionResult.stderr && !executionResult.isTimeout && !executionResult.isMemoryLimit) {
            // Nếu có stderr nhưng không phải do timeout/memory, thì đó là Runtime Error
            result.isCompileError = false; // Đảm bảo không phải lỗi biên dịch
            // Bạn có thể thêm logic phân biệt cụ thể hơn nếu cần (ví dụ: lỗi hệ thống vs lỗi chương trình)
        }

    } catch (error) {
        // Xử lý các lỗi xảy ra trong quá trình quản lý file hoặc Docker (ví dụ: không tạo được thư mục)
        console.error(`[runInDocker Global Error] Problem ID: ${sandboxId}, Lang: ${language}, Error: ${error.message}`);
        result.stderr = `Server error during code execution setup: ${error.message}`;
        result.isCompileError = true; // Coi là lỗi tổng quát nếu nằm ngoài phần chấm điểm
    } finally {
        const endTime = process.hrtime.bigint();
        // Tính thời gian thực thi tổng thể (từ khi bắt đầu ghi file đến khi hoàn thành Docker)
        result.timeTaken = Number(endTime - startTime) / 1_000_000_000; 
        
        // Dọn dẹp thư mục sandbox
        try {
            await fs.rm(sandboxDir, { recursive: true, force: true });
            // console.log(`[Cleanup] Sandbox ${sandboxId} removed.`); // Log dọn dẹp
        } catch (cleanupError) {
            console.error(`[Cleanup Error] Failed to remove sandbox ${sandboxId}: ${cleanupError.message}`);
        }
    }

    return result;
};