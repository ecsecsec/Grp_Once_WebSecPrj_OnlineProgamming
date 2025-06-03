import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Problem.css';
import './CreatorScreen.css';
function CreatorScreen() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const sampleProblems = [
        {
            id: "P001",
            title: "Sắp xếp dãy số tăng dần",
            type: "Lập trình cơ bản",
            detail: "Viết chương trình đọc vào dãy số và sắp xếp theo thứ tự tăng dần.",
            image: "https://via.placeholder.com/300x180.png?text=Sap+xep+day+so",
            solvedBy: 25,
            testcases: [
                { input: "9 1 5 3 2", output: "1 2 3 5 9" },
                { input: "1 3 2 4 5 7", output: "1 2 3 4 5 7" }
            ]
        },
        {
            id: "P002",
            title: "Tính tổng các số chẵn",
            type: "Toán học",
            detail: "Cho một dãy số nguyên, hãy tính tổng các số chẵn trong dãy.",
            image: "https://via.placeholder.com/300x180.png?text=Tong+so+chan",
            solvedBy: 17,
            testcases: [
                { input: "1 2 3 4 5", output: "6" },
                { input: "2 4 6 8", output: "20" }
            ]
        },
        {
            id: "P003",
            title: "Đếm số nguyên tố",
            type: "Thuật toán",
            detail: "Đếm số lượng số nguyên tố trong một dãy số cho trước.",
            image: "https://via.placeholder.com/300x180.png?text=Dem+nguyen+to",
            solvedBy: 11,
            testcases: [
                { input: "1 2 3 4 5", output: "3" },
                { input: "10 11 12 13", output: "2" }
            ]
        }
    ];
    useEffect(() => {
        // Dùng dữ liệu mẫu thay vì fetch từ backend
        setProblems(sampleProblems);
        setLoading(false);
    }, []);

    // useEffect(() => {
    //     async function fetchProblems() {
    //         try {
    //             const res = await fetch('http://localhost:5000/api/problem/bycreator/${creatorId}');
    //             if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    //             const data = await res.json();
    //             setProblems(data);
    //         } catch (err) {
    //             setError(err.message);
    //         } finally {
    //             setLoading(false);
    //         }
    //     }
    //     fetchProblems();
    // }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa bài tập này không?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/problem/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error("Lỗi khi xóa bài tập");
            setProblems(problems.filter(p => p.id !== id));
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>Lỗi khi tải dữ liệu: {error}</p>;

    return (
        <div>
            <h2>Bài tập bạn đã tạo</h2>
            <div className="creator-create">
                <Link to="/problem/create" className="btn-create">Tạo bài tập</Link>
            </div>
            <div className="problem-grid">
                {problems.map((problem) => (
                    <div key={problem.id} className="problem-card">
                        <img src={problem.image} alt={problem.title} />

                        <div className="btn-actions">
                            <button
                                onClick={() => navigate(`/problem/edit/${problem.id}`, { state: { problem } })}
                            >
                                Sửa
                            </button>
                            <button
                                onClick={() => handleDelete(problem.id)}
                                className="btn-delete"
                            >
                                Xóa
                            </button>
                        </div>

                        <div className="card-content">
                            <h3>{problem.title}</h3>
                            <p><strong>Mã:</strong> {problem.id}</p>
                            <p><strong>Dạng bài:</strong> {problem.type}</p>
                            <p><strong>Đã giải:</strong> {problem.solvedBy}</p>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default CreatorScreen;
