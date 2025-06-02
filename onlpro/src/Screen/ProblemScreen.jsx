import { Link } from "react-router-dom";
import React, {useState, useEffect} from "react";
import './Problem.css';

function ProblemScreen() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProblems() {
            try {
                const res = await fetch('http://localhost:5000/api/problem/getall'); 
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setProblems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProblems();
    }, []);

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>Lỗi khi tải dữ liệu: {error}</p>;

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