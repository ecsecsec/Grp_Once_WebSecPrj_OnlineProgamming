import { useState } from "react";
import { Link } from "react-router-dom";
import './form.css';

function Login(){
    const [form, setForm] = useState({username: '', password: ''});

    const handleChange = e => {
        setForm({...form, [e.target.name]: e.targer.value});
    };
    const handleSubmit = e => {
        e.preventDefault();
    }

    return(
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Đăng nhập</h2>
                <input 
                    type="username"
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
                    Chưa có tài khoản? <Link to="/signup">Đăng ký</Link>
                </p>
            </form>
        </div>
    );
}

export default Login