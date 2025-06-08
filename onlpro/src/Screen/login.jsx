import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './form.css';
import { useAuth } from '../contexts/AuthContext'; // <--- Thêm dòng này

function Login() {
    const [form, setForm] = useState({ name: '', password: '' }); // <--- Đổi 'username' thành 'name'
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth(); // <--- Lấy hàm login từ AuthContext

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form) // form giờ đây chứa { name: '...', password: '...' }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.msg || 'Đăng nhập thất bại');
                return;
            }

            // Gọi hàm login từ AuthContext để xử lý token và user
            login(data.token, data.user); // <--- Sử dụng hàm login từ context

            // Điều hướng sang trang chính
            navigate('/home');

        } catch (err) {
            console.error('Lỗi đăng nhập:', err); // Log lỗi chi tiết hơn
            setError('Lỗi kết nối đến server');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Đăng nhập</h2>
                {error && <p className="error">{error}</p>}
                <input
                    type="text"
                    name="name" // <--- Đổi 'username' thành 'name'
                    placeholder="Tên tài khoản"
                    value={form.name} // <--- Đổi form.username thành form.name
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Mật khẩu"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Đăng nhập</button>
                <p>
                    Chưa có tài khoản? <a href="/signup">Đăng ký</a>
                </p>
            </form>
        </div>
    );
}

export default Login;