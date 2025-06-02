import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

function Header() {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => {
        setMenuOpen(!isMenuOpen);
    };
    return (
        <header className='header'>
            <div className='left-group'>
                <NavLink to="/" className="logo">Name</NavLink>
                <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                    <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Trang chủ</NavLink>
                    <NavLink to="/problem" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Bài tập</NavLink>
                    <NavLink to="/contest" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Kỳ thi</NavLink>
                    <NavLink to="/management" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Hỏi & Đáp</NavLink>
                </nav>
            </div>

            <div className='auth-button'>
                <NavLink to="/login" className="login-button">Đăng nhập</NavLink>
                <NavLink to="/signup" className="signup-button">Đăng ký</NavLink>
            </div>

            <button className='menu-icon' onClick={toggleMenu}>☰</button>
        </header>

    );

}

export default Header