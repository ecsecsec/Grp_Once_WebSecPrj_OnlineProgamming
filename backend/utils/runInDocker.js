// backend/utils/runInDocker.js
const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// MEMORY_LIMIT_MB sẽ được lấy từ problemConfig
// TIME_LIMIT_SECONDS sẽ được lấy từ problemConfig

const LANG_CONFIG = {
    python: {
        dockerImage: 'my-python-runner:v1', // CẬP NHẬT TÊN IMAGE CỦA BẠN
        fileName: 'main.py',
        compileCommand: null,
        runCommand: (filename) => `/bin/bash -c "python3 ${filename} < input.txt > output.txt 2> error.txt"`,
    },
    c_cpp: {
        dockerImage: 'my-gcc-runner:v1', // CẬP NHẬT TÊN IMAGE CỦA BẠN
        fileName: 'main.cpp',
        compiledFileName: 'a.out',
        compileCommand: (filename, compiledFilename) => `g++ ${filename} -o ${compiledFilename} -O2 -std=c++17 -Wall -Wextra -DONLINE_JUDGE -static`, // Thêm flags
        runCommand: (compiledFilename) => `/bin/bash -c "./${compiledFilename} < input.txt > output.txt 2> error.txt"`,
    },
    java: {
        dockerImage: 'my-java-runner:v1', // CẬP NHẬT TÊN IMAGE CỦA BẠN
        fileName: 'Main.java',
        className: 'Main', // Đảm bảo code người dùng có class Main
        compileCommand: (filename) => `javac ${filename}`,
        runCommand: (className) => `/bin/bash -c "java ${className} < input.txt > output.txt 2> error.txt"`,
    },
};

// Hàm executeCommandInDocker (Nội dung gần như giữ nguyên, chỉ đảm bảo dockerUser là 'appuser')
async function executeCommandInDocker(dockerImage, commandToRunInsideContainer, sandboxPath, timeoutSeconds, memoryLimitMb) {
    return new Promise((resolve) => {
        const dockerUser = 'appuser'; // User đã tạo trong image base
        // Điều chỉnh pids-limit nếu cần, 64 là khá an toàn
        const dockerBaseCommand = `docker run --rm --user ${dockerUser} -v "${sandboxPath}":/usr/src/app -w /usr/src/app --memory="${memoryLimitMb}m" --memory-swap="${memoryLimitMb}m" --network=none --pids-limit=64 --cap-drop=ALL`; // Thêm --cap-drop=ALL

        const fullCommand = `${dockerBaseCommand} ${dockerImage} ${commandToRunInsideContainer}`;
        // console.log(`[Docker Exec] Running: ${fullCommand}`); // Bỏ comment nếu cần debug

        exec(fullCommand, {
            timeout: timeoutSeconds * 1000,
            killSignal: 'SIGKILL',
        }, async (error, stdoutBuffer, stderrBuffer) => { // stdoutBuffer, stderrBuffer là từ exec, không phải từ file
            let stdoutFromFile = '';
            let stderrFromFile = '';
            let isTimeout = false;
            let isMemoryLimit = false;
            // isCompileError sẽ được xác định ở hàm gọi `runInDocker` dựa trên bước (compile/run)
            let exitCode = error ? error.code : 0;

            try {
                stdoutFromFile = (await fs.readFile(path.join(sandboxPath, 'output.txt'), 'utf8')).trim();
            } catch (e) { /* File có thể không được tạo nếu lỗi sớm */ }
            try {
                stderrFromFile = (await fs.readFile(path.join(sandboxPath, 'error.txt'), 'utf8')).trim();
            } catch (e) { /* File có thể không được tạo */ }

            // Ưu tiên nội dung từ file error.txt nếu có, nếu không thì từ error object của exec
            let finalStderr = stderrFromFile || (error ? error.message : '');
            if (error && !stderrFromFile && stderrBuffer.length > 0) { // Nếu file error rỗng nhưng exec có stderr
                finalStderr = stderrBuffer.toString().trim();
            }


            if (error) {
                // error.killed là true nếu process bị kill bởi signal (bao gồm timeout)
                if (error.killed && error.signal === 'SIGKILL') {
                    // Kiểm tra exit code để phân biệt TLE và MLE
                    // Docker trả về 137 (128 + 9 (SIGKILL)) khi OOM killer hoạt động
                    // Timeout từ `exec` cũng dùng SIGKILL, nhưng exit code có thể khác (hoặc null)
                    // Đây là một điểm hơi khó phân biệt chính xác 100% chỉ với `exec`
                    // Giả sử nếu `exec` timeout, `error.code` có thể không phải 137.
                    if (exitCode === 137) {
                        isMemoryLimit = true;
                    } else {
                        isTimeout = true; // Mặc định là TLE nếu bị kill bởi SIGKILL và không phải code 137
                    }
                } else if (exitCode === 137) { // OOM Killer (không phải do timeout của exec)
                    isMemoryLimit = true;
                }
                // Các lỗi khác (lỗi lệnh, lỗi runtime không bị kill) sẽ có exitCode != 0
            }

            resolve({
                stdout: stdoutFromFile, // Luôn lấy stdout từ file
                stderr: finalStderr,    // stderr đã được xử lý
                isTimeout,
                isMemoryLimit,
                exitCode
            });
        });
    });
}


