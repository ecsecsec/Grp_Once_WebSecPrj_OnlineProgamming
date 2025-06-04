const express = require('express');
const router = express.Router();
// Đảm bảo đường dẫn và tên file đúng. Nếu model là Problem.js, nên import là Problem.
const Problem = require('../models/Problem'); // <-- SỬA: Problem (chữ P hoa) và đảm bảo path đúng
const authMiddleware = require('../middleware/auth');
// Đảm bảo đường dẫn đúng. Nếu file là defineAbility.js trong thư mục utils
// thì có thể là: const { defineAbilityForUser } = require('../utils/ability');
const { defineAbilityForUser } = require('../abilities/defineAbility'); // <-- SỬA: Đường dẫn và tên file

// @route   GET /api/problem/getall
// @desc    Lấy tất cả các bài tập (Public)
// @access  Public
router.get('/getall', async (req, res) => {
    try {
        const problems = await Problem.find({});
        res.json(problems);
    } catch (err) {
        console.error("Lỗi khi lấy tất cả bài tập:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách bài tập.' }); // <-- SỬA: .json()
    }
});

// @route   GET /api/problem/myproblems
// @desc    Lấy tất cả các bài tập do người dùng hiện tại (creator) tạo
// @access  Private (Chỉ creator)
router.get('/myproblems', authMiddleware, async (req, res) => {
    try {
        const creatorId = req.user.id;
        console.log(`Fetching problems for creator: ${creatorId}`);

        const ability = defineAbilityForUser(req.user);
        // Kiểm tra quyền 'read' trên 'Problem' cho user hiện tại.
        // CASL rules 'read' Problem có thể không cần điều kiện {creatorId: user.id} nếu bạn muốn user đọc mọi problem
        // Nhưng nếu bạn muốn chỉ đọc problem của mình thì:
        // if (ability.cannot('read', 'Problem', { creatorId: creatorId })) {
        //     return res.status(403).json({ message: 'Bạn không có quyền xem các bài tập này.' });
        // }
        // Rule defineAbilityForUser chỉ có can('read', 'Problem') chung chung
        // Vì vậy, kiểm tra quyền read trên 'Problem' không cần tham số thứ 3 ở đây
        if (ability.cannot('read', 'Problem')) { // <-- Đảm bảo logic CASL khớp với defineAbility
             return res.status(403).json({ message: 'Bạn không có quyền xem các bài tập này.' });
        }


        const problems = await Problem.find({ creatorId: creatorId });
        res.json(problems);
    } catch (err) {
        console.error("Lỗi khi lấy bài tập của creator:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy bài tập của creator.' }); // <-- SỬA: .json()
    }
});

// @route   POST /api/problem/create
// @desc    Tạo bài tập mới
// @access  Private (Chỉ creator)
router.post('/create', authMiddleware, async (req, res) => {
    try {
        // Lấy các trường từ req.body. Đảm bảo tên trường khớp với frontend và schema
        const { id, title, detail, type, solvedBy, testcases, image, difficulty } = req.body; // <-- SỬA: 'solvedBy' thay vì 'solveBy', thêm 'image' và 'difficulty' nếu có
        const creatorId = req.user.id;

        console.log("Backend received req.body for create:", req.body);
        console.log("Extracted id for problem creation:", id);

        const ability = defineAbilityForUser(req.user);
        if (ability.cannot('create', 'Problem')) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo bài tập.' });
        }

        const newProblem = new Problem({
            id,
            title,
            type,
            detail,
            solvedBy: solvedBy || 0, // <-- SỬA: solvedBy và cung cấp giá trị mặc định nếu không có
            creatorId,
            testcases,
            image,      // <-- Thêm nếu có trong schema
            difficulty // <-- Thêm nếu có trong schema
        });

        const problem = await newProblem.save();
        res.status(201).json(problem);
    } catch (err) {
        console.error("Lỗi khi tạo bài tập (Backend):", err); // Log lỗi chi tiết
        // Luôn trả về JSON cho các lỗi
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            // Xử lý lỗi trùng lặp ID (unique: true)
            if (err.code === 11000) {
                return res.status(409).json({ message: 'Mã bài tập (ID) này đã tồn tại. Vui lòng chọn một ID khác.' });
            }
            return res.status(400).json({ message: errors.join(', ') });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo bài tập.' }); // <-- SỬA: .json()
    }
});

// @route   GET /api/problem/:id
// @desc    Lấy một bài tập cụ thể bằng ID (MongoDB _id)
// @access  Public (hoặc private tùy yêu cầu)
router.get('/:id', async (req, res) => {
    try {
        const problem = await Problem.findOne({id: req.params.id}); // <-- SỬ DỤNG _id của MongoDB
        // Nếu bạn muốn tìm bằng 'id' tùy chỉnh của mình (ví dụ P001), bạn cần dùng:
        // const problem = await Problem.findOne({ id: req.params.id });

        if (!problem) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập.' });
        }
        res.json(problem);
    } catch (err) {
        console.error("Lỗi khi lấy bài tập theo ID:", err.message);
        if (err.kind === 'ObjectId') { // Lỗi nếu ID không đúng định dạng ObjectId của MongoDB
            return res.status(400).json({ message: 'ID bài tập không hợp lệ.' }); // <-- SỬA: 400 Bad Request
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy bài tập.' }); // <-- SỬA: .json()
    }
});

// @route   PUT /api/problem/:id
// @desc    Cập nhật bài tập
// @access  Private (Chỉ creator sở hữu bài tập hoặc admin)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        // Đảm bảo các trường này khớp với schema và formData của frontend
        const { title, detail, type, difficulty, testcases, image } = req.body; // <-- SỬA: 'detail' thay vì 'description'

        const problemId = req.params.id; // Đây là MongoDB _id

        let problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập để cập nhật.' });
        }

        const ability = defineAbilityForUser(req.user);
        if (ability.cannot('update', problem)) { // CASL kiểm tra trực tiếp đối tượng
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật bài tập này.' });
        }
        
        // Cập nhật các trường chỉ khi chúng được cung cấp trong request body
        if (title !== undefined) problem.title = title;
        if (detail !== undefined) problem.detail = detail; // <-- SỬA: 'detail'
        if (type !== undefined) problem.type = type;
        if (difficulty !== undefined) problem.difficulty = difficulty;
        if (testcases !== undefined) problem.testcases = testcases;
        if (image !== undefined) problem.image = image;

        await problem.save();
        res.json({ message: 'Bài tập đã được cập nhật.', problem });

    } catch (err) {
        console.error("Lỗi khi cập nhật bài tập:", err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ.' }); // <-- SỬA: 400 Bad Request
        }
        if (err.name === 'ValidationError') { // Thêm xử lý lỗi validation nếu người dùng gửi dữ liệu không hợp lệ khi update
             const errors = Object.values(err.errors).map(el => el.message);
             return res.status(400).json({ message: errors.join(', ') });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật bài tập.' }); // <-- SỬA: .json()
    }
});

// @route   DELETE /api/problem/:id
// @desc    Xóa bài tập
// @access  Private (Chỉ creator sở hữu bài tập hoặc admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const problemId = req.params.id;

        let problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập để xóa.' });
        }

        const ability = defineAbilityForUser(req.user);
        if (ability.cannot('delete', problem)) { // CASL kiểm tra trực tiếp đối tượng
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài tập này.' });
        }

        await Problem.deleteOne({ _id: problemId });
        res.json({ message: 'Bài tập đã được xóa thành công.' });

    } catch (err) {
        console.error("Lỗi khi xóa bài tập:", err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ.' }); // <-- SỬA: 400 Bad Request
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa bài tập.' }); // <-- SỬA: .json()
    }
});

module.exports = router;