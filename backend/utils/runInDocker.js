// backend/utils/runInDocker.js
const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const LANG_CONFIG = {
    python: {
        dockerImage: 'my-python-runner:v1', // QUAN TRỌNG: THAY BẰNG TÊN IMAGE PYTHON CỦA BẠN
        fileName: 'main.py',
        compileCommand: null,
        runCommand: (filename) => `/bin/bash -c "python3 ${filename} < input.txt > output.txt 2> error.txt"`,
    },
    c_cpp: {
        dockerImage: 'my-gcc-runner:v1',   // QUAN TRỌNG: THAY BẰNG TÊN IMAGE GCC CỦA BẠN
        fileName: 'main.cpp',
        compiledFileName: 'a.out',
        compileCommand: (filename, compiledFilename) => `g++ ${filename} -o ${compiledFilename} -O2 -std=c++17 -Wall -Wextra -DONLINE_JUDGE -static`,
        runCommand: (compiledFilename) => `/bin/bash -c "./${compiledFilename} < input.txt > output.txt 2> error.txt"`,
    },
    java: {
        dockerImage: 'my-java-runner:v1',  // QUAN TRỌNG: THAY BẰNG TÊN IMAGE JAVA CỦA BẠN
        fileName: 'Main.java', // File code Java phải tên là Main.java
        className: 'Main',     // Class chính trong code Java phải tên là Main
        compileCommand: (filename) => `javac ${filename}`,
        runCommand: (className) => `/bin/bash -c "java ${className} < input.txt > output.txt 2> error.txt"`,
    },
};

async function executeCommandInDocker(dockerImage, commandToRunInsideContainer, sandboxPath, timeoutSeconds, memoryLimitMb) {
    return new Promise((resolve) => {
        const dockerUser = 'appuser'; // Đảm bảo user này tồn tại trong các image base của bạn

        // Đảm bảo các cờ bảo mật --user và --cap-drop=ALL được sử dụng
        const dockerBaseCommand = `docker run --rm --user ${dockerUser} -v "${sandboxPath}":/usr/src/app -w /usr/src/app --memory="${memoryLimitMb}m" --memory-swap="${memoryLimitMb}m" --network=none --pids-limit=64 --cap-drop=ALL`;

        const fullCommand = `${dockerBaseCommand} ${dockerImage} ${commandToRunInsideContainer}`;
        // console.log(`[Docker Exec] Running: ${fullCommand}`); // Bỏ comment để debug lệnh Docker

        exec(fullCommand, {
            timeout: timeoutSeconds * 1000,
            killSignal: 'SIGKILL', // Gửi SIGKILL nếu timeout
        }, async (error, stdoutBuffer, stderrBuffer) => {
            let stdoutFromFile = '';
            let stderrFromFile = '';
            let isTimeout = false;
            let isMemoryLimit = false;
            let exitCode = error ? error.code : 0; // Lấy exit code từ error object nếu có

            try {
                stdoutFromFile = (await fs.readFile(path.join(sandboxPath, 'output.txt'), 'utf8')).trim();
            } catch (e) { /* File output.txt có thể không được tạo nếu có lỗi sớm */ }
            try {
                stderrFromFile = (await fs.readFile(path.join(sandboxPath, 'error.txt'), 'utf8')).trim();
            } catch (e) { /* File error.txt có thể không được tạo */ }

            // Ưu tiên stderr từ file error.txt, nếu không có thì từ error object của exec
            let finalStderr = stderrFromFile;
            if (error && !finalStderr) { // Nếu có lỗi từ exec và file error.txt rỗng
                if (stderrBuffer && stderrBuffer.length > 0) {
                    finalStderr = stderrBuffer.toString().trim();
                } else {
                    finalStderr = error.message; // Fallback là message của error object
                }
            }


            if (error) {
                // error.killed là true nếu process bị kill bởi signal (bao gồm cả timeout từ exec)
                if (error.killed && error.signal === 'SIGKILL') {
                    // exitCode 137 (128 + 9 SIGKILL) thường là do OOM killer của Docker
                    if (exitCode === 137) {
                        isMemoryLimit = true;
                        finalStderr = finalStderr || "Process killed due to memory limit (OOM).";
                    } else {
                        // Nếu bị kill bởi SIGKILL nhưng không phải exit code 137,
                        // và exec đã timeout, thì đó là TLE.
                        isTimeout = true;
                        finalStderr = finalStderr || "Process timed out.";
                    }
                } else if (exitCode === 137) { // Bị kill bởi OOM (có thể không phải do timeout của exec)
                    isMemoryLimit = true;
                    finalStderr = finalStderr || "Process killed due to memory limit (OOM).";
                }
                // Các lỗi khác (lỗi lệnh, lỗi runtime không bị kill) sẽ có exitCode != 0
                // isCompileError sẽ được xác định ở hàm gọi dựa trên exitCode và ngữ cảnh (compile/run)
            }

            resolve({
                stdout: stdoutFromFile,
                stderr: finalStderr,
                isTimeout,
                isMemoryLimit,
                exitCode
            });
        });
    });
}

