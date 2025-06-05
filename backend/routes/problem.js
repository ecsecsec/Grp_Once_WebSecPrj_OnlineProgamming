const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const authMiddleware = require('../middleware/auth');
const { defineAbilityForUser } = require('../abilities/defineAbility');

// @route   GET /api/problem/getall
router.get('/getall', async (req, res) => {
    try {
        const problems = await Problem.find({});
        res.json(problems);
    } catch (err) {
        console.error("Lỗi khi lấy tất cả bài tập:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách bài tập.' });
    }
});

// @route   GET /api/problem/myproblems
router.get('/myproblems', authMiddleware, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const ability = defineAbilityForUser(req.user);

        if (ability.cannot('read', 'Problem')) {
            return res.status(403).json({ message: 'Bạn không có quyền xem các bài tập này.' });
        }

        const problems = await Problem.find({ creatorId });
        res.json(problems);
    } catch (err) {
        console.error("Lỗi khi lấy bài tập của creator:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy bài tập của creator.' });
    }
});

// @route   POST /api/problem/create
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { id, title, detail, type, solvedBy, testcases, timeLimit, memoryLimit } = req.body;
        const creatorId = req.user.id;

        const ability = defineAbilityForUser(req.user);
        if (ability.cannot('create', 'Problem')) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo bài tập.' });
        }

        const newProblem = new Problem({
            id,
            title,
            type,
            detail,
            solvedBy: solvedBy || 0,
            creatorId,
            testcases,
            timeLimit,
            memoryLimit
        });

        const problem = await newProblem.save();
        res.status(201).json(problem);
    } catch (err) {
        console.error("Lỗi khi tạo bài tập:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ message: errors.join(', ') });
        }
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Mã bài tập (ID) đã tồn tại. Vui lòng chọn ID khác.' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo bài tập.' });
    }
});

// @route   GET /api/problem/:id
router.get('/:id', async (req, res) => {
    try {
        const problem = await Problem.findOne({ id: req.params.id });
        if (!problem) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập.' });
        }
        res.json(problem);
    } catch (err) {
        console.error("Lỗi khi lấy bài tập theo ID:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy bài tập.' });
    }
});

// @route   PUT /api/problem/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, detail, type, testcases, timeLimit, memoryLimit } = req.body;
        const problemId = req.params.id;

        const problem = await Problem.findOne({ id: problemId });
        if (!problem) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập để cập nhật.' });
        }

        const ability = defineAbilityForUser(req.user);
        if (ability.cannot('update', problem)) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật bài tập này.' });
        }

        if (title !== undefined) problem.title = title;
        if (detail !== undefined) problem.detail = detail;
        if (type !== undefined) problem.type = type;
        if (testcases !== undefined) problem.testcases = testcases;
        if (timeLimit !== undefined) problem.timeLimit = timeLimit;
        if (memoryLimit !== undefined) problem.memoryLimit = memoryLimit;

        await problem.save();
        res.json({ message: 'Bài tập đã được cập nhật.', problem });
    } catch (err) {
        console.error("Lỗi khi cập nhật bài tập:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật bài tập.' });
    }
});

// @route   DELETE /api/problem/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const problemId = req.params.id;

        const problem = await Problem.findOne({ id: problemId });
        if (!problem) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập để xóa.' });
        }

        const ability = defineAbilityForUser(req.user);
        if (ability.cannot('delete', problem)) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài tập này.' });
        }

        await Problem.deleteOne({ id: problemId });
        res.json({ message: 'Bài tập đã được xóa thành công.' });
    } catch (err) {
        console.error("Lỗi khi xóa bài tập:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa bài tập.' });
    }
});

module.exports = router;
