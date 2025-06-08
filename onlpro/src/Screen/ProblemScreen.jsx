import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import './Problem.css';
import { useAuth } from '../contexts/AuthContext';

function ProblemScreen() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy thông tin xác thực và quyền từ AuthContext
    const { isAuthenticated, ability } = useAuth();

    useEffect(() => {
        async function fetchProblems() {
            try {
                const res = await fetch('http://localhost:5000/api/problem/getall');
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setProblems(data);
                console.log("Dữ liệu problems từ API:", JSON.stringify(data, null, 2));
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
            {isAuthenticated && ability && ability.can('create', 'Problem') && (
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
                    // Sử dụng problem._id làm key và trong đường dẫn Link
                    <Link
                        to={`/problem/${problem._id}`} 
                        state={{ problem: problem }}
                        key={problem._id} 
                        className="problem-card">

                        {/* Sử dụng placeholder nếu problem.image không tồn tại hoặc rỗng */}
                        <img 
                            src={problem.image || 'https://placehold.co/300x150/E0E0E0/333333?text=No+Image'} 
                            alt={problem.title} 
                        />
                        <div className="card-content">
                            <h3>{problem.title}</h3>
                            {/* Loại bỏ dòng "Mã:" vì chúng ta không còn trường 'id' thủ công */}
                            {/* Loại bỏ dòng "Dạng bài:" vì trường 'type' đã bị loại bỏ */}
                            
                            {/* Hiển thị độ khó */}
                            <p><strong>Độ khó:</strong> {problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 'Chưa xác định'}</p>
                            
                            {/* Hiển thị số người đã giải thành công (sử dụng solvedByCount) */}
                            <p><strong>Đã giải:</strong> {problem.solvedByCount !== undefined ? problem.solvedByCount : 'N/A'}</p>
                            
                            {/* Hiển thị tags nếu có */}
                            {problem.tags && problem.tags.length > 0 && (
                                <p><strong>Thẻ:</strong> {problem.tags.join(', ')}</p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ProblemScreen;