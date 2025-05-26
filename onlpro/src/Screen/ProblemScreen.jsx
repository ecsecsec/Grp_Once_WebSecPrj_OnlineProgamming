import { Link } from "react-router-dom";
import './Problem.css';

function ProblemScreen() {
    const problems = [
        {
            id: 'P001',
            title: 'Tính tổng dãy số',
            type: 'Toán cơ bản',
            solvedBy: 125,
            image: 'https://via.placeholder.com/300x180?text=Problem+1',
            detail: '',
        },
        {
            id: 'P002',
            title: 'Tìm số nguyên tố',
            type: 'Số học',
            solvedBy: 98,
            image: 'https://via.placeholder.com/300x180?text=Problem+2',
            detail: '',
        },
        {
            id: 'P003',
            title: 'Sắp xếp mảng',
            type: 'Thuật toán',
            solvedBy: 110,
            image: 'https://via.placeholder.com/30http://localhost:5173/problem/P0010x180?text=Problem+3',
            detail: '',
        },
    ];
    return (
        <div>
            <div className="problem-create">
                <Link 
                    to="/problem/create"
                    className="btn-create">
                    Tạo bài tập
                </Link>
            </div>
            <div className="problem-grid">
            {problems.map((problem) => (
                <Link
                    to={`/problem/${problem.id}`}
                    state={{ problem: problem }}
                    key={problem.id}
                    className="problem-card">

                    <img src={problem.image} alt={problem.title} />
                    <div className="card-content">
                        <h3>{problem.title}</h3>
                        <p><strong>Mã:</strong> {problem.id}</p>
                        <p><strong>Dạng bài:</strong> {problem.type}</p>
                        <p><strong>Đã giải:</strong> {problem.solvedBy}</p>
                    </div>
                </Link>
            ))}
        </div>
        </div>
    );
}

export default ProblemScreen