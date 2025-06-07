// backend/models/Submission.js
const mongoose = require('mongoose');

const resultDetailSchema = new mongoose.Schema({
    test_case_index: { type: Number, required: true }, // Chỉ số của test case (0-based)
    status: { type: String, required: true }, // 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', etc.
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    time_ms: { type: Number, default: 0 },     // Thời gian chạy cho test case này (ước tính)
    memory_kb: { type: Number, default: 0 },   // Bộ nhớ sử dụng cho test case này (ước tính)
    // _id: false
});

const submissionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problem_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    language: { type: String, required: true, enum: ['python', 'c_cpp', 'java'] }, // Hoặc các ngôn ngữ bạn hỗ trợ trong LANG_CONFIG
    source_code: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error', 'Memory Limit Exceeded', 'System Error'],
        default: 'Pending',
    },
    result_details: [resultDetailSchema], // Kết quả chi tiết cho từng test case
    final_stdout: { type: String, default: '' },    // Stdout chung hoặc của test case lỗi đầu tiên
    final_stderr: { type: String, default: '' },    // Stderr chung (compile error) hoặc của test case lỗi đầu tiên
    compile_output: { type: String, default: '' }, // Output từ quá trình biên dịch
    execution_time_ms: { type: Number, default: 0 }, // Thời gian chạy tổng hoặc của TC lỗi đầu tiên
    memory_usage_kb: { type: Number, default: 0 },   // Bộ nhớ sử dụng tối đa (ước tính)
    submitted_at: { type: Date, default: Date.now },
}, { timestamps: true }); // timestamps sẽ tự thêm createdAt và updatedAt

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
