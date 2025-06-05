import React, { useState, useEffect } from 'react';
import './AccountManagement.css';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import axios from 'axios'; // Import axios để gọi API
import { useNavigate } from 'react-router-dom'; // Import useNavigate để điều hướng

function AccountManagement() {
    // Lấy user, isAuthenticated, và logout từ AuthContext
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate(); // Sử dụng hook navigate

    // State cho thông tin người dùng để chỉnh sửa
    const [currentUsername, setCurrentUsername] = useState('');
    const [currentEmail, setCurrentEmail] = useState('');
    const [currentAvatar, setCurrentAvatar] = useState(''); // Thêm state cho avatar

    // State cho form đổi mật khẩu
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // State để điều khiển việc hiển thị form đổi mật khẩu
    const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);

    // State cho thông báo lỗi/thành công
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Đặt thông tin người dùng hiện tại khi component mount hoặc user thay đổi
        if (user) {
            setCurrentUsername(user.name || '');
            setCurrentEmail(user.email || '');
            setCurrentAvatar(user.avatar || '');
        } else {
            // Nếu không có user, điều hướng về trang đăng nhập hoặc trang chủ
            // (Bạn có thể bỏ qua nếu đã có PrivateRoute hoặc logic bảo vệ route này)
            if (!isAuthenticated) {
                navigate('/login'); // Điều hướng nếu chưa xác thực
            }
        }
    }, [user, isAuthenticated, navigate]); // Chạy lại khi user hoặc isAuthenticated thay đổi

    // Headers cho request API (bao gồm Authorization token)
    const getAuthConfig = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
            return null;
        }
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };
    };

    // --- Xử lý cập nhật thông tin cá nhân ---
    const handleUpdateInfo = async (e) => {
        e.preventDefault(); // Ngăn chặn reload trang
        setMessage('');
        setError('');

        const config = getAuthConfig();
        if (!config) return;

        try {
            const response = await axios.put(`http://localhost:5000/api/auth/profile`, {
                name: currentUsername,
                email: currentEmail,
                avatar: currentAvatar // Gửi cả avatar nếu có
            }, config);

            // Cập nhật lại user trong AuthContext nếu API trả về user mới
            // (Giả sử AuthContext.login có thể cập nhật user info hoặc bạn có hàm setUser trong context)
            // Nếu AuthContext không có hàm setUser, bạn cần điều chỉnh AuthContext để có thể cập nhật
            // Hoặc đơn giản là refetch user data sau khi update thành công nếu user object trong context là stale
            // Ví dụ: user.name = response.data.user.name; user.email = response.data.user.email;
            // Tốt nhất là AuthContext nên có hàm để update user state.
            // Ví dụ: if (typeof user.updateUser === 'function') user.updateUser(response.data.user);
            // Hiện tại, ta chỉ cập nhật state cục bộ.

            setMessage('Thông tin cá nhân đã được cập nhật thành công!');
        } catch (err) {
            console.error('Lỗi khi cập nhật thông tin:', err.response || err);
            setError(err.response?.data?.message || 'Không thể cập nhật thông tin.');
        }
    };

    // --- Xử lý đổi mật khẩu ---
    const handleChangePassword = async (e) => {
        e.preventDefault(); // Ngăn chặn reload trang
        setMessage('');
        setError('');

        if (newPassword !== confirmNewPassword) {
            setError('Mật khẩu mới không khớp với xác nhận mật khẩu.');
            return;
        }

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            setError('Vui lòng điền đầy đủ các trường mật khẩu.');
            return;
        }

        const config = getAuthConfig();
        if (!config) return;

        try {
            await axios.put(`http://localhost:5000/api/auth/change-password`, {
                oldPassword,
                newPassword,
            }, config);

            setMessage('Mật khẩu đã được thay đổi thành công!');
            // Xóa các trường mật khẩu sau khi đổi thành công
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowChangePasswordForm(false); // Ẩn form đổi mật khẩu
        } catch (err) {
            console.error('Lỗi khi đổi mật khẩu:', err.response || err);
            setError(err.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu cũ.');
        }
    };

    // --- Xử lý đăng xuất ---
    const handleLogout = () => {
        logout(); // Gọi hàm logout từ AuthContext
        navigate('/login'); // Điều hướng về trang đăng nhập sau khi đăng xuất
    };

    if (!user) {
        // Có thể hiển thị loading hoặc không có quyền truy cập nếu user chưa load
        // Điều hướng đã được xử lý trong useEffect
        return <div className="account-management"><p>Đang tải thông tin hoặc không có quyền truy cập...</p></div>;
    }

    return (
        <div className="account-management">
            <h2>Quản lý tài khoản</h2>

            {/* Thông báo lỗi/thành công */}
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="account-info-section">
                <h3>Thông tin cá nhân</h3>
                <form onSubmit={handleUpdateInfo}>
                    <div className="form-group">
                        <label htmlFor="username">Tên người dùng:</label>
                        <input
                            id="username"
                            type="text"
                            value={currentUsername}
                            onChange={(e) => setCurrentUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            id="email"
                            type="email"
                            value={currentEmail}
                            onChange={(e) => setCurrentEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="avatar">URL Avatar:</label>
                        <input
                            id="avatar"
                            type="text"
                            value={currentAvatar}
                            onChange={(e) => setCurrentAvatar(e.target.value)}
                            placeholder="Dán URL ảnh avatar tại đây"
                        />
                    </div>
                    <button type="submit" className="update-info-button">Cập nhật thông tin</button>
                </form>
            </div>

            {/* Nút để hiện/ẩn phần đổi mật khẩu */}
            <div className="password-section-toggle">
                <button
                    onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
                    className="toggle-password-form-button"
                >
                    {showChangePasswordForm ? 'Ẩn phần đổi mật khẩu' : 'Đổi mật khẩu'}
                </button>
            </div>


            {/* Phần đổi mật khẩu (hiện khi showChangePasswordForm là true) */}
            {showChangePasswordForm && (
                <div className="change-password-section">
                    <h3>Đổi mật khẩu</h3>
                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label htmlFor="oldPassword">Mật khẩu cũ:</label>
                            <input
                                id="oldPassword"
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newPassword">Mật khẩu mới:</label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmNewPassword">Nhập lại mật khẩu mới:</label>
                            <input
                                id="confirmNewPassword"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="change-password-button">Xác nhận đổi mật khẩu</button>
                    </form>
                </div>
            )}

            {/* Nút đăng xuất (luôn hiển thị ở dưới cùng) */}
            <div className="logout-section">
                <button onClick={handleLogout} className="logout-button">Đăng xuất</button>
            </div>
        </div>
    );
}

export default AccountManagement;