// routes/problem.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const PROBLEMS_FILE = path.join(__dirname, '../data/problems.json');

// Đảm bảo file tồn tại
if (!fs.existsSync(PROBLEMS_FILE)) {
    fs.writeFileSync(PROBLEMS_FILE, '[]');
}

// POST /api/problem - Tạo bài tập mới
router.post('/', (req, res) => {
    const newProblem = req.body;

    if (!newProblem.id || !newProblem.title || !newProblem.type || !newProblem.testcases || newProblem.testcases.length === 0) {
        return res.status(400).json({ error: 'Thiếu thông tin bài tập bắt buộc.' });
    }

    const problems = JSON.parse(fs.readFileSync(PROBLEMS_FILE));

    const exists = problems.find(p => p.id === newProblem.id);
    if (exists) {
        return res.status(409).json({ error: 'ID bài tập đã tồn tại.' });
    }

    problems.push(newProblem);
    fs.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2));

    res.json({ success: true, message: 'Tạo bài tập thành công.' });
});

// GET /api/problem - Lấy danh sách bài tập
router.get('/', (req, res) => {
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_FILE));
    res.json(problems);
});

// GET /api/problem/:id - Lấy thông tin bài tập theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_FILE));
    const problem = problems.find(p => p.id === id);

    if (!problem) {
        return res.status(404).json({ error: 'Không tìm thấy bài tập.' });
    }

    res.json(problem);
});

module.exports = router;
