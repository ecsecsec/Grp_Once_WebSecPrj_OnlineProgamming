import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook

function Header() {
    const { user, isAuthenticated, logout, ability } = useAuth(); // Lấy thông tin user, trạng thái xác thực, hàm logout và ability từ useAuth

    // Đảm bảo currentUser và isLoggedIn luôn có giá trị mặc định để tránh lỗi
    const currentUser = user || null;
    const isLoggedIn = isAuthenticated || false;

    // Đảm bảo handleLogout luôn là một hàm để tránh lỗi gọi hàm không tồn tại
    const handleLogout = logout || (() => {});

    const [isMenuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!isMenuOpen);
    };

    const onLogoutClick = () => {
        handleLogout();
        setMenuOpen(false);
    };

    return (
        <header className='header'>
            <div className='left-group'>
                <NavLink to="/" className="logo">Name</NavLink>
                <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                    <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Trang chủ</NavLink>
                    <NavLink to="/problem" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Bài tập</NavLink>
                    {/* <NavLink to="/contest" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Kỳ thi</NavLink> */}
                    {/* <NavLink to="/management" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Hỏi & Đáp</NavLink> */}

                    {isLoggedIn && ability && ability.can('create', 'Problem') && ( // Kiểm tra quyền 'create' trên 'Problem'
                        <NavLink to="/byCreator" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Bài tập đã tạo</NavLink>
                    )}
                    {isLoggedIn && currentUser && currentUser.role === 'admin' && ( // Kiểm tra vai trò 'admin'
                        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Quản lý người dùng</NavLink>
                    )}
                </nav>
            </div>

            <div className='auth-button'>
                {isLoggedIn ? ( // Nếu đã đăng nhập
                    <>
                        <div className="user-info">
                            {/* Thay thế User Avatar và User Name bằng nút Thông tin người dùng */}
                            <NavLink
                                to="/management" // ✅ Dẫn đến trang /management
                                className="user-profile-link" // ✅ Thêm class để dễ dàng styling
                                onClick={() => setMenuOpen(false)} // Đóng menu nếu đang mở
                            >
                                <img
                                    src={currentUser.avatar || 'https://via.placeholder.com/40/007bff/FFFFFF?text=AV'} // Vẫn giữ avatar
                                    alt="User Avatar"
                                    className="user-avatar"
                                />
                                <span className="user-name">{currentUser.name || 'User'}</span> {/* Vẫn giữ tên người dùng */}
                                {/* Bạn có thể thay thế bằng text "Thông tin người dùng" nếu muốn */}
                                {/* <span>Thông tin người dùng</span> */}
                            </NavLink>
                            <button onClick={onLogoutClick} className="logout-button">Đăng xuất</button>
                        </div>
                    </>
                ) : ( // Nếu chưa đăng nhập
                    <>
                        <NavLink to="/login" className="login-button">Đăng nhập</NavLink>
                        <NavLink to="/signup" className="signup-button">Đăng ký</NavLink>
                    </>
                )}
            </div>

            <button className='menu-icon' onClick={toggleMenu}>☰</button>
        </header>
    );
}

export default Header;