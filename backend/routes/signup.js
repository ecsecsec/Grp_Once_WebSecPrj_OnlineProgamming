const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Đăng ký tài khoản mới
router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email đã được đăng ký' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ msg: 'Đăng ký thành công!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Lỗi server' });
  }
});

module.exports = router;