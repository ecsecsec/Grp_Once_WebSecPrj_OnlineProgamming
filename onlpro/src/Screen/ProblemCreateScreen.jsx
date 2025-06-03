import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './ProblemCreate.css';

function ProblemCreateScreen() {
    // const creatorIdTemp = "";
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        type: '',
        detail: '',
        solvedBy:0,
        creatorId: '', //thay ''bằng creator id
        testcases: [
            { input: '', expectedOutput: '' }
        ],
    });
    // Nếu bạn lấy creatorId từ AuthContext, bạn có thể cần useEffect để cập nhật formData khi user thay đổi
    // useEffect(() => {
    //     if (creatorIdFromAuth) {
    //         setFormData(prevData => ({ ...prevData, creatorId: creatorIdFromAuth }));
    //     }
    // }, [creatorIdFromAuth]);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        if (formData.testcases.length > 1) {
            const newTestcases = formData.testcases.filter((_, i) => i !== index);
            setFormData({ ...formData, testcases: newTestcases });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/problem/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create problem');
            }

            const result = await response.json();
            console.log("Created Problem:", result);
            alert("Đã tạo bài tập thành công!");
            navigate('/problem');

        } catch (error) {
            console.error("Error submitting problem:", error);
            alert(`Lỗi khi tạo bài tập: ${error.message}`);
        }
    };

    return (
        <div className="create-problem-container">
            <h2>Tạo bài tập mới</h2>
            <form className="problem-form" onSubmit={handleSubmit}>
                <label>Mã bài tập</label>
                <input name="id" value={formData.id} onChange={handleChange} required />

                <label>Tiêu đề</label>
                <input name="title" value={formData.title} onChange={handleChange} required />

                <label>Thể loại</label>
                <input name="type" value={formData.type} onChange={handleChange} required />

                <label>Mô tả chi tiết</label>
                <textarea name="detail" value={formData.detail} onChange={handleChange} />

                <label>Link ảnh (tuỳ chọn)</label>
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
                            required
                        />

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
