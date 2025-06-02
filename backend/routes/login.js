// routes/login.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Đăng nhâoj
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;
     
    //Kiểm tra username
    const user = await User.findOne({ name: username });
    if (!user) {
      return res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    //Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});

module.exports = router;
