const express = require('express');
const router = express.Router();
const User = require('../../models/User'); // Đường dẫn đúng đến model User
const checkAbility = require('../../middleware/checkAbility');
const protect = require('../../middleware/protect');

// GET /api/admin/users
// Lấy danh sách tất cả user (trừ password)
router.get('/users', protect, checkAbility('manage', 'all'), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
  }
});

// PUT /api/admin/set-role/:id
// Đổi role user giữa 'creator' và 'user'
router.put('/set-role/:id', protect, checkAbility('manage', 'all'), async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    // Không cho đổi role admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể thay đổi quyền admin.' });
    }

    let newRole;
    if (user.role === 'creator') {
      newRole = 'user';
    } else {
      newRole = 'creator';
    }

    user.role = newRole;
    await user.save();

    res.json({
      message: `Cập nhật quyền thành công cho người dùng ${user.name}. Vai trò mới: ${newRole}`,
      user: {
        id: user._id,
        username: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Lỗi khi cập nhật quyền người dùng:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ.' });
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật quyền người dùng.' });
  }
});

// DELETE /api/admin/users/:id
// Xóa user, không cho xóa admin
router.delete('/users/:id', protect, checkAbility('manage', 'all'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Không thể xóa admin.' });

    await user.remove();
    res.json({ message: 'Xóa người dùng thành công.' });
  } catch (err) {
    console.error('Lỗi khi xóa người dùng:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ.' });
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa người dùng.' });
  }
});

module.exports = router;