module.exports = async function runInDocker(code, language, input, problemConfig) {
    // Lấy giới hạn từ problemConfig, nếu không có thì dùng giá trị mặc định
    const timeLimitSeconds = Math.ceil((problemConfig.timeLimit || 5000) / 1000);
    const memoryLimitMb = problemConfig.memoryLimit || 256;

    const config = LANG_CONFIG[language];
    if (!config) {
        return {
            status: 'System Error',
            stderr: `Error: Language ${language} not supported.`,
            stdout: '',
            exitCode: -1, // Mã lỗi tùy chọn cho System Error
            time_ms: 0,
            memory_kb: 0
        };
    }

    const sandboxId = uuidv4();
    // Tạo thư mục sandboxes trong thư mục gốc của backend (nơi app.js, utils, services, etc. nằm)
    // __dirname của file này là backend/utils
    const sandboxDir = path.join(__dirname, '..', 'sandboxes', sandboxId);

    const resultForTestCase = {
        stdout: '',
        stderr: '',
        status: 'Pending', // Trạng thái xử lý của test case (Success, TLE, MLE, RE, CE)
        time_ms: 0,        // Thời gian thực thi của bước này (compile hoặc run)
        memory_kb: 0,      // Hiện tại chưa đo chính xác, có thể là giới hạn đã đặt
        exitCode: 0
    };
    const operationStartTime = process.hrtime.bigint(); // Thời gian bắt đầu của operation (compile hoặc run)

    try {
        await fs.mkdir(sandboxDir, { recursive: true });
        await fs.writeFile(path.join(sandboxDir, config.fileName), code);
        await fs.writeFile(path.join(sandboxDir, 'input.txt'), input || ''); // Đảm bảo input rỗng là file rỗng

        // Bước Biên dịch (nếu ngôn ngữ yêu cầu)
        if (config.compileCommand) {
            const compileCmd = config.compileCommand(config.fileName, config.compiledFileName);
            // Thời gian biên dịch có thể cần ít hơn thời gian chạy
            const compileTimeLimit = Math.max(10, Math.floor(timeLimitSeconds / 2) + 5); // Ví dụ: 10s hoặc (TLE/2 + 5s)
            const compileResult = await executeCommandInDocker(config.dockerImage, compileCmd, sandboxDir, compileTimeLimit, memoryLimitMb);

            resultForTestCase.exitCode = compileResult.exitCode;
            resultForTestCase.stderr = compileResult.stderr; // Luôn lấy stderr từ compile

            if (compileResult.isTimeout) {
                resultForTestCase.status = 'Compilation Timeout';
            } else if (compileResult.isMemoryLimit) {
                resultForTestCase.status = 'Compilation Memory Limit Exceeded';
            } else if (compileResult.exitCode !== 0) { // Lỗi biên dịch dựa trên exit code
                resultForTestCase.status = 'Compilation Error';
            }
            // Nếu có lỗi trong quá trình biên dịch, dừng lại và trả về kết quả
            if (resultForTestCase.status !== 'Pending') {
                const operationEndTimeCompile = process.hrtime.bigint();
                resultForTestCase.time_ms = Math.round(Number(operationEndTimeCompile - operationStartTime) / 1_000_000);
                return resultForTestCase;
            }
        }

        // Bước Thực thi code (chỉ chạy nếu biên dịch thành công hoặc không cần biên dịch)
        const runCmd = config.runCommand(config.compiledFileName || config.className || config.fileName);
        // Thời gian bắt đầu lại cho bước thực thi (nếu có bước biên dịch)
        const executionStartTime = process.hrtime.bigint();
        const executionResult = await executeCommandInDocker(config.dockerImage, runCmd, sandboxDir, timeLimitSeconds, memoryLimitMb);

        resultForTestCase.exitCode = executionResult.exitCode;
        resultForTestCase.stdout = executionResult.stdout;
        resultForTestCase.stderr = executionResult.stderr; // Lấy stderr từ bước thực thi

        if (executionResult.isTimeout) {
            resultForTestCase.status = 'Time Limit Exceeded';
        } else if (executionResult.isMemoryLimit) {
            resultForTestCase.status = 'Memory Limit Exceeded';
        } else if (executionResult.exitCode !== 0) { // Lỗi runtime dựa trên exit code
            resultForTestCase.status = 'Runtime Error';
        } else {
            resultForTestCase.status = 'Success'; // Chạy thành công, chưa so sánh output
            // Nếu có stderr nhưng exitCode là 0, đó có thể là warning hoặc output không mong muốn
            if (executionResult.stderr) {
                 console.warn(`[Execution Warning/Stderr] Sandbox: ${sandboxId}, Lang: ${language}, Stderr (but Exit Code 0): ${executionResult.stderr}`);
                 // Quyết định có nên coi đây là lỗi hay không, hoặc chỉ log
                 // Hiện tại, nếu exit code là 0, vẫn coi là 'Success' bất kể stderr
            }
        }
        const operationEndTimeExecute = process.hrtime.bigint();
        resultForTestCase.time_ms = Math.round(Number(operationEndTimeExecute - (config.compileCommand ? executionStartTime : operationStartTime)) / 1_000_000);


    } catch (error) {
        // Lỗi trong quá trình setup file, thư mục (ngoài Docker exec)
        console.error(`[runInDocker Setup/File Error] Sandbox: ${sandboxId}, Lang: ${language}, Error: ${error.message}`);
        resultForTestCase.stderr = `Server error during sandbox execution setup: ${error.message}`;
        resultForTestCase.status = 'System Error';
        resultForTestCase.exitCode = -1; // Mã lỗi tùy chọn cho lỗi hệ thống của hàm này
        const operationEndTimeError = process.hrtime.bigint();
        resultForTestCase.time_ms = Math.round(Number(operationEndTimeError - operationStartTime) / 1_000_000);
    } finally {
        // Dọn dẹp thư mục sandbox
        try {
            await fs.rm(sandboxDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error(`[Cleanup Error] Failed to remove sandbox ${sandboxId}: ${cleanupError.message}`);
        }
    }
    return resultForTestCase;
};