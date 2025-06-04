// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken'); // Không cần bcrypt ở đây nếu chỉ dùng cho token
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

module.exports = router;