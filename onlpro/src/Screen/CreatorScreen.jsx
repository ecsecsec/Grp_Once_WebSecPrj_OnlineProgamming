import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Problem.css'; // Đảm bảo CSS này tồn tại
import './CreatorScreen.css'; // Đảm bảo CSS này tồn tại
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

function CreatorScreen() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user, isAuthenticated, ability } = useAuth(); // Lấy user, isAuthenticated, ability từ AuthContext

    useEffect(() => {
        console.log("CreatorScreen useEffect triggered.");
        console.log("Is Authenticated:", isAuthenticated);
        console.log("User:", user);
        console.log("Ability object:", ability);

        // Kiểm tra quyền truy cập trang ban đầu
        // Đảm bảo ability không null/undefined trước khi gọi .can()
        if (!isAuthenticated || !user) {
            setError("Bạn cần đăng nhập để truy cập trang này.");
            setLoading(false);
            return;
        }

        // Đợi ability được khởi tạo nếu nó vẫn chưa sẵn sàng
        // Hoặc kiểm tra quyền 'create' chung cho 'Problem' để xem người dùng có vai trò creator không
        if (!ability || ability.cannot('create', 'Problem')) { // can('create', 'Problem') là để kiểm tra role Creator
            setError("Bạn không có quyền truy cập trang này. (Không phải Creator hoặc quyền chưa định nghĩa)");
            console.log("Access denied: isAuthenticated", isAuthenticated, "user", user, "ability", ability);
            setLoading(false);
            return;
        }

        async function fetchCreatorProblems() {
            setLoading(true); // Đặt loading về true khi bắt đầu fetch
            setError(null);   // Xóa lỗi cũ
            try {
                console.log("Attempting to fetch problems for creator...");
                const token = localStorage.getItem('token');
                console.log("Token available in localStorage:", !!token);

                if (!token) {
                    throw new Error("Không tìm thấy token xác thực.");
                }

                // Tùy chọn: Sử dụng route /myproblems, backend sẽ tự lấy creatorId từ token
                const res = await fetch('http://localhost:5000/api/problem/myproblems', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Gửi token để xác thực
                    }
                });

                console.log("Response status for /api/problem/myproblems:", res.status);

                if (!res.ok) {
                    const errorData = await res.json(); // Cố gắng đọc thông báo lỗi từ response JSON
                    console.error("Error response data from backend:", errorData);
                    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                console.log("Fetched problems data successfully:", data);
                setProblems(data);
            } catch (err) {
                console.error("Error fetching creator problems in frontend:", err);
                setError(err.message || "Lỗi không xác định khi tải bài tập.");
            } finally {
                setLoading(false);
            }
        }

        fetchCreatorProblems();
    }, [isAuthenticated, user, ability]); // Dependencies: Refetch khi trạng thái xác thực, user hoặc ability thay đổi

    const handleDelete = async (problemId) => {
        if (!window.confirm("Bạn có chắc muốn xóa bài tập này không?")) return;

        // Kiểm tra quyền xóa trước khi gửi request
        // Lưu ý: ability.can('delete', 'Problem', { creatorId: user.id }) là kiểm tra trên class của Problem
        // Để kiểm tra trên một instance cụ thể (bài tập này), bạn cần fetch bài tập đó hoặc truyền nó vào
        // Tuy nhiên, vì bạn đã kiểm tra ở backend, ở đây có thể chỉ cần kiểm tra quyền delete chung.
        // Hoặc truyền một object giả định với creatorId và _id để CASL tự động kiểm tra.
        // Cách tốt nhất là truyền chính đối tượng problem vào nếu có thể, như ở phần render dưới.
        // Tuy nhiên, ở đây bạn chỉ có problemId, nên cách kiểm tra với creatorId là hợp lý.
        if (!ability.can('delete', 'Problem', { creatorId: user.id, _id: problemId })) {
            alert("Bạn không có quyền xóa bài tập này.");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/problem/${problemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Gửi token để xác thực
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

    // Hiển thị trạng thái tải hoặc lỗi
    if (loading) {
        return <p className="loading-message">Đang tải dữ liệu...</p>;
    }
    if (error) {
        return <p className="error-message">Lỗi khi tải dữ liệu: {error}</p>;
    }

    // Nếu không có bài tập nào
    if (problems.length === 0) {
        return (
            <div className="creator-screen-container">
                <h2>Bài tập bạn đã tạo</h2>
                {/* Đảm bảo ability không null trước khi gọi .can */}
                {isAuthenticated && ability && ability.can('create', 'Problem') && (
                    <div className="creator-create">
                        <Link to="/problem/create" className="btn-create">Tạo bài tập mới</Link>
                    </div>
                )}
                <p>Bạn chưa tạo bài tập nào.</p>
            </div>
        );
    }

    // Hiển thị danh sách bài tập nếu có
    return (
        <div className="creator-screen-container">
            <h2>Bài tập bạn đã tạo</h2>
            {isAuthenticated && ability && ability.can('create', 'Problem') && (
                <div className="creator-create">
                    <Link to="/problem/create" className="btn-create">Tạo bài tập mới</Link>
                </div>
            )}
            <div className="problem-grid">
                {problems.map((problem) => (
                    // Lưu ý: Mongoose thường trả về id là `_id` mặc định,
                    // trong khi `id` bạn định nghĩa là ID tùy chỉnh của bài tập.
                    // Sử dụng problem._id cho key và các thao tác DB.
                    <div key={problem._id} className="problem-card">
                        <img
                            src={problem.image || 'https://placehold.co/300x180/E0E0E0/333333?text=No+Image'}
                            alt={problem.title}
                            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x180/E0E0E0/333333?text=No+Image"; }} // Fallback if image fails
                        />
                        <div className="card-content">
                            <h3>{problem.title}</h3>
                            {/* Hiển thị cả ID tùy chỉnh (problem.id) và MongoDB _id (problem._id) để dễ debug */}
                            <p><strong>Mã bài tập:</strong> {problem.id}</p> {/* ID tùy chỉnh của bạn */}
                            <p><strong>Dạng bài:</strong> {problem.type}</p>
                            <p><strong>Đã giải:</strong> {problem.solvedBy || 0}</p>
                        </div>
                        <div className="btn-actions">
                            {/* Button Sửa: Chỉ hiện nếu có quyền 'update' trên Problem và đó là bài của mình */}
                            {/* SỬA LỖI CASL: Truyền TRỰC TIẾP đối tượng problem vào ability.can() */}
                            {isAuthenticated && ability && ability.can('update', problem) && (
                                <button
                                    onClick={() => navigate(`/problem/edit/${problem.id}`, { state: { problem } })}
                                >
                                    Sửa
                                </button>
                            )}
                            {/* Button Xóa: Chỉ hiện nếu có quyền 'delete' trên Problem và đó là bài của mình */}
                            {/* SỬA LỖI CASL: Truyền TRỰC TIẾP đối tượng problem vào ability.can() */}
                            {isAuthenticated && ability && ability.can('delete', problem) && (
                                <button
                                    onClick={() => handleDelete(problem.id)}
                                    className="btn-delete"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CreatorScreen;