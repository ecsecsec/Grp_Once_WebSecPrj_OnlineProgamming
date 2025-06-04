import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../contexts/AuthContext'; 

function Header() {
    const { user, isAuthenticated, logout, ability } = useAuth(); 

    const currentUser = user || null;
    const isLoggedIn = isAuthenticated || false;

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
                    <NavLink to="/management" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Hỏi & Đáp</NavLink>
                    
                    {isLoggedIn && ability && ability.can('create', 'Problem') && ( 
                        <NavLink to="/byCreator" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Bài tập đã tạo</NavLink>
                    )}
                    {isLoggedIn && currentUser && currentUser.role === 'admin' && ( 
                           <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Quản lý người dùng</NavLink>
                    )}
                </nav>
            </div>

            <div className='auth-button'>
                {isLoggedIn ? ( 
                    <>
                        <div className="user-info">
                            <img 
                                src={currentUser.avatar || 'https://via.placeholder.com/40/007bff/FFFFFF?text=AV'} 
                                alt="User Avatar" 
                                className="user-avatar" 
                            />
                            <span className="user-name">{currentUser.name || 'User'}</span> 
                            <button onClick={onLogoutClick} className="logout-button">Đăng xuất</button>
                        </div>
                    </>
                ) : ( 
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