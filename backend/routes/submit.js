const express = require('express');
const router = express.Router();
const Problem = require('../models/problem'); 
const runInDocker = require('../utils/runInDocker'); 
router.post('/', async (req, res) => {
    const { code, language, problemId } = req.body;

    if (!code || !language || !problemId) {
        return res.status(400).json({ error: 'Missing code, language, or problemId' });
    }

    try {
        // 1. Lấy test cases từ database dựa trên problemId
        const problem = await Problem.findOne({id: problemId});
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found.' });
        }

        const testcases = problem.testcases;
        if (!testcases || testcases.length === 0) {
            return res.status(400).json({ error: 'No test cases defined for this problem.' });
        }

        const results = [];
        let allTestsPassed = true;

        // 2. Chạy code với từng test case trong sandbox
        // Lưu ý: Trong môi trường thực tế, bạn sẽ muốn chạy các test case này
        // đồng thời (concurrently) hoặc tuần tự trong cùng một Docker container
        // để tiết kiệm tài nguyên. Ví dụ này chạy tuần tự để đơn giản hóa.
        for (const [index, testCase] of testcases.entries()) {
            const input = testCase.input;
            const expectedOutput = (testCase.expectedOutput || '').trim(); // Trim whitespace

            // Gọi hàm thực thi code trong Docker
            // runInDocker sẽ trả về { stdout, stderr, exitCode, timeTaken, memoryUsed }
            const executionResult = await runInDocker(code, language, input);

            let passed = false;
            let actualOutput = (executionResult.stdout || '').trim(); // Trim whitespace

            let status = 'Error'; // Default status

            if (executionResult.stderr) {
                // Có lỗi runtime hoặc compile
                status = 'Runtime Error';
                if (executionResult.isCompileError) { // Bạn cần bổ sung logic này trong runInDocker
                    status = 'Compile Error';
                } else if (executionResult.isTimeout) { // Nếu có Timeout
                    status = 'Time Limit Exceeded';
                } else if (executionResult.isMemoryLimit) { // Nếu có Memory Limit
                    status = 'Memory Limit Exceeded';
                }
                passed = false;
                actualOutput = executionResult.stderr; // Đổi output thành lỗi để hiển thị
            } else if (executionResult.isTimeout) { // Nếu có Timeout
                status = 'Time Limit Exceeded';
                passed = false;
            } else if (executionResult.isMemoryLimit) { // Nếu có Memory Limit
                status = 'Memory Limit Exceeded';
                passed = false;
            } else if (actualOutput === expectedOutput) {
                status = 'Accepted';
                passed = true;
            } else {
                status = 'Wrong Answer';
                passed = false;
            }

            results.push({
                testCase: index + 1,
                input: input,
                expectedOutput: expectedOutput,
                actualOutput: actualOutput,
                passed: passed,
                status: status,
                time: executionResult.timeTaken || 'N/A', // Thời gian thực thi
                memory: executionResult.memoryUsed || 'N/A' // Bộ nhớ sử dụng
            });

            if (!passed && status !== 'Accepted') {
                allTestsPassed = false; // Nếu có bất kỳ test case nào fail, đặt cờ false
                // Tùy chọn: Dừng chấm điểm ngay nếu có test case fail đầu tiên để tiết kiệm tài nguyên
                // break;
            }
        }

        res.status(200).json({
            overallStatus: allTestsPassed ? 'Accepted' : 'Failed',
            testResults: results,
            message: allTestsPassed ? 'All test cases passed!' : 'Some test cases failed.'
        });

    } catch (err) {
        console.error('Error submitting code:', err);
        res.status(500).json({ error: 'Internal server error during submission processing.', details: err.message });
    }
});

module.exports = router;