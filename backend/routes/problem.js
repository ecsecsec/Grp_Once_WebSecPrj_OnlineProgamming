const express = require('express');
const router = express.Router();
const Problem = require('../models/problem'); // Đảm bảo đường dẫn đúng đến model Problem của bạn

// Middleware để bảo vệ các route (tùy chọn, ví dụ: yêu cầu admin)
// const auth = require('../middleware/auth'); // Nếu bạn có middleware xác thực

// API: Tạo bài tập mới
// Route: POST /api/problem/create
// Yêu cầu: body { id, title, type, detail, solvedBy, testcases }
router.post('/create', async (req, res) => {
    try {
        const { id, title, type, detail, solvedBy, creatorId, testcases } = req.body;

        // Kiểm tra xem ID bài tập đã tồn tại chưa
        const existingProblem = await Problem.findOne({ id: id });
        if (existingProblem) {
            return res.status(409).json({ message: 'Problem ID already exists.' });
        }

        // Tạo một instance mới của Problem
        const newProblem = new Problem({
            id,
            title,
            type,
            detail,
            solvedBy: solvedBy || 0, // Mặc định là 0 nếu không được cung cấp
            creatorId,
            testcases: testcases || [] // Mặc định là mảng rỗng nếu không được cung cấp
        });

        // Lưu bài tập vào database
        const savedProblem = await newProblem.save();
        res.status(201).json({ message: 'Problem created successfully!', problem: savedProblem });
    } catch (error) {
        console.error('Error creating problem:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// API: Lấy danh sách tất cả bài tập
// Route: GET /api/problem/getall
router.get('/getall', async (req, res) => {
    try {
        // Lấy tất cả bài tập, chỉ bao gồm các trường cần thiết cho danh sách
        // Loại bỏ trường 'testcases' để tránh gửi dữ liệu nhạy cảm
        const problems = await Problem.find({}, 'id title type solvedBy');
        res.status(200).json(problems);
    } catch (error) {
        console.error('Error fetching all problems:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// API: Lấy chi tiết một bài tập theo id (trường id tùy chỉnh của bạn)
// Route: GET /api/problem/getproblem/:problemId
router.get('/getproblem/:problemId', async (req, res) => {
    try {
        const { problemId } = req.params;

        // RẤT QUAN TRỌNG: Sử dụng findOne với trường 'id' tùy chỉnh của bạn
        // KHÔNG DÙNG findById(problemId) ở đây vì problemId từ params là string "P001" (ví dụ)
        // chứ không phải _id (ObjectId) của MongoDB.
        const problem = await Problem.findOne({ id: problemId });

        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }
        
        // Trả về tất cả chi tiết bài tập, bao gồm cả testcases (frontend cần cái này để hiển thị ví dụ)
        res.status(200).json(problem);
    } catch (error) {
        console.error('Error fetching problem details:', error);
        // CastError sẽ xảy ra ở đây nếu bạn dùng findById và problemId không phải ObjectId
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid Problem ID format.' });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.get('/byCreator/:creatorId', async (req, res) => {
    try {
        const { creatorId } = req.params; // Lấy creatorId từ URL parameters

        // Kiểm tra xem creatorId có hợp lệ không (tùy thuộc vào định dạng creatorId của bạn)
        // Ví dụ: nếu creatorId là ObjectId, bạn có thể kiểm tra:
        // if (!mongoose.Types.ObjectId.isValid(creatorId)) {
        //     return res.status(400).json({ message: 'Invalid Creator ID format.' });
        // }

        // Tìm tất cả các bài tập có creatorId khớp
        // Lọc các trường tương tự như getall
        const problems = await Problem.find({ creatorId: creatorId }, 'id title type solvedBy creatorId');

        // Nếu không tìm thấy bài tập nào cho creatorId này, trả về mảng rỗng (không phải 404)
        // Vì có thể creatorId hợp lệ nhưng chưa tạo bài tập nào
        res.status(200).json(problems);
    } catch (error) {
        console.error('Error fetching problems by creator:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
module.exports = router;