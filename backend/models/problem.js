// backend/models/Problem.js
const mongoose = require('mongoose');

const TestcaseSchema = new mongoose.Schema({
    input: { type: String },
    expectedOutput: { type: String, required: true },
    isSample: {type: Boolean, default: false},
});


const ProblemSchema = new mongoose.Schema({

    title: { type: String, required: true}, // Đảm bảo title là unique để dễ tìm kiếm
    statement: { type: String, required: true }, // Đổi 'detail' thành 'statement' cho rõ nghĩa hơn (đề bài)
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

module.exports = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);