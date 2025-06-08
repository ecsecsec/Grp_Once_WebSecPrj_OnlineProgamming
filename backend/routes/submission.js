// backend/routes/submissionRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); 
const { createSubmission } = require('../services/submissionService');
const Submission = require('../models/Submission');
const mongoose = require('mongoose'); 

// POST /api/submissions - Tạo submission mới
// Sử dụng authMiddleware đã import
router.post('/', authMiddleware, // Middleware xác thực vẫn giữ nguyên
    [ // Mảng các middleware validation
        body('problemId', 'Problem ID is required').not().isEmpty().trim().isMongoId(), // Kiểm tra là MongoId hợp lệ
        body('language', 'Language is required').not().isEmpty().trim().isIn(['python', 'c_cpp', 'java']), // Chỉ cho phép các ngôn ngữ hỗ trợ
        body('source_code', 'Source code is required').not().isEmpty() // Không trim() source code
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Nếu không có lỗi validation, tiếp tục logic nộp bài của bạn
        const { problemId, language, source_code } = req.body;
        const userId = req.user.id; // Hoặc req.user._id tùy theo token của bạn

        // if (!mongoose.Types.ObjectId.isValid(problemId)) { // Không cần nữa vì isMongoId() đã kiểm tra
        //    return res.status(400).json({ message: 'Invalid problemId format' });
        // }

        try {
            const submission = await createSubmission({ userId, problemId, language, source_code });
            res.status(201).json({
                message: 'Submission received and is being processed.',
                submissionId: submission._id,
            });
        } catch (error) {
            // ... (xử lý lỗi của bạn như cũ)
            console.error('Error creating submission route:', error);
            if (error.message.includes('Problem not found') || error.message.includes('Language not supported')) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error while creating submission.' });
        }
    }
);

// GET /api/submissions/:id/status - Lấy trạng thái của một submission
// Sử dụng authMiddleware đã import
router.get('/:id/status', authMiddleware, async (req, res) => { // <--- SỬA Ở ĐÂY: đổi protect thành authMiddleware
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid submission ID format' });
        }
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Kiểm tra quyền: user chỉ xem được bài của mình, admin/creator có thể xem nhiều hơn
        // Dựa vào req.user.id và req.user.role (nếu có trong token và được gán bởi auth.js)
        if (!req.user || !req.user.id) { // <--- SỬA Ở ĐÂY
             console.error('User ID not found in token payload for status check');
             return res.status(401).json({ message: 'User information not found in token.' });
        }

        // Nếu token của bạn có trường role: const userRole = req.user.role;
        // if (submission.user_id.toString() !== req.user.id.toString() && userRole === 'user') { // <--- SỬA Ở ĐÂY
        // Ví dụ đơn giản hơn, nếu không có role trong token hoặc không cần phân quyền phức tạp:
        if (submission.user_id.toString() !== req.user.id.toString()) {
            // Kiểm tra thêm nếu là admin thì cho phép (nếu token có role)
            // if (!req.user.role || req.user.role !== 'admin') {
            //    return res.status(403).json({ message: 'Not authorized to view this submission' });
            // }
             return res.status(403).json({ message: 'Not authorized to view this submission' });
        }


        res.json(submission);
    } catch (error) {
        console.error(`Error fetching status for submission ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;