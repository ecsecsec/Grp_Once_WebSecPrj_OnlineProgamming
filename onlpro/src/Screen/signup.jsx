import { useState } from "react";
import { Link } from "react-router-dom";
import './form.css';

function SignUp() {
    const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
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

        try {
            const res = await fetch("http://localhost:5000/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.username,
                    email: form.email,
                    password: form.password
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ Đăng ký thành công!");
                // Chuyển hướng sang login nếu muốn
                // navigate("/login");
            } else {
                alert("❌ Lỗi: " + data.msg);
            }
        } catch (err) {
            alert("❌ Đăng ký thất bại: " + err.message);
        }
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
