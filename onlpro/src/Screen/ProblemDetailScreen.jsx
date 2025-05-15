import { useParams } from "react-router-dom";
import './ProblemDetail.css';
import { useState } from "react";

function ProblemDetailScreen() {
    const { problemId } = useParams();
    const [showEditor, setShowEditor] = useState(false);
    const [code, setCode] = useState('');

    const problems = [
        {
            id: 'P001',
            title: 'Tính tổng dãy số',
            type: 'Toán cơ bản',
            solvedBy: 125,
            image: 'https://via.placeholder.com/300x180?text=Problem+1',
            detail: 'Hãy tính tổng các số từ 1 đến N.',
        },
        {
            id: 'P002',
            title: 'Tìm số nguyên tố',
            type: 'Số học',
            solvedBy: 98,
            image: 'https://via.placeholder.com/300x180?text=Problem+2',
            detail: 'Kiểm tra xem một số có phải nguyên tố hay không.',
        },
        {
            id: 'P003',
            title: 'Sắp xếp mảng',
            type: 'Thuật toán',
            solvedBy: 110,
            image: 'https://via.placeholder.com/300x180?text=Problem+3',
            detail: 'Sắp xếp một mảng số nguyên tăng dần.',
        },
    ];

    const problem = problems.find(p => p.id === problemId);

    if (!problem) {
        return <div className="problem-detail">Không tìm thấy bài tập!</div>;
    }

    const handleSubmit = () => {
        alert("Loading");
    };

    return (
        <div className="problem-detail">
            <h2>{problem.title}</h2>
            <p><strong>Mã:</strong> {problem.id}</p>
            <p><strong>Dạng bài:</strong> {problem.type}</p>
            <p><strong>Đã giải:</strong> {problem.solvedBy}</p>
            <p>{problem.detail}</p>

            <button className="btn-start" onClick={() => setShowEditor(true)}>Làm bài</button>

            {showEditor && (
                <div className="code-editor">
                    <textarea
                        placeholder="Nhập code của bạn..."
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button className="btn-submit" onClick={handleSubmit}>Nộp bài</button>
                </div>
            )}
        </div>
    );
}

export default ProblemDetailScreen;
