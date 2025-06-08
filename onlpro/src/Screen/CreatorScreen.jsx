import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Problem.css'; // Đảm bảo các file CSS này tồn tại
import './CreatorScreen.css'; // Đảm bảo các file CSS này tồn tại
import { useAuth } from '../contexts/AuthContext';

function CreatorScreen() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user, isAuthenticated, ability } = useAuth();

    useEffect(() => {
        // console.log("CreatorScreen useEffect triggered.");
        // console.log("Is Authenticated:", isAuthenticated);
        // console.log("User:", user);
        // console.log("Ability object:", ability);

        // Kiểm tra đăng nhập và quyền hạn ngay khi component mount
        if (!isAuthenticated || !user) {
            setError("Bạn cần đăng nhập để truy cập trang này.");
            setLoading(false);
            return;
        }

        // Quyền 'create' Problem thường dùng để xác định xem có thể truy cập trang tạo bài không.
        // Đối với trang hiển thị danh sách bài đã tạo, quyền 'read' Problem là phù hợp hơn.
        // Tuy nhiên, vì route backend `/byCreator/:creatorId` yêu cầu quyền 'read' Problem,
        // việc kiểm tra 'create' ở đây có thể là một dấu hiệu bạn muốn hạn chế trang này chỉ cho "creator".
        // Nếu mục đích là xem danh sách bài của mình, 'read' là đủ.
        // Tôi sẽ giữ nguyên 'create' như bạn đã có để phù hợp với logic hiện tại của bạn.
        if (!ability || ability.cannot('create', 'Problem')) {
            setError("Bạn không có quyền truy cập trang này. (Bạn không phải Creator hoặc quyền của bạn chưa định nghĩa)");
            // console.log("Access denied: isAuthenticated", isAuthenticated, "user", user, "ability", ability);
            setLoading(false);
            return;
        }

        async function fetchCreatorProblems() {
            setLoading(true);
            setError(null);
            try {
                // console.log("Attempting to fetch problems for creator...");
                const token = localStorage.getItem('token');
                // console.log("Token available in localStorage:", !!token);

                if (!token) {
                    throw new Error("Không tìm thấy token xác thực.");
                }

                // Gọi API backend để lấy các bài tập của người tạo
                const res = await fetch(`http://localhost:5000/api/problem/byCreator/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // console.log("Response status for /api/problem/byCreator:", res.status);

                if (!res.ok) {
                    const errorData = await res.json();
                    console.error("Error response data from backend:", errorData);
                    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                // console.log("Fetched problems data successfully:", data);
                setProblems(data);
            } catch (err) {
                console.error("Error fetching creator problems in frontend:", err);
                setError(err.message || "Lỗi không xác định khi tải bài tập.");
            } finally {
                setLoading(false);
            }
        }

        // Chỉ fetch khi user và user.id đã có
        if (user && user.id) {
            fetchCreatorProblems();
        }
    }, [isAuthenticated, user, ability]); // Dependencies: Re-run when these values change

    const handleDelete = async (problemId) => {
        if (!window.confirm("Bạn có chắc muốn xóa bài tập này không?")) return;

        // KIỂM TRA QUYỀN TRÊN ĐỐI TƯỢNG CỤ THỂ
        // Tìm bài toán trong state để truyền vào hàm ability.can
        const problemToDelete = problems.find(p => p._id === problemId);
        if (!problemToDelete || ability.cannot('delete', problemToDelete)) {
            alert("Bạn không có quyền xóa bài tập này.");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/problem/${problemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Lỗi khi xóa bài tập");
            }
            // Cập nhật state sau khi xóa thành công
            setProblems(problems.filter(p => p._id !== problemId));
            alert("Bài tập đã được xóa thành công!");
        } catch (err) {
            alert("Lỗi: " + (err.message || "Lỗi không xác định khi xóa bài tập."));
            console.error("Error deleting problem:", err);
        }
    };

    if (loading) {
        return <p className="loading-message">Đang tải dữ liệu...</p>;
    }
    if (error) {
        return <p className="error-message">Lỗi khi tải dữ liệu: {error}</p>;
    }

    return (
        <div className="creator-screen-container">
            <h2>Bài tập bạn đã tạo</h2>
            {/* Nút tạo bài tập mới chỉ hiển thị nếu người dùng có quyền 'create' Problem */}
            {isAuthenticated && ability && ability.can('create', 'Problem') && (
                <div className="creator-create">
                    <Link to="/problem/create" className="btn-create">Tạo bài tập mới</Link>
                </div>
            )}

            {problems.length === 0 ? (
                <p>Bạn chưa tạo bài tập nào.</p>
            ) : (
                <div className="problem-grid">
                    {problems.map((problem) => (
                        <div key={problem._id} className="problem-card">
                            <img
                                src={problem.image || 'https://placehold.co/300x180/E0E0E0/333333?text=No+Image'}
                                alt={problem.title}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/300x180/E0E0E0/333333?text=No+Image"; }}
                            />
                            <div className="card-content">
                                <h3>{problem.title}</h3>
                                {/* Hiển thị các thông tin mới từ schema Problem */}
                                <p><strong>ID:</strong> {problem._id}</p> {/* _id là mặc định của MongoDB */}
                                <p><strong>Mức độ khó:</strong> <span className={`difficulty-${problem.difficulty}`}>{problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 'Chưa xác định'}</span></p>
                                <p><strong>Thời gian giới hạn:</strong> {problem.timeLimit / 1000} giây</p>
                                <p><strong>Bộ nhớ giới hạn:</strong> {problem.memoryLimit} MB</p>
                                <p><strong>Trạng thái:</strong> {problem.isPublic ? 'Công khai' : 'Riêng tư'}</p>
                                {problem.tags && problem.tags.length > 0 && (
                                    <p><strong>Tags:</strong> {problem.tags.join(', ')}</p>
                                )}
                                {/* `successfulSolverIds` là một mảng ObjectIds, .length sẽ cho số lượng người giải */}
                                <p><strong>Đã giải:</strong> {problem.successfulSolverIds ? problem.successfulSolverIds.length : 0} người</p>
                            </div>
                            <div className="btn-actions">
                                {/* Nút Sửa: Kiểm tra quyền 'update' trên đối tượng `problem` cụ thể */}
                                {isAuthenticated && ability && ability.can('update', problem) && (
                                    <button
                                        onClick={() => navigate(`/problem/edit/${problem._id}`, { state: { problem } })}
                                        className="btn-edit" // Thêm class cho nút sửa
                                    >
                                        Sửa
                                    </button>
                                )}
                                {/* Nút Xóa: Kiểm tra quyền 'delete' trên đối tượng `problem` cụ thể */}
                                {isAuthenticated && ability && ability.can('delete', problem) && (
                                    <button
                                        onClick={() => handleDelete(problem._id)}
                                        className="btn-delete"
                                    >
                                        Xóa
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CreatorScreen;