// frontend/src/Screen/ProblemCreateScreen.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './ProblemCreate.css';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook

function ProblemCreateScreen() {
    const { user, isAuthenticated, loading, ability } = useAuth(); // Lấy thông tin user và trạng thái xác thực từ AuthContext
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        statement: '',
        creatorId: '',
        testcases: [
            { input: '', expectedOutput: '', isSample: false }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        difficulty: 'easy',
        tags: '',
        isPublic: false,
        image: '',
    });

    const [error, setError] = useState(null); // State để lưu thông báo lỗi

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated && user && user.id && ability.can('create', 'Problem')) {
                setFormData(prevData => ({ ...prevData, creatorId: user.id }));
            } else {
                alert("Bạn cần đăng nhập với vai trò Creator để tạo bài tập.");
                navigate('/login');
            }
        }
    }, [user, isAuthenticated, loading, ability, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "timeLimit" || name === "memoryLimit") {
            setFormData({ ...formData, [name]: Number(value) });
        }
        else if (name === "isPublic" && type === "checkbox") {
            setFormData({ ...formData, [name]: checked });
        }
        else {
            setFormData({ ...formData, [name]: value });
        }
        setError(null); // Xóa lỗi khi người dùng thay đổi dữ liệu
    };

    const handleTestcaseChange = (index, field, value) => {
        const newTestcases = [...formData.testcases];
        if (field === 'isSample') {
            newTestcases[index][field] = value;
        } else {
            newTestcases[index][field] = value;
        }
        setFormData({ ...formData, testcases: newTestcases });
        setError(null); // Xóa lỗi khi người dùng thay đổi dữ liệu testcase
    };

    const addTestcase = () => {
        if (formData.testcases.length < 5) {
            setFormData({ ...formData, testcases: [...formData.testcases, { input: '', expectedOutput: '', isSample: false }] });
        } else {
            alert("Bạn chỉ có thể thêm tối đa 5 testcase.");
        }
        setError(null); // Xóa lỗi khi thêm testcase
    };
    const removeTestcase = (index) => {
        if (formData.testcases.length > 1) {
            const newTestcases = formData.testcases.filter((_, i) => i !== index);
            setFormData({ ...formData, testcases: newTestcases });
        } else {
            alert("Bạn phải giữ ít nhất 1 testcase.");
        }
        setError(null); // Xóa lỗi khi xóa testcase
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Reset lỗi trước mỗi lần submit mới

        // Kiểm tra quyền trước khi gửi
        if (!isAuthenticated || !user || !ability.can('create', 'Problem')) {
            setError("Bạn không có quyền tạo bài tập.");
            return;
        }

        if (!formData.creatorId) {
            setError("Creator ID không có sẵn. Vui lòng đăng nhập lại và thử.");
            return;
        }

        // --- Frontend validation ---
        if (!formData.title.trim()) {
            setError("Tiêu đề là bắt buộc.");
            return;
        }
        if (!formData.statement.trim()) {
            setError("Mô tả chi tiết là bắt buộc.");
            return;
        }
        if (formData.timeLimit <= 0 || formData.memoryLimit <= 0) {
            setError("Giới hạn thời gian và bộ nhớ phải lớn hơn 0.");
            return;
        }
        for (const tc of formData.testcases) {
            if (!tc.expectedOutput.trim()) {
                setError("Tất cả các trường Output của testcase đều là bắt buộc.");
                return;
            }
        }
        // --- End Frontend validation ---

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Người dùng chưa được xác thực. Vui lòng đăng nhập.");
            }

            const dataToSend = {
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
            };

            console.log("Dữ liệu gửi đi (trước khi gửi):", JSON.stringify(dataToSend, null, 2));

            const response = await fetch('http://localhost:5000/api/problem/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // LOẠI BỎ LOGIC KIỂM TRA LỖI "TITLE ALREADY EXISTS" CỤ THỂ
                // Chỉ hiển thị thông báo lỗi chung từ backend (nếu có)
                setError(errorData.message || errorData.error || 'Failed to create problem');
                return;
            }

            const result = await response.json();
            console.log("Created Problem:", result);
            alert("Đã tạo bài tập thành công!");
            navigate(`/problem/${result._id}`);
        } catch (err) {
            console.error("Error submitting problem:", err);
            setError(`Lỗi khi tạo bài tập: ${err.message}`);
        }
    };

    if (loading) {
        return <div className="loading-container">Đang tải...</div>;
    }

    if (!isAuthenticated || !user || (ability && !ability.can('create', 'Problem'))) {
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
                {error && <div className="error-message">{error}</div>}

                <label htmlFor="title">Tiêu đề</label>
                <input id="title" name="title" value={formData.title} onChange={handleChange} required />

                <label htmlFor="statement">Mô tả chi tiết</label>
                <textarea id="statement" name="statement" value={formData.statement} onChange={handleChange} required rows={5}/>

                <label htmlFor="difficulty">Độ khó</label>
                <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} required>
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                </select>

                <label htmlFor="tags">Thẻ (phân cách bằng dấu phẩy)</label>
                <input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="ví dụ: mảng, thuật toán, tìm kiếm"
                />

                <label htmlFor="timeLimit">Giới hạn thời gian (ms)</label>
                <input
                    id="timeLimit"
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    required
                    min="1"
                />

                <label htmlFor="memoryLimit">Giới hạn bộ nhớ (MB)</label>
                <input
                    id="memoryLimit"
                    type="number"
                    name="memoryLimit"
                    value={formData.memoryLimit}
                    onChange={handleChange}
                    required
                    min="1"
                />

                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleChange}
                    />
                    <span>Công khai bài tập</span>
                </label>

                <h3>Testcases</h3>
                {formData.testcases.map((tc, index) => (
                    <div key={index} className="testcase-container">
                        <h4>Testcase #{index + 1}</h4>
                        <label htmlFor={`input-${index}`}>Input #{index + 1}</label>
                        <textarea
                            id={`input-${index}`}
                            rows={2}
                            value={tc.input}
                            onChange={(e) => handleTestcaseChange(index, 'input', e.target.value)}
                        />

                        <label htmlFor={`output-${index}`}>Output #{index + 1}</label>
                        <textarea
                            id={`output-${index}`}
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
                <button type="submit" className="submit-btn">Tạo bài tập</button>
            </form>
        </div>
    );
}

export default ProblemCreateScreen;