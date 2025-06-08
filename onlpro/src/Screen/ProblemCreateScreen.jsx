// frontend/src/Screen/ProblemCreateScreen.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './ProblemCreate.css';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook

function ProblemCreateScreen() {
    const { user, isAuthenticated, loading, ability } = useAuth(); // Lấy thông tin user và trạng thái xác thực từ AuthContext
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        id: '', // Đây là trường 'id' tùy chỉnh của bạn
        title: '',
        type: '',
        statement: '',
        solvedBy: 0,
        creatorId: '', // Sẽ được điền từ user.id của AuthContext
        testcases: [
            { input: '', expectedOutput: '', isSample: false }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
    });

    // Sử dụng useEffect để cập nhật creatorId vào formData khi user (từ AuthContext) thay đổi
    useEffect(() => {
        // console.log("ProblemCreateScreen useEffect: user", user);
        // console.log("ProblemCreateScreen useEffect: isAuthenticated", isAuthenticated);
        // console.log("ProblemCreateScreen useEffect: loading", loading);

        // Chờ AuthContext load xong và có thông tin user
        if (!loading) {
            if (isAuthenticated && user && user.id) {
                setFormData(prevData => ({ ...prevData, creatorId: user.id }));
            } else {
                // Nếu không xác thực hoặc không phải creator, chuyển hướng
                // console.log("User not authenticated or not a creator, redirecting.");
                alert("Bạn cần đăng nhập với vai trò creator để tạo bài tập.");
                navigate('/login'); // Chuyển hướng về trang đăng nhập
            }
        }
    }, [user, isAuthenticated, loading, navigate]); // Dependencies cho useEffect

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Chuyển đổi timeLimit và memoryLimit sang số nếu cần
        if (name === "timeLimit" || name === "memoryLimit") {
            setFormData({ ...formData, [name]: Number(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleTestcaseChange = (index, field, value) => {
        const newTestcases = [...formData.testcases];
        if (field === 'isSample') {
            newTestcases[index][field] = value; // value là boolean
        } else {
            newTestcases[index][field] = value;
        }
        setFormData({ ...formData, testcases: newTestcases });
    };

    const addTestcase = () => {
        if (formData.testcases.length < 5) { // Giới hạn 5 testcase
            setFormData({ ...formData, testcases: [...formData.testcases, { input: '', expectedOutput: '', isSample: false }] });
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
        if (!isAuthenticated || !user || !ability.can('create', 'Problem')) {
            alert("Bạn không có quyền tạo bài tập.");
            return;
        }

        // Kiểm tra creatorId đã được điền chưa (được điền bởi useEffect)
        if (!formData.creatorId) {
            alert("Creator ID không có sẵn. Vui lòng đăng nhập lại và thử.");
            return;
        }

        // Kiểm tra xem trường 'id' tùy chỉnh có được điền hay không
        if (!formData.id.trim()) { // .trim() để loại bỏ khoảng trắng thừa
            alert("Mã bài tập (ID) là bắt buộc và không được để trống.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Người dùng chưa được xác thực. Vui lòng đăng nhập.");
            }

            console.log("Dữ liệu gửi đi (trước khi gửi):", formData); // Log để kiểm tra

            const response = await fetch('http://localhost:5000/api/problem/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // THÊM AUTHORIZATION HEADER Ở ĐÂY
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Failed to create problem');
            }

            const result = await response.json();
            console.log("Created Problem:", result);
            alert("Đã tạo bài tập thành công!");
            navigate('/byCreator'); // Chuyển hướng về trang bài tập đã tạo của creator
        } catch (error) {
            console.error("Error submitting problem:", error);
            alert(`Lỗi khi tạo bài tập: ${error.message}`);
        }
    };

    // Hiển thị loading nếu AuthContext đang loading
    if (loading) {
        return <div className="loading-container">Đang tải...</div>;
    }

    // Hiển thị thông báo nếu không có quyền
    if (!isAuthenticated || !user || !ability.can('create', 'Problem')) {
        return (
            <div className="unauthorized-container">
                <h2>Truy cập bị từ chối</h2>
                <p>Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với vai trò Creator.</p>
                <button onClick={() => navigate('/login')}>Đăng nhập</button>
            </div>
        );
    }

    return (
        <div className="create-problem-container">
            <h2>Tạo bài tập mới</h2>
            <form className="problem-form" onSubmit={handleSubmit}>
                <label>Mã bài tập</label>
                <input
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    required // Đảm bảo người dùng phải nhập
                />

                <label>Tiêu đề</label>
                <input name="title" value={formData.title} onChange={handleChange} required />

                <label>Thể loại</label>
                <input name="type" value={formData.type} onChange={handleChange} required />

                <label>Mô tả chi tiết</label>
                <textarea name="statement" value={formData.statement} onChange={handleChange} required/>

                <label>Giới hạn thời gian (ms)</label>
                <input
                    type="number" // Sử dụng type="number"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    required // Đảm bảo người dùng phải nhập
                    min="1" // Giá trị tối thiểu là 1
                />

                <label>Giới hạn bộ nhớ (MB)</label>
                <input
                    type="number" // Sử dụng type="number"
                    name="memoryLimit"
                    value={formData.memoryLimit}
                    onChange={handleChange}
                    required // Đảm bảo người dùng phải nhập
                    min="1" // Giá trị tối thiểu là 1
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
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={tc.isSample}
                                onChange={(e) => handleTestcaseChange(index, 'isSample', e.target.checked)}
                            />
                            <span>Testcase mẫu</span>
                        </label>


                        {formData.testcases.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeTestcase(index)}
                                className="testcase-remove-btn"
                            >
                                Xóa testcase
                            </button>
                        )}
                    </div>
                ))}

                {formData.testcases.length < 5 && (
                    <button
                        type="button"
                        onClick={addTestcase}
                        className="add-testcase-btn"
                    >
                        Thêm testcase
                    </button>
                )}
                <button type="submit">Tạo bài tập</button>
            </form>
        </div>
    );
}

export default ProblemCreateScreen;