// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Lấy token từ header Authorization (ví dụ: "Bearer eyJ...")
    const token = req.header('Authorization');

    // Kiểm tra nếu không có token
    if (!token) {
        return res.status(401).json({ message: 'Không có token, ủy quyền bị từ chối' });
    }

    // Token có dạng "Bearer <token_value>", cần cắt bỏ "Bearer "
    const tokenParts = token.split(' ');
    const tokenValue = tokenParts[1];

    if (!tokenValue) {
        return res.status(401).json({ message: 'Định dạng token không hợp lệ' });
    }

    try {
        // Xác minh token
        // Đảm bảo JWT_SECRET được định nghĩa trong biến môi trường hoặc file .env
        const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);

        // Gắn thông tin người dùng từ token đã giải mã vào req object
        // Đảm bảo token chứa id của người dùng và role (nếu có)
        // Ví dụ: decoded = { user: { id: 'someUserId123', role: 'admin' }, iat: ..., exp: ... }
        req.user = decoded.user; // <-- Đảm bảo bạn gán đúng phần chứa user info
        next(); // Chuyển sang middleware/route handler tiếp theo
    } catch (err) {
        // Lỗi xác minh token (hết hạn, không hợp lệ, ...)
        console.error('Token validation error:', err.message); // Log lỗi chi tiết
        res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};