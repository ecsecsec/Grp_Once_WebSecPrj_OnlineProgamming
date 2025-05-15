import { useState } from "react";
import { Link } from "react-router-dom";
import './form.css';

function SignUp() {
    const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = e => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            alert("Mật khẩu không khớp!");
            return;
        }

        // Kiểm tra mật khẩu có đủ điều kiện không
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(form.password)) {
            alert("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái in hoa, chữ cái thường, số và ký tự đặc biệt.");
            return;
        }

        // Tiến hành đăng ký
        alert("Đăng ký thành công!");
        // Xử lý đăng ký tại đây (gửi yêu cầu API, v.v...)
    };

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Đăng ký</h2>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="username"
                    placeholder="Tên người dùng"
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
                <input
                    type="password"
                    name="confirm"
                    placeholder="Xác nhận mật khẩu"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Đăng ký</button>
                <p>
                    Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </form>
        </div>
    );
}

export default SignUp;
