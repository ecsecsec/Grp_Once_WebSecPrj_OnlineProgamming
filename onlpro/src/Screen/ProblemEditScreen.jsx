import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import './ProblemCreate.css'; // Giữ nguyên CSS nếu bạn dùng chung
import { useAuth } from '../contexts/AuthContext';

function ProblemEditScreen() {
    const { user, isAuthenticated, loading: authLoading, ability } = useAuth(); // Đổi tên loading thành authLoading để tránh trùng lặp
    const navigate = useNavigate();
    const { id } = useParams(); // Lấy _id từ URL /problem/edit/:id
    const location = useLocation();

    const [formData, setFormData] = useState({
        // id: '', // Không còn trường id tùy chỉnh, dùng _id của MongoDB
        title: '',
        statement: '', // Thay thế 'detail' bằng 'statement'
        difficulty: 'medium', // Thay thế 'type' bằng 'difficulty', đặt giá trị mặc định
        tags: [], // Thêm trường tags, khởi tạo là mảng rỗng
        isPublic: true, // Thêm trường isPublic, khởi tạo là true
        creatorId: '', // Sẽ được set khi fetch dữ liệu hoặc từ user.id
        testcases: [{ input: '', expectedOutput: '', isSample: false }], // Khởi tạo với 1 testcase mẫu
        timeLimit: 1000,
        memoryLimit: 256,
        // successfulSolverIds: [], // Trường này không được chỉnh sửa qua form
    });

    const [fetchingProblem, setFetchingProblem] = useState(true); // Đổi tên để rõ ràng hơn

    // Fetch data từ backend hoặc từ location.state
    useEffect(() => {
        const fetchData = async () => {
            setFetchingProblem(true);

            if (authLoading) { // Đợi AuthContext load xong
                return;
            }

            if (!isAuthenticated || !user || !user.id) {
                alert("Bạn cần đăng nhập để truy cập trang này.");
                navigate('/login');
                setFetchingProblem(false);
                return;
            }

            let problemData = null;

            if (location.state?.problem && location.state.problem._id === id) {
                // Ưu tiên dùng dữ liệu từ location.state nếu có và khớp ID
                problemData = location.state.problem;
            } else {
                // Nếu không có trong state hoặc không khớp ID, fetch từ API
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
                    navigate('/byCreator');
                    setFetchingProblem(false);
                    return;
                }
            }

            // Kiểm tra quyền chỉnh sửa sau khi có dữ liệu bài tập
            // Cần truyền toàn bộ problemData vào ability.can để kiểm tra chính xác (bao gồm creatorId, _id)
            if (problemData && ability.cannot('update', problemData)) {
                alert("Bạn không có quyền chỉnh sửa bài tập này.");
                navigate('/byCreator');
                setFetchingProblem(false);
                return;
            }

            // Cập nhật formData với dữ liệu đã lấy được
            setFormData({
                // id: problemData.id || '', // Bỏ trường này
                title: problemData.title || '',
                statement: problemData.statement || '', // Lấy statement
                difficulty: problemData.difficulty || 'medium', // Lấy difficulty
                tags: problemData.tags || [], // Lấy tags
                isPublic: problemData.isPublic !== undefined ? problemData.isPublic : true, // Lấy isPublic
                creatorId: problemData.creatorId || user.id, // Đảm bảo creatorId được set
                testcases: problemData.testcases && problemData.testcases.length > 0
                    ? problemData.testcases
                    : [{ input: '', expectedOutput: '', isSample: false }], // Luôn có ít nhất 1 testcase
                timeLimit: problemData.timeLimit || 1000,
                memoryLimit: problemData.memoryLimit || 256,
            });
            setFetchingProblem(false);
        };

        fetchData();
    }, [authLoading, isAuthenticated, user, id, location.state, ability, navigate]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "number") {
            setFormData({ ...formData, [name]: Number(value) });
        } else if (type === "checkbox") {
            setFormData({ ...formData, [name]: checked });
        } else if (name === "tags") {
            // Xử lý tags: tách chuỗi thành mảng dựa trên dấu phẩy và loại bỏ khoảng trắng
            setFormData({ ...formData, tags: value.split(',').map(tag => tag.trim()).filter(tag => tag !== '') });
        }
        else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleTestcaseChange = (index, field, value) => {
        const newTestcases = [...formData.testcases];
        newTestcases[index][field] = value;
        setFormData({ ...formData, testcases: newTestcases });
    };

    const addTestcase = () => {
        setFormData({ ...formData, testcases: [...formData.testcases, { input: '', expectedOutput: '', isSample: false }] });
    };

    const removeTestcase = (index) => {
        if (formData.testcases.length > 1) { // Luôn giữ ít nhất 1 testcase
            const newTestcases = formData.testcases.filter((_, i) => i !== index);
            setFormData({ ...formData, testcases: newTestcases });
        } else {
            alert("Bạn cần giữ ít nhất một testcase.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Kiểm tra quyền trước khi gửi
        // Truyền ID của bài toán (`id` từ useParams) vào ability.can để kiểm tra quyền chính xác hơn
        // `id` ở đây là `_id` của MongoDB
        if (!isAuthenticated || !user || ability.cannot('update', { _id: id, creatorId: formData.creatorId })) {
            alert("Bạn không có quyền chỉnh sửa bài tập này.");
            return;
        }

        // --- Client-side Validation ---
        if (!formData.title.trim()) {
            alert("Tiêu đề là bắt buộc.");
            return;
        }
        if (!formData.statement.trim()) {
            alert("Mô tả chi tiết (đề bài) là bắt buộc.");
            return;
        }
        if (isNaN(formData.timeLimit) || formData.timeLimit <= 0) {
            alert("Giới hạn thời gian phải là một số dương.");
            return;
        }
        if (isNaN(formData.memoryLimit) || formData.memoryLimit <= 0) {
            alert("Giới hạn bộ nhớ phải là một số dương.");
            return;
        }
        if (!['easy', 'medium', 'hard'].includes(formData.difficulty)) {
            alert("Mức độ khó không hợp lệ. Phải là 'easy', 'medium' hoặc 'hard'.");
            return;
        }
        if (!formData.testcases || formData.testcases.length === 0) {
            alert("Bài tập phải có ít nhất một testcase.");
            return;
        }
        for (const tc of formData.testcases) {
            if (tc.expectedOutput === undefined || tc.expectedOutput === null || tc.expectedOutput.trim() === '') {
                alert("Mỗi testcase phải có Expected Output.");
                return;
            }
        }
        // --- End Client-side Validation ---

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Người dùng chưa được xác thực. Vui lòng đăng nhập.");
            }

            console.log("Dữ liệu gửi đi (trước khi gửi PUT):", formData);

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
                console.error("Lỗi từ server:", errorData);
                throw new Error(errorData.message || "Lỗi cập nhật bài tập.");
            }

            const result = await response.json();
            console.log("Updated Problem:", result);
            alert("Đã cập nhật bài tập thành công!");
            navigate('/byCreator');
        } catch (err) {
            console.error("Error submitting problem update:", err);
            alert("Lỗi: " + err.message);
        }
    };

    // Hiển thị loading nếu AuthContext đang loading hoặc dữ liệu bài tập đang được fetching
    if (authLoading || fetchingProblem) {
        return <div className="loading-container">Đang tải dữ liệu bài tập và xác thực...</div>;
    }

    // Hiển thị thông báo nếu không có quyền sau khi load xong và problemData đã có
    if (!isAuthenticated || !user || ability.cannot('update', { _id: id, creatorId: formData.creatorId })) {
        return (
            <div className="unauthorized-container">
                <h2>Truy cập bị từ chối</h2>
                <p>Bạn không có quyền chỉnh sửa bài tập này. Vui lòng đăng nhập với vai trò Creator hoặc đây không phải bài của bạn.</p>
                <button onClick={() => navigate('/login')}>Đăng nhập</button>
            </div>
        );
    }

    return (
        <div className="create-problem-container">
            <h2>Chỉnh sửa bài tập</h2>
            <form className="problem-form" onSubmit={handleSubmit}>
                {/* Trường Mã bài tập (ID) đã bị loại bỏ vì dùng _id của MongoDB */}
                {/* <label>Mã bài tập (Tùy chỉnh)</label>
                <input name="id" value={formData.id} onChange={handleChange} /> */}

                <label>Tiêu đề</label>
                <input name="title" value={formData.title} onChange={handleChange} required />

                <label>Đề bài</label> {/* Đổi từ 'Mô tả chi tiết' sang 'Đề bài' */}
                <textarea name="statement" value={formData.statement} onChange={handleChange} required rows={8} />

                <label>Mức độ khó</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                </select>

                <label>Tags (Phân cách bằng dấu phẩy, ví dụ: Array, DP, BFS)</label>
                <input
                    name="tags"
                    value={formData.tags.join(', ')} // Hiển thị mảng tags dưới dạng chuỗi
                    onChange={handleChange}
                    placeholder="ví dụ: Array, DP, BFS"
                />

                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleChange}
                    />
                    <span>Công khai</span>
                </label>

                <label>Giới hạn thời gian (ms)</label>
                <input
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1" // Đảm bảo chỉ nhập số nguyên
                />

                <label>Giới hạn bộ nhớ (MB)</label>
                <input
                    type="number"
                    name="memoryLimit"
                    value={formData.memoryLimit}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1" // Đảm bảo chỉ nhập số nguyên
                />

                <h3>Testcases</h3>
                {formData.testcases.map((tc, index) => (
                    <div key={index} className="testcase-container">
                        <label>Input #{index + 1} (Không bắt buộc)</label>
                        <textarea
                            rows={3}
                            value={tc.input}
                            onChange={(e) => handleTestcaseChange(index, 'input', e.target.value)}
                        />

                        <label>Expected Output #{index + 1}</label>
                        <textarea
                            rows={3}
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
                            <span>Testcase mẫu (Hiển thị cho người dùng)</span>
                        </label>

                        {/* Nút xóa testcase chỉ hiển thị nếu có nhiều hơn 1 testcase */}
                        {formData.testcases.length > 1 && (
                            <button type="button" onClick={() => removeTestcase(index)} className="testcase-remove-btn">Xóa testcase</button>
                        )}
                    </div>
                ))}

                <button type="button" onClick={addTestcase} className="add-testcase-btn">Thêm testcase</button>

                <button type="submit" className="submit-btn">Cập nhật bài tập</button>
            </form>
        </div>
    );
}

export default ProblemEditScreen;