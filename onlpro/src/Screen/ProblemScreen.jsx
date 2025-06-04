import { Link } from "react-router-dom";
import React, {useState, useEffect} from "react";
import './Problem.css';
import { useAuth } from '../contexts/AuthContext'; // <--- Import useAuth

function ProblemScreen() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy thông tin xác thực và quyền từ AuthContext
    const { isAuthenticated, ability } = useAuth(); // <--- Lấy isAuthenticated và ability

    useEffect(() => {
        async function fetchProblems() {
            try {
                const res = await fetch('http://localhost:5000/api/problem/getall'); 
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setProblems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProblems();
    }, []);

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>Lỗi khi tải dữ liệu: {error}</p>;

    return (
        <div>
            {/* Chỉ hiển thị nút "Tạo bài tập" nếu:
                1. Người dùng đã đăng nhập (isAuthenticated là true)
                2. Đối tượng ability đã sẵn sàng (ability không null)
                3. Người dùng có quyền 'create' trên tài nguyên 'Problem' (ability.can('create', 'Problem'))
            */}
            {isAuthenticated && ability && ability.can('create', 'Problem') && ( // <--- Thêm điều kiện hiển thị
                <div className="problem-create">
                    <Link
                        to="/problem/create"
                        className="btn-create">
                        Tạo bài tập
                    </Link>
                </div>
            )}
            
            <div className="problem-grid">
                {problems.map((problem) => (
                    <Link
                        to={`/problem/${problem.id}`}
                        state={{ problem: problem }}
                        key={problem.id}
                        className="problem-card">

                        {/* Sử dụng placeholder nếu problem.image không tồn tại hoặc rỗng */}
                        <img 
                            src={problem.image || 'https://placehold.co/300x150/E0E0E0/333333?text=No+Image'} 
                            alt={problem.title} 
                        />
                        <div className="card-content">
                            <h3>{problem.title}</h3>
                            <p><strong>Mã:</strong> {problem.id}</p>
                            <p><strong>Dạng bài:</strong> {problem.type}</p>
                            <p><strong>Đã giải:</strong> {problem.solvedBy}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ProblemScreen;