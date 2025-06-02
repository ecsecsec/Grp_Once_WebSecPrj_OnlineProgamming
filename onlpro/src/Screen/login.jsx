import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './form.css';

function Login() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.msg || 'Đăng nhập thất bại');
                return;
            }

            // Lưu token và thông tin user
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Điều hướng sang trang chính
            navigate('/home');

        } catch (err) {
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
                    name="username"
                    placeholder="Tên tài khoản"
                    value={form.username}
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
