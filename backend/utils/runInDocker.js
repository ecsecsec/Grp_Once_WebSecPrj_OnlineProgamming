const { exec } = require('child_process');
const fs = require('fs/promises'); // Sử dụng fs/promises để làm việc với Promise-based API
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Để tạo ID thư mục ngẫu nhiên

// Cấu hình giới hạn thời gian và bộ nhớ (có thể thay đổi tùy bài toán)
const TIME_LIMIT_SECONDS = 5; // Ví dụ: 5 giây
const MEMORY_LIMIT_MB = 256; // Ví dụ: 256 MB

/**
 * Hàm chạy code người dùng trong một Docker container cô lập.
 * @param {string} code - Mã nguồn của người dùng.
 * @param {string} language - Ngôn ngữ lập trình ('python', 'c_cpp', 'java').
 * @param {string} input - Input cho chương trình.
 * @returns {Promise<Object>} - Object chứa stdout, stderr, isCompileError, isTimeout, isMemoryLimit, timeTaken, memoryUsed.
 */
async function runInDocker(code, language, input) {
    const sandboxDir = path.join('/tmp', `sandbox-${uuidv4()}`); // Tạo thư mục tạm thời với ID duy nhất
    const fileName = getFileName(language);
    const compiledFileName = getCompiledFileName(language); // Tên file sau khi biên dịch (nếu có)
    const dockerImage = getDockerImage(language);

    let stdout = '';
    let stderr = '';
    let isCompileError = false;
    let isTimeout = false;
    let isMemoryLimit = false;
    let timeTaken = null;
    let memoryUsed = null;

    try {
        await fs.mkdir(sandboxDir, { recursive: true }); // Tạo thư mục sandbox
        await fs.writeFile(path.join(sandboxDir, fileName), code); // Ghi code vào file
        await fs.writeFile(path.join(sandboxDir, 'input.txt'), input); // Ghi input vào file

        // Lệnh Docker cơ sở
        let dockerCommand = `docker run --rm -v ${sandboxDir}:/usr/src/app -w /usr/src/app`;
        
        // Thêm giới hạn tài nguyên
        // --cpus="0.5" để giới hạn CPU (ví dụ: 50% của 1 core)
        // --memory="${MEMORY_LIMIT_MB}m" để giới hạn RAM
        // --ulimit nofile=1024:1024 để giới hạn số lượng file mở
        dockerCommand += ` --memory="${MEMORY_LIMIT_MB}m" --memory-swap="${MEMORY_LIMIT_MB}m"`; // memory-swap = memory để tắt swap
        dockerCommand += ` --network=none --pids-limit=100`; // Vô hiệu hóa mạng, giới hạn số tiến trình
        
        // Đo thời gian và bộ nhớ sử dụng
        // Sử dụng /usr/bin/time -v để lấy thông tin chi tiết về tài nguyên
        // Chú ý: /usr/bin/time -v không có sẵn trong tất cả các Docker image.
        // Cần cài đặt `time` trong image nếu muốn sử dụng.
        // Hoặc bạn có thể dùng `measure-command` trong PowerShell hoặc tương đương.
        // Để đơn giản, ở đây ta sẽ dùng cách ước lượng hoặc giả định từ `runInDocker` sẽ trả về.
        // Logic thực tế để đo thời gian/bộ nhớ cần phức tạp hơn một chút (ví dụ: cgroup, nsjail).
        // Đối với ví dụ này, chúng ta sẽ giả định `runInDocker` trả về các giá trị này.
        
        let executionCommand = '';

        if (language === 'python') {
            executionCommand = `python3 ${fileName} < input.txt > output.txt 2> error.txt`;
        } else if (language === 'c_cpp') {
            // Biên dịch
            const compileResult = await executeCommandInDocker(
                `${dockerCommand} ${dockerImage} g++ ${fileName} -o ${compiledFileName} -Wall -Wextra`,
                sandboxDir, // Truyền sandboxDir để gỡ lỗi nếu cần
                TIME_LIMIT_SECONDS // Thời gian tối đa cho biên dịch
            );
            if (compileResult.stderr || compileResult.exitCode !== 0) {
                isCompileError = true;
                stderr = compileResult.stderr || 'Compile error, but no stderr captured.';
            } else {
                // Thực thi
                executionCommand = `./${compiledFileName} < input.txt > output.txt 2> error.txt`;
            }
        } else if (language === 'java') {
            const className = fileName.replace('.java', '');
            // Biên dịch
            const compileResult = await executeCommandInDocker(
                `${dockerCommand} ${dockerImage} javac ${fileName}`,
                sandboxDir, // Truyền sandboxDir để gỡ lỗi nếu cần
                TIME_LIMIT_SECONDS // Thời gian tối đa cho biên dịch
            );
            if (compileResult.stderr || compileResult.exitCode !== 0) {
                isCompileError = true;
                stderr = compileResult.stderr || 'Compile error, but no stderr captured.';
            } else {
                // Thực thi
                executionCommand = `java ${className} < input.txt > output.txt 2> error.txt`;
            }
        } else {
            throw new Error('Unsupported language');
        }

        if (!isCompileError) {
            const executionResult = await executeCommandInDocker(
                `${dockerCommand} ${dockerImage} ${executionCommand}`,
                sandboxDir, // Truyền sandboxDir để gỡ lỗi nếu cần
                TIME_LIMIT_SECONDS // Thời gian tối đa cho thực thi
            );

            if (executionResult.isTimeout) {
                isTimeout = true;
                stderr = `Time Limit Exceeded (${TIME_LIMIT_SECONDS}s)`;
            } else if (executionResult.isMemoryLimit) {
                isMemoryLimit = true;
                stderr = `Memory Limit Exceeded (${MEMORY_LIMIT_MB}MB)`;
            } else {
                stdout = await fs.readFile(path.join(sandboxDir, 'output.txt'), 'utf8').catch(() => '');
                stderr = (await fs.readFile(path.join(sandboxDir, 'error.txt'), 'utf8').catch(() => '')) || executionResult.stderr;
                timeTaken = executionResult.timeTaken;
                memoryUsed = executionResult.memoryUsed;
            }
        }

    } catch (err) {
        console.error('Error during Docker execution:', err);
        stderr = `Internal server error during code execution: ${err.message}`;
    } finally {
        // Dọn dẹp thư mục sandbox
        try {
            await fs.rm(sandboxDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.error(`Failed to clean up sandbox directory ${sandboxDir}:`, cleanupErr);
        }
    }

    return {
        stdout,
        stderr,
        isCompileError,
        isTimeout,
        isMemoryLimit,
        timeTaken,
        memoryUsed,
    };
}

/**
 * Thực thi một lệnh shell trong Docker và trả về kết quả.
 * @param {string} command - Lệnh Docker đầy đủ để thực thi.
 * @param {string} sandboxPath - Đường dẫn đến thư mục sandbox trên host.
 * @param {number} timeoutSeconds - Thời gian tối đa cho phép thực thi lệnh.
 * @returns {Promise<Object>} - stdout, stderr, exitCode, isTimeout, isMemoryLimit.
 */
async function executeCommandInDocker(command, sandboxPath, timeoutSeconds) {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let isTimeout = false;
        let isMemoryLimit = false;
        let timeTaken = null;
        let memoryUsed = null;

        const startTime = process.hrtime.bigint(); // Bắt đầu đo thời gian

        // Sử dụng `exec` để thực thi lệnh Docker
        // Thêm `timeout` để giới hạn thời gian cho chính lệnh `exec`
        const child = exec(command, { timeout: timeoutSeconds * 1000 + 500, killSignal: 'SIGKILL' }, (error, stdoutBuffer, stderrBuffer) => {
            stdout = stdoutBuffer;
            stderr = stderrBuffer;

            const endTime = process.hrtime.bigint(); // Kết thúc đo thời gian
            timeTaken = Number(endTime - startTime) / 1_000_000_000; // Chuyển đổi từ nanoseconds sang giây

            if (error) {
                if (error.killed) { // Kiểm tra nếu tiến trình bị kill do timeout
                    isTimeout = true;
                }
                // Docker có thể trả về lỗi memory limit thông qua stderr
                // Cần parse stderr để phát hiện các thông báo lỗi cụ thể của Docker
                if (stderr.includes('out of memory') || stderr.includes('killed')) {
                    isMemoryLimit = true;
                }
                resolve({
                    stdout,
                    stderr,
                    exitCode: error.code || 1, // Exit code nếu có lỗi
                    isTimeout,
                    isMemoryLimit,
                    timeTaken,
                    memoryUsed: null, // Cần parse từ Docker stats hoặc `/usr/bin/time`
                });
            } else {
                resolve({
                    stdout,
                    stderr,
                    exitCode: 0,
                    isTimeout,
                    isMemoryLimit,
                    timeTaken,
                    memoryUsed: null, // Cần parse từ Docker stats hoặc `/usr/bin/time`
                });
            }
        });
        
        // Lấy thông tin về bộ nhớ sử dụng (khó chính xác chỉ với `exec`)
        // Một cách tốt hơn là chạy `docker stats` riêng biệt hoặc sử dụng công cụ chấm điểm chuyên dụng.
        // Để đơn giản, tôi sẽ bỏ qua phần này hoặc để nó là `null` trong ví dụ này.
        // if (child.pid) {
        //     exec(`docker stats --no-stream --format "{{.MemUsage}}" $(docker ps -q --filter ancestor=${dockerImage} --filter status=running) | head -n 1`, 
        //     { timeout: 1000 }, (err, memStdout, memStderr) => {
        //         if (!err && memStdout) {
        //             const match = memStdout.match(/(\d+\.?\d*)\s*(mib|mb)/i);
        //             if (match) {
        //                 memoryUsed = parseFloat(match[1]);
        //             }
        //         }
        //     });
        // }
    });
}

function getFileName(language) {
    switch (language) {
        case 'python': return 'main.py';
        case 'c_cpp': return 'main.cpp';
        case 'java': return 'Main.java';
        default: throw new Error('Unsupported language');
    }
}

function getCompiledFileName(language) {
    switch (language) {
        case 'c_cpp': return 'a.out';
        case 'java': return 'Main'; // Java class name
        default: return null; // Không có file biên dịch cho Python
    }
}

function getDockerImage(language) {
    switch (language) {
        case 'python': return 'python:3.9-slim';
        case 'c_cpp': return 'gcc:latest'; // Image chứa g++
        case 'java': return 'openjdk:17-jdk-slim';
        default: throw new Error('Unsupported language');
    }
}

module.exports = runInDocker;