// Hàm module.exports = async function runInDocker(...)
// (Nội dung hàm này giữ nguyên như trong đề xuất trước, chỉ truyền thêm memoryLimitMb vào executeCommandInDocker)
module.exports = async function runInDocker(code, language, input, problemConfig) {
    const timeLimitSeconds = Math.ceil((problemConfig.timeLimit || 5000) / 1000); // Sửa problemConfig.time_limit_ms thành problemConfig.timeLimit
    const memoryLimitMb = problemConfig.memoryLimit || 256; // Sửa problemConfig.memory_limit_mb thành problemConfig.memoryLimit

    const config = LANG_CONFIG[language];
    if (!config) {
        // Trả về cấu trúc nhất quán hơn
        return { status: 'System Error', stderr: `Error: Language ${language} not supported.`, stdout: '', exitCode: -1, time_ms:0, memory_kb:0 };
    }

    const sandboxId = uuidv4();
    const sandboxDir = path.join(process.cwd(), 'sandboxes', sandboxId);

    const resultForTestCase = {
        stdout: '',
        stderr: '',
        status: 'Pending', // Trạng thái xử lý của test case (Success, TLE, MLE, RE, CE)
        time_ms: 0,
        memory_kb: 0, // Hiện tại chưa đo chính xác, có thể là giới hạn
        exitCode: 0
    };
    const startTime = process.hrtime.bigint();

    try {
        await fs.mkdir(sandboxDir, { recursive: true });
        await fs.writeFile(path.join(sandboxDir, config.fileName), code);
        await fs.writeFile(path.join(sandboxDir, 'input.txt'), input || ''); // Đảm bảo input rỗng là file rỗng

        if (config.compileCommand) {
            const compileCmd = config.compileCommand(config.fileName, config.compiledFileName);
            // Giảm thời gian biên dịch một chút so với thời gian chạy tổng
            const compileTimeLimit = Math.max(5, Math.floor(timeLimitSeconds / 2)); // Ít nhất 5s hoặc 1/2 TLE
            const compileResult = await executeCommandInDocker(config.dockerImage, compileCmd, sandboxDir, compileTimeLimit, memoryLimitMb);
            resultForTestCase.exitCode = compileResult.exitCode;

            if (compileResult.isTimeout) {
                resultForTestCase.status = 'Compilation Timeout';
                resultForTestCase.stderr = compileResult.stderr || "Compilation process timed out.";
            } else if (compileResult.isMemoryLimit) {
                resultForTestCase.status = 'Compilation Memory Limit Exceeded';
                resultForTestCase.stderr = compileResult.stderr || "Compilation process exceeded memory limit.";
            } else if (compileResult.exitCode !== 0 || compileResult.stderr) { // Lỗi biên dịch
                resultForTestCase.status = 'Compilation Error';
                resultForTestCase.stderr = compileResult.stderr || 'Compile Error: Unknown reason.';
            }

            if (resultForTestCase.status !== 'Pending') { // Nếu có lỗi biên dịch thì dừng
                return resultForTestCase; // Đã bao gồm status, stderr, stdout (nếu có từ compile)
            }
        }

        // Bước thực thi
        const runCmd = config.runCommand(config.compiledFileName || config.className || config.fileName);
        const executionResult = await executeCommandInDocker(config.dockerImage, runCmd, sandboxDir, timeLimitSeconds, memoryLimitMb);
        resultForTestCase.exitCode = executionResult.exitCode;
        resultForTestCase.stdout = executionResult.stdout; // stdout từ file output.txt

        if (executionResult.isTimeout) {
            resultForTestCase.status = 'Time Limit Exceeded';
            resultForTestCase.stderr = executionResult.stderr || "Execution timed out."; // stderr có thể chứa output cuối cùng trước TLE
        } else if (executionResult.isMemoryLimit) {
            resultForTestCase.status = 'Memory Limit Exceeded';
            resultForTestCase.stderr = executionResult.stderr || "Execution exceeded memory limit.";
        } else if (executionResult.exitCode !== 0 || executionResult.stderr) { // Lỗi runtime
            resultForTestCase.status = 'Runtime Error';
            resultForTestCase.stderr = executionResult.stderr || 'Runtime Error: Unknown reason.';
        } else {
            resultForTestCase.status = 'Success'; // Chạy thành công (chưa so sánh output)
            // stderr có thể chứa warning, không nhất thiết là lỗi nếu exitCode = 0
            if (executionResult.stderr) {
                 console.warn(`[Execution Warning] Sandbox: ${sandboxId}, Lang: ${language}, Stderr (but Success): ${executionResult.stderr}`);
                 // Quyết định có gán vào resultForTestCase.stderr hay không
                 // resultForTestCase.stderr = executionResult.stderr;
            }
        }

    } catch (error) {
        // Lỗi trong quá trình setup file, thư mục (ngoài Docker exec)
        console.error(`[runInDocker Function Error] Sandbox: ${sandboxId}, Lang: ${language}, Error: ${error.message}`);
        resultForTestCase.stderr = `Server error during sandbox execution: ${error.message}`;
        resultForTestCase.status = 'System Error';
        resultForTestCase.exitCode = -1;
    } finally {
        const endTime = process.hrtime.bigint();
        resultForTestCase.time_ms = Math.round(Number(endTime - startTime) / 1_000_000);

        try {
            await fs.rm(sandboxDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error(`[Cleanup Error] Failed to remove sandbox ${sandboxId}: ${cleanupError.message}`);
        }
    }
    return resultForTestCase;
};