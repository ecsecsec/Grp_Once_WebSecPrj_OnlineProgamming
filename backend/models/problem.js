// backend/models/Problem.js
const mongoose = require('mongoose');

const TestcaseSchema = new mongoose.Schema({
    input: { type: String }, // Nên là required: true nếu test case nào cũng phải có input
    expectedOutput: { type: String, required: true },
    isSample: {type: Boolean, default: false},
    // _id: false // Bỏ comment nếu không muốn _id cho sub-document này
});


const ProblemSchema = new mongoose.Schema({
    // id: { type: String, required: true, unique: true }, // MongoDB tự tạo _id dạng ObjectId, thường không cần trường 'id' riêng kiểu String.
                                                            // Nếu bạn muốn giữ 'id' này vì lý do nào đó (ví dụ import từ hệ thống cũ), thì oke.
                                                            // Nếu không, hãy bỏ nó đi và dùng _id.
    title: { type: String, required: true, unique: true }, // Đảm bảo title là unique để dễ tìm kiếm
    // type: { type: String }, // Có thể bỏ nếu không dùng, hoặc làm rõ mục đích
    statement: { type: String, required: true }, // Đổi 'detail' thành 'statement' cho rõ nghĩa hơn (đề bài)
    solvedByCount: { type: Number, default: 0 }, // Đổi 'solvedBy' thành 'solvedByCount' cho rõ nghĩa
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    successfulSolverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Thêm để lưu ai đã giải được
    testcases: [TestcaseSchema],
    timeLimit: {type: Number, required: true, default: 1000}, // Là ms
    memoryLimit: {type: Number, required: true, default: 256}, // Là MB
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }, // Thêm trường difficulty
    tags: [String], // Thêm trường tags
    isPublic: { type: Boolean, default: true }, // Thêm trường isPublic
}, { timestamps: true }); // timestamps tự thêm createdAt, updatedAt

// Nếu bạn giữ trường 'id' string và muốn nó tự tăng hoặc là một slug, cần logic riêng.
// Thông thường, sẽ dùng _id của MongoDB.

module.exports = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);