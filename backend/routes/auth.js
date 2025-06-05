// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken'); // Không cần bcrypt ở đây nếu chỉ dùng cho token
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'Email đã được đăng ký' });
        }
        existingUser = await User.findOne({ name: name });
        if (existingUser) {
            return res.status(400).json({ msg: 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.' });
        }

        // Mật khẩu sẽ được mã hóa tự động bởi pre('save') hook trong User model
        const newUser = new User({
            name,
            email,
            password, // <--- TRUYỀN THẲNG PASSWORD, KHÔNG CẦN HASH Ở ĐÂY
            role: role || 'user',
        });

        await newUser.save(); // pre('save') hook sẽ chạy ở đây

        const payload = { user: { id: newUser._id, role: newUser.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
        });
    } catch (error) {
        console.error('Error during registration:', error); // Log lỗi chi tiết
        return res.status(500).json({ msg: 'Lỗi server khi đăng ký' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        console.log('Login attempt for name:', name); // <--- Thêm log
        const user = await User.findOne({ name: name });
        if (!user) {
            console.log('User not found with name:', name); // <--- Thêm log
            return res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        console.log('User found:', user.name); // <--- Thêm log
        console.log('Stored hashed password in DB:', user.password); // <--- Thêm log để kiểm tra hash

        // Sử dụng phương thức matchPassword từ User model
        const isMatch = await user.matchPassword(password);
        console.log('Password match result:', isMatch); // <--- Thêm log

        if (!isMatch) {
            return res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const payload = { user: { id: user._id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
        });
    } catch (error) {
        console.error('Error during login:', error); // Log lỗi chi tiết
        res.status(500).json({ msg: 'Lỗi server khi đăng nhập' });
    }
});

// ... (Giữ nguyên route /me và module.exports) ...
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi máy chủ khi lấy thông tin người dùng.');
    }
});
// ✅ PUT /api/auth/profile - Cập nhật thông tin cá nhân
// Lưu ý: Không thể cập nhật avatar nếu model user.js không có trường 'avatar'
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body; // ❌ Bỏ avatar vì model user.js không có
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy' });
        }

        // Cập nhật thông tin nếu có
        if (name) user.name = name;
        if (email) user.email = email;
        // if (avatar) user.avatar = avatar; // ❌ Không thể cập nhật avatar

        await user.save(); // Lưu thay đổi

        // Trả về thông tin người dùng đã cập nhật (không kèm mật khẩu và avatar)
        res.json({ 
            message: 'Thông tin hồ sơ đã được cập nhật', 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                // avatar: user.avatar // ❌ Không trả về avatar
            }
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin hồ sơ:', error);
        // Kiểm tra lỗi trùng email/tên nếu có validation ở model
        if (error.code === 11000) { // Duplicate key error (MongoDB E11000)
            let errorMessage = 'Thông tin cập nhật bị trùng lặp.';
            if (error.keyPattern.email) errorMessage = 'Email đã tồn tại. Vui lòng chọn email khác.';
            if (error.keyPattern.name) errorMessage = 'Tên người dùng đã tồn tại. Vui lòng chọn tên khác.';
            return res.status(400).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ.' });
    }
});

// ✅ PUT /api/auth/change-password - Đổi mật khẩu
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy.' });
        }

        // 1. So sánh mật khẩu cũ
        const isMatch = await user.matchPassword(oldPassword); // Giả sử User model có phương thức này
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
        }

        // 2. Hash mật khẩu mới và lưu
        // Mật khẩu sẽ được mã hóa tự động bởi pre('save') hook trong User model khi user.password được gán giá trị mới
        user.password = newPassword; 
        await user.save(); // Lưu thay đổi

        res.json({ message: 'Mật khẩu đã được thay đổi thành công.' });
    } catch (error) {
        console.error('Lỗi server khi đổi mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu.' });
    }
});


module.exports = router;