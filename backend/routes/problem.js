// routes/problems.js
const express = require('express');
const router = express.Router();
const Problem = require('../models/problem');

// Tạo bài tập mới
router.post('/create', async (req, res) => {
    try {
        const problem = new Problem(req.body);
        await problem.save();
        res.status(201).json({ message: 'Problem created successfully', problem });
    } catch (err) {
        console.error('Error creating problem:', err);
        res.status(500).json({ error: err.message });
    }
});

// Lấy danh sách tất cả bài tập
router.get('/getproblem', async (req, res) => {
    try {
        const problems = await Problem.find();
        res.json(problems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy chi tiết một bài tập theo id
router.get('/getproblem/:id', async (req, res) => {
    try {
        const problem = await Problem.findOne({ id: req.params.id });
        if (!problem) return res.status(404).json({ error: 'Problem not found' });
        res.json(problem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
