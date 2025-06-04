import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import './ProblemCreate.css';
import { useAuth } from '../contexts/AuthContext';

function ProblemEditScreen() {
    const { user, isAuthenticated, loading, ability } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // lấy từ URL /problem/edit/:id
    const location = useLocation();

    const [formData, setFormData] = useState({
        id: '',
        title: '',
        type: '',
        detail: '',
        image: '',
        testcases: [],
        solvedBy: 0,
        creatorId: ''
    });

    const [fetching, setFetching] = useState(true);

    // Fetch data từ backend nếu không có trong location.state
    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            const fetchProblem = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`http://localhost:5000/api/problem/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!res.ok) throw new Error("Không tìm thấy bài tập.");
                    const data = await res.json();
                    // Kiểm tra quyền sửa
                    if (!ability.can('update', 'Problem', data)) {
                        alert("Bạn không có quyền chỉnh sửa bài tập này.");
                        navigate('/byCreator');
                        return;
                    }
                    setFormData({ ...data, creatorId: data.creatorId || user.id });
                    setFetching(false);
                } catch (err) {
                    alert(err.message || "Lỗi khi tải bài tập.");
                    navigate('/byCreator');
                }
            };

            if (location.state?.problem) {
                const problem = location.state.problem;
                if (!ability.can('update', problem)) {
                    alert("Bạn không có quyền chỉnh sửa bài tập này.");
                    navigate('/byCreator');
                    return;
                }
                setFormData({ ...problem, creatorId: problem.creatorId || user.id });
                setFetching(false);
            } else {
                fetchProblem();
            }
        }
    }, [loading, isAuthenticated, user, id, location.state, ability, navigate]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
        if (formData.testcases.length > 1) {
            const newTestcases = formData.testcases.filter((_, i) => i !== index);
            setFormData({ ...formData, testcases: newTestcases });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/problem/${id}`, {
                method: 'PUT',
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
            alert("Đã cập nhật bài tập!");
            navigate('/byCreator');
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    if (loading || fetching) return <p>Đang tải dữ liệu...</p>;

    return (
        <div className="create-problem-container">
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

                <label>Link ảnh</label>
                <input name="image" value={formData.image} onChange={handleChange} />

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
                        />

                        {formData.testcases.length > 1 && (
                            <button type="button" onClick={() => removeTestcase(index)} className="testcase-remove-btn">Xóa</button>
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
