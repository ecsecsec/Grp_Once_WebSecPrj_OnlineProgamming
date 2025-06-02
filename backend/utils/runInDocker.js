const express = require('express');
const router = express.Router();
const runInDocker = require('../sandbox/utils/runInDocker');

router.post('/', async (req, res) => {
    const { code, language, problemId } = req.body;

    if (!code || !language || !problemId) {
        return res.status(400).json({ error: 'Missing code, language, or problemId' });
    }

    // TODO: Lấy test case thật từ DB theo problemId
    const testCases = [
        { input: '2 3\n', expected: '5' },
        { input: '10 20\n', expected: '30' },
    ];

    const results = [];

    for (const test of testCases) {
        const result = await runInDocker({ code, language, input: test.input });

        const passed = result.output === test.expected;

        results.push({
            input: test.input,
            expected: test.expected,
            actual: result.output,
            passed,
            error: result.error,
        });
    }

    const allPassed = results.every(r => r.passed);

    res.json({
        testResult: results,
        passed: allPassed,
        output: allPassed ? 'All test cases passed' : 'Some test cases failed',
    });
});

module.exports = router;
