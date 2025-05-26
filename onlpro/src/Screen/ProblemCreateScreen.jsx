import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './ProblemCreate.css';

function ProblemCreateScreen() {
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        type: '',
        detail: '',
        image: '',
        testcases: [
            { input: '', output: '' }
        ],
    });

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
            setFormData({ ...formData, testcases: [...formData.testcases, { input: '', output: '' }] });
        }
    };
    const removeTestcase = (index) => {
        if (formData.testcases.length > 1) {
            const newTestcases = formData.testcases.filter((_, i) => i !== index);
            setFormData({ ...formData, testcases: newTestcases });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("New Problem:", formData);
        // TODO: gửi lên server / cập nhật local state
        alert("Đã tạo bài tập thành công!");
        navigate('/problem');
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
                            required
                        />

                        <label>Output #{index + 1}</label>
                        <textarea
                            rows={2}
                            value={tc.output}
                            onChange={(e) => handleTestcaseChange(index, 'output', e.target.value)}
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
