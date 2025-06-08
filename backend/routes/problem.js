//backend/routes/problem.js
const express = require('express');
const router = express.Router();
const Problem = require('../models/problem');
const User = require('../models/user');
const authenticateToken  = require('../middleware/auth');
const checkAbility = require('../middleware/checkAbility');
const mongoose = require('mongoose')

// Helper function to handle common error responses
function handleServerError(res, err, messagePrefix = 'Server error') {
    console.error(`${messagePrefix}:`, err.message);
    res.status(500).json({ message: `${messagePrefix}: ${err.message}` });
}

// GET all problems - ai cũng đọc được
router.get('/getall', async (req, res) => {
    try {
        // Chỉ lấy các bài toán có isPublic là true
        const problems = await Problem.find({ isPublic: true })
            .populate('creatorId', 'username')
            .populate('successfulSolverIds', 'username');
        res.json(problems);
    } catch (err) {
        handleServerError(res, err, "Error fetching public problems");
    }
});

// ---
// GET one problem by ID
router.get('/:id', async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .populate('creatorId', 'username')
            .populate('successfulSolverIds', 'username');

        if (!problem) {
            return res.status(404).json({ message: 'Bài tập không tìm thấy.' });
        }

        // Nếu bài toán không public và người dùng không phải là người tạo hoặc admin, không cho phép truy cập
        if (!problem.isPublic && (!req.user || (req.user.role !== 'admin' && problem.creatorId.toString() !== req.user.id))) {
             return res.status(403).json({ message: 'Bạn không có quyền truy cập bài tập này.' });
        }

        res.json(problem);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ.' });
        }
        handleServerError(res, err, "Error fetching problem by ID");
    }
});

// ---
// GET problems by creatorId – yêu cầu đăng nhập & quyền đọc Problem
// Endpoint này sẽ hiển thị tất cả các bài của một creator, bao gồm cả bài private của họ
router.get('/byCreator/:creatorId', authenticateToken, checkAbility('read', 'Problem'), async (req, res) => {
    try {
        const { creatorId } = req.params;

        // Xác thực creatorId có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(creatorId)) {
            return res.status(400).json({ message: 'ID người tạo không hợp lệ.' });
        }

        // Chỉ admin hoặc chính creator mới xem được tất cả bài của creator đó
        if (req.user.role !== 'admin' && req.user.id !== creatorId) {
            return res.status(403).json({ message: 'Bạn không có quyền xem bài tập của người tạo này.' });
        }

        const problems = await Problem.find({ creatorId })
            .populate('creatorId', 'username')
            .populate('successfulSolverIds', 'username');

        res.json(problems);
    } catch (err) {
        handleServerError(res, err, "Error fetching problems by creator");
    }
});

// ---
// POST create problem – creator & admin
router.post('/create', authenticateToken, checkAbility('create', 'Problem'), async (req, res) => {
    // Đảm bảo các trường này khớp với schema Problem.js
    const { title, statement, testcases, timeLimit, memoryLimit, difficulty, tags, isPublic } = req.body;
    const creatorId = req.user.id; // Lấy ID người tạo từ token đã xác thực

    // Kiểm tra các trường bắt buộc
    if (!title || !statement || !timeLimit || !memoryLimit || !testcases || !testcases.length) {
        return res.status(400).json({ message: 'Thiếu trường bắt buộc: title, statement, timeLimit, memoryLimit, và ít nhất một testcase.' });
    }

    // Kiểm tra từng testcase có expectedOutput
    for (const tc of testcases) {
        if (tc.expectedOutput === undefined || tc.expectedOutput === null) {
            return res.status(400).json({ message: 'Mỗi testcase phải có Expected Output.' });
        }
    }

    // Đảm bảo difficulty là một trong các giá trị 'easy', 'medium', 'hard'
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ message: 'Mức độ khó không hợp lệ. Phải là "easy", "medium" hoặc "hard".' });
    }

    try {
        const newProblem = new Problem({
            title,
            statement,
            creatorId,
            testcases,
            timeLimit,
            memoryLimit,
            difficulty: difficulty || 'medium', // Đặt default nếu không được cung cấp
            tags: tags || [], // Đặt default là mảng rỗng nếu không được cung cấp
            isPublic: isPublic !== undefined ? isPublic : true, // Đặt default là true nếu không được cung cấp
        });

        const savedProblem = await newProblem.save();
        res.status(201).json(savedProblem);
    } catch (err) {
        // Xử lý lỗi trùng lặp title nếu bạn đặt title là unique trong schema
        if (err.code === 11000 && err.keyPattern && err.keyPattern.title) {
            return res.status(409).json({ message: 'Tên bài tập này đã tồn tại. Vui lòng chọn tên khác.' });
        }
        handleServerError(res, err, "Error creating problem");
    }
});

