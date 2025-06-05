import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import './ProblemCreate.css'; // Giữ nguyên CSS nếu bạn dùng chung
import { useAuth } from '../contexts/AuthContext';

function ProblemEditScreen() {
    const { user, isAuthenticated, loading, ability } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Lấy từ URL /problem/edit/:id
    const location = useLocation();

    const [formData, setFormData] = useState({
        id: '',
        title: '',
        type: '',
        detail: '',
        solvedBy: 0, // Trường này thường không được sửa qua form này
        creatorId: '',
        testcases: [],
        timeLimit: 1000, // ✅ Khởi tạo với giá trị mặc định
        memoryLimit: 256, // ✅ Khởi tạo với giá trị mặc định
    });

    const [fetching, setFetching] = useState(true);

    // Fetch data từ backend hoặc từ location.state
    useEffect(() => {
        const fetchData = async () => {
            setFetching(true); // Bắt đầu fetch
            if (!isAuthenticated || !user || !user.id) {
                alert("Bạn cần đăng nhập để truy cập trang này.");
                navigate('/login');
                return;
            }

            let problemData = null;

            if (location.state?.problem) {
                // Ưu tiên dùng dữ liệu từ location.state nếu có
                problemData = location.state.problem;
            } else {
                // Nếu không có trong state, fetch từ API
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`http://localhost:5000/api/problem/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!res.ok) {
                        const errorRes = await res.json();
                        throw new Error(errorRes.message || "Không tìm thấy bài tập.");
                    }
                    problemData = await res.json();
                } catch (err) {
                    alert(err.message || "Lỗi khi tải bài tập.");
                    navigate('/byCreator'); // Chuyển hướng nếu lỗi tải
                    setFetching(false);
                    return;
                }
            }

            // Kiểm tra quyền chỉnh sửa sau khi có dữ liệu bài tập
            // Cần đảm bảo problemData có creatorId để ability.can hoạt động đúng
            if (problemData && !ability.can('update', { creatorId: problemData.creatorId || '' })) {
                alert("Bạn không có quyền chỉnh sửa bài tập này.");
                navigate('/byCreator');
                setFetching(false);
                return;
            }

            // Cập nhật formData với dữ liệu đã lấy được
            // Đảm bảo các trường timeLimit và memoryLimit được thiết lập đúng
            setFormData({
                id: problemData.id || '',
                title: problemData.title || '',
                type: problemData.type || '',
                detail: problemData.detail || '',
                solvedBy: problemData.solvedBy || 0,
                creatorId: problemData.creatorId || user.id, // Đảm bảo creatorId được set
                testcases: problemData.testcases || [{ input: '', expectedOutput: '' }],
                timeLimit: problemData.timeLimit || 1000, // ✅ Thiết lập timeLimit
                memoryLimit: problemData.memoryLimit || 256, // ✅ Thiết lập memoryLimit
            });
            setFetching(false);
        };

        if (!loading) { // Chỉ fetch khi AuthContext đã load xong
            fetchData();
        }
    }, [loading, isAuthenticated, user, id, location.state, ability, navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        // Chuyển đổi timeLimit và memoryLimit sang số
        if (name === "timeLimit" || name === "memoryLimit") {
            setFormData({ ...formData, [name]: Number(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleTestcaseChange = (index, field, value) => {
        const newTestcases = [...formData.testcases];
        newTestcases[index][field] = value;
        setFormData({ ...formData, testcases: newTestcases });
    };

    const addTestcase = () => {
        if (formData.testcases.length < 5) {
            setFormData({ ...formData, testcases: [...formData.testcases, { input: '', expectedOutput: '' }] });
        }
    };

    const removeTestcase = (index) => {
        if (formData.testcases.length > 1) { // Luôn giữ ít nhất 1 testcase
            const newTestcases = formData.testcases.filter((_, i) => i !== index);
            setFormData({ ...formData, testcases: newTestcases });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Kiểm tra quyền trước khi gửi
        if (!isAuthenticated || !user || !ability.can('update', { creatorId: formData.creatorId })) {
            alert("Bạn không có quyền chỉnh sửa bài tập này.");
            return;
        }

        // Kiểm tra validation cho ID tùy chỉnh
        if (!formData.id.trim()) {
            alert("Mã bài tập (ID) là bắt buộc và không được để trống.");
            return;
        }

        // Kiểm tra timeLimit và memoryLimit phải là số dương
        if (isNaN(formData.timeLimit) || formData.timeLimit <= 0) {
            alert("Giới hạn thời gian phải là một số dương.");
            return;
        }
        if (isNaN(formData.memoryLimit) || formData.memoryLimit <= 0) {
            alert("Giới hạn bộ nhớ phải là một số dương.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Người dùng chưa được xác thực. Vui lòng đăng nhập.");
            }

            console.log("Dữ liệu gửi đi (trước khi gửi PUT):", formData); // Log để kiểm tra

            const response = await fetch(`http://localhost:5000/api/problem/${id}`, {
                method: 'PUT', // ✅ Method là PUT để cập nhật
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Lỗi cập nhật bài tập.");
            }

            const result = await response.json();
            console.log("Updated Problem:", result);
            alert("Đã cập nhật bài tập thành công!");
            navigate('/byCreator'); // Chuyển hướng về trang bài tập đã tạo của creator
        } catch (err) {
            console.error("Error submitting problem update:", err);
            alert("Lỗi: " + err.message);
        }
    };

    // Hiển thị loading nếu AuthContext đang loading hoặc dữ liệu bài tập đang được fetching
    if (loading || fetching) {
        return <div className="loading-container">Đang tải dữ liệu bài tập...</div>;
    }

    // Hiển thị thông báo nếu không có quyền sau khi load xong
    // (Kiểm tra lại quyền dựa trên creatorId đã fetched)
    if (!isAuthenticated || !user || !ability.can('update', { creatorId: formData.creatorId })) {
        return (
            <div className="unauthorized-container">
                <h2>Truy cập bị từ chối</h2>
                <p>Bạn không có quyền chỉnh sửa bài tập này. Vui lòng đăng nhập với vai trò Creator hoặc đây không phải bài của bạn.</p>
                <button onClick={() => navigate('/login')}>Đăng nhập</button>
            </div>
        );
    }

    return (
        <div className="create-problem-container"> {/* Giữ nguyên className nếu CSS tương thích */}
            <h2>Chỉnh sửa bài tập</h2>
            <form className="problem-form" onSubmit={handleSubmit}>
                <label>Mã bài tập</label>
                <input name="id" value={formData.id} onChange={handleChange} required />

                <label>Tiêu đề</label>
                <input name="title" value={formData.title} onChange={handleChange} required />

                <label>Thể loại</label>
                <input name="type" value={formData.type} onChange={handleChange} required />

                <label>Mô tả chi tiết</label>
                <textarea name="detail" value={formData.detail} onChange={handleChange} />

                {/* ✅ Thêm các trường cho timeLimit và memoryLimit */}
                <label>Giới hạn thời gian (ms)</label>
                <input
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    required
                    min="1"
                />

                <label>Giới hạn bộ nhớ (MB)</label>
                <input
                    type="number"
                    name="memoryLimit"
                    value={formData.memoryLimit}
                    onChange={handleChange}
                    required
                    min="1"
                />

                <h3>Testcases</h3>
                {formData.testcases.map((tc, index) => (
                    <div key={index} className="testcase-container">
                        <label>Input #{index + 1}</label>
                        <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) => handleTestcaseChange(index, 'input', e.target.value)}
                        />

                        <label>Output #{index + 1}</label>
                        <textarea
                            rows={2}
                            value={tc.expectedOutput}
                            onChange={(e) => handleTestcaseChange(index, 'expectedOutput', e.target.value)}
                            required
                        />

                        {formData.testcases.length > 1 && (
                            <button type="button" onClick={() => removeTestcase(index)} className="testcase-remove-btn">Xóa testcase</button>
                        )}
                    </div>
                ))}

                {formData.testcases.length < 5 && (
                    <button type="button" onClick={addTestcase} className="add-testcase-btn">Thêm testcase</button>
                )}

                <button type="submit">Cập nhật</button>
            </form>
        </div>
    );
}

export default ProblemEditScreen;