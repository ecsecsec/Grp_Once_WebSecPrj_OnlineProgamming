import { useState } from 'react';
import './AccountManagement.css';

function AccountManagement() {
    const [username, setUsername] = useState('User123');
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleUpdateInfo = () => {
        setMessage('Thông tin đã được cập nhật!');
    };

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            setMessage('Mật khẩu mới không khớp!');
        } else {
            setMessage('Mật khẩu đã được thay đổi!');
        }
    };

    const handleLogout = () => {
        //
        setMessage('Đã đăng xuất!');
    };

    return (
        <div className="account-management">
            <h2>Quản lý tài khoản</h2>
            <div className="account-info">
                <h3>Thông tin cá nhân</h3>
                <label>Tên người dùng:</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleUpdateInfo}>Cập nhật thông tin</button>
            </div>

            <div className="change-password">
                <h3>Đổi mật khẩu</h3>
                <label>Mật khẩu cũ:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <label>Mật khẩu mới:</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <label>Nhập lại mật khẩu mới:</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button onClick={handleChangePassword}>Đổi mật khẩu</button>
            </div>

            <div className="logout">
                <button onClick={handleLogout}>Đăng xuất</button>
            </div>

            {message && <div className="message">{message}</div>}
        </div>
    );
}

export default AccountManagement;