// ---
// PUT update problem – chỉ creator của bài hoặc admin
router.put('/:id', authenticateToken, checkAbility('update', 'Problem'), async (req, res) => {
    // Không cần lấy image nếu bạn không có trường đó trong model Problem.js
    const { title, statement, testcases, timeLimit, memoryLimit, difficulty, tags, isPublic } = req.body;

    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: 'Bài tập không tìm thấy.' });
        }

        // Kiểm tra quyền: chỉ creator hoặc admin mới có thể cập nhật
        if (req.user.role !== 'admin' && problem.creatorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật bài tập này.' });
        }

        // Cập nhật các trường, chỉ cập nhật những trường được gửi lên trong request body
        if (title) problem.title = title;
        if (statement) problem.statement = statement;
        if (testcases) {
            // Validate testcases if they are being updated
            if (!testcases.length) {
                return res.status(400).json({ message: 'Cập nhật testcase phải có ít nhất một testcase.' });
            }
            for (const tc of testcases) {
                if (tc.expectedOutput === undefined || tc.expectedOutput === null) {
                    return res.status(400).json({ message: 'Mỗi testcase cập nhật phải có Expected Output.' });
                }
            }
            problem.testcases = testcases;
        }
        if (timeLimit) problem.timeLimit = timeLimit;
        if (memoryLimit) problem.memoryLimit = memoryLimit;
        if (difficulty) {
            if (!['easy', 'medium', 'hard'].includes(difficulty)) {
                return res.status(400).json({ message: 'Mức độ khó không hợp lệ. Phải là "easy", "medium" hoặc "hard".' });
            }
            problem.difficulty = difficulty;
        }
        // Cho phép tags là mảng rỗng nếu muốn xóa hết tags
        if (tags !== undefined) problem.tags = tags;
        // Cho phép isPublic là false
        if (isPublic !== undefined) problem.isPublic = isPublic;


        const updatedProblem = await problem.save();
        res.json(updatedProblem);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ.' });
        }
        // Xử lý lỗi trùng lặp title nếu bạn đặt title là unique trong schema
        if (err.code === 11000 && err.keyPattern && err.keyPattern.title) {
            return res.status(409).json({ message: 'Tên bài tập này đã tồn tại. Vui lòng chọn tên khác.' });
        }
        handleServerError(res, err, "Error updating problem");
    }
});

// ---
// DELETE problem – chỉ creator của bài hoặc admin
router.delete('/:id', authenticateToken, checkAbility('delete', 'Problem'), async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: 'Bài tập không tìm thấy.' });
        }

        // Kiểm tra quyền: chỉ creator hoặc admin mới có thể xóa
        if (req.user.role !== 'admin' && problem.creatorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài tập này.' });
        }

        await Problem.deleteOne({ _id: req.params.id });
        res.json({ message: 'Bài tập đã được xóa thành công.' });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ.' });
        }
        handleServerError(res, err, "Error deleting problem");
    }
});

module.exports = router;