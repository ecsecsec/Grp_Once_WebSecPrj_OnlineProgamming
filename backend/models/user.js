// backend/models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin', 'creator'],
    default: 'user'
  },
  solved_problem_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }]
}, { timestamps: true });

// Middleware để mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { // Chỉ hash nếu password bị thay đổi hoặc là mới
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Phương thức để so sánh mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);