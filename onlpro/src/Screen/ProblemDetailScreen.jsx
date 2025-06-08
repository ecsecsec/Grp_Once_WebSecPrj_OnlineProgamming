import { useParams } from "react-router-dom";
import './ProblemDetail.css';
import { useState, useEffect } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";


function ProblemDetailScreen() {
    const { problemId } = useParams(); // problemId ở đây là _id từ URL
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showEditor, setShowEditor] = useState(false);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');

    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [testResults, setTestResults] = useState([]);

    const [subHistory, setSubHistory] = useState([]);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                setLoading(true);
                // Cập nhật URL API để khớp với backend đã thay đổi (sử dụng /api/problems/:id)
                const response = await fetch(`http://localhost:5000/api/problem/${problemId}`);
                if (!response.ok) {
                    // Cố gắng đọc thông báo lỗi từ backend
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Error: ${response.status}`);
                }
                const data = await response.json();
                setProblem(data);
                setError(null);
            } catch (err) {
                setError(err.message);
                setProblem(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [problemId]); // Thêm problemId vào dependency array để re-fetch khi ID thay đổi

    if (loading) return <div>Đang tải bài tập...</div>;
    if (error) return <div>Lỗi khi tải bài tập: {error}</div>;
    if (!problem) return <div>Không tìm thấy bài tập!</div>;

    //Thêm hàm polling trạng thái submission:
    const startPollingSubmissionStatus = (submissionId) => {
        const intervalId = setInterval(async () => {
            try {
                const userAuthToken = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/submissions/${submissionId}/status`, {
                    headers: { Authorization: `Bearer ${userAuthToken}` }
                });
                if (!res.ok) throw new Error('Lỗi lấy trạng thái bài nộp');
                const data = await res.json();
                // Giả sử data có cấu trúc { status: 'Accepted', testResults: [...] }

                // Cập nhật lại subHistory:
                setSubHistory(prev => prev.map(sub => {
                    if (sub.submissionId === submissionId) {
                        return {
                            ...sub,
                            overallStatus: data.status,
                            message: data.message || '',
                            testResults: data.testResults || []
                        };
                    }
                    return sub;
                }));

                // Nếu trạng thái đã không còn là Pending nữa thì dừng polling:
                if (data.status !== 'Pending') {
                    clearInterval(intervalId);
                }
            } catch (err) {
                console.error('Lỗi khi polling trạng thái submission:', err);
                clearInterval(intervalId);
            }
        }, 3000); // polling mỗi 3 giây
    };

    const handleSubmit = async () => {
        console.log("Problem ID from URL params:", problemId);
        setSubmissionStatus('Đang chấm điểm...');
        setTestResults([]); // Xóa kết quả cũ trước khi submit mới

        let userAuthToken = null;
        try {
            userAuthToken = localStorage.getItem('token'); // Key là 'token' như trong AuthContext
        } catch (e) {
            console.error("Lỗi khi truy cập localStorage để lấy token xác thực:", e);
            setSubmissionStatus('Lỗi: Không thể truy cập token xác thực. Vui lòng đảm bảo localStorage khả dụng và không bị chặn.');
            return;
        }

        if (!userAuthToken) {
            console.error("Không tìm thấy token xác thực trong localStorage. Người dùng có thể chưa đăng nhập hoặc token bị thiếu.");
            setSubmissionStatus('Lỗi: Chưa xác thực. Vui lòng đăng nhập lại để nộp bài.');
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/submissions", { // URL API backend
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userAuthToken}`
                },
                body: JSON.stringify({
                    // Đảm bảo tên trường khớp với backend mong đợi
                    problemId: problem._id,   // Sử dụng problem._id
                    language: language,       // Biến 'language' phải có giá trị
                    source_code: code          // Biến 'code' phải có giá trị, backend mong đợi 'sourceCode'
                }),
            });

            if (!response.ok) {
                let errorMessage = `Lỗi HTTP! Trạng thái: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || JSON.stringify(errorData);
                } catch (jsonError) {
                    try {
                        const textError = await response.text();
                        errorMessage = textError || errorMessage;
                    } catch (textParseError) {
                        // Giữ errorMessage gốc nếu không parse được cả text
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json(); // Backend trả về { message: '...', submissionId: '...' }

            setSubmissionStatus(result.message || 'Đã nhận bài nộp, đang xử lý...');
            console.log("Nộp bài thành công. ID bài nộp:", result.submissionId);

            setSubHistory(prev => [
                {
                    timestamp: new Date().toLocaleString(),
                    language,
                    codeSnippet: code.substring(0, 50) + (code.length > 50 ? '...' : ''),
                    overallStatus: 'Pending', // Trạng thái ban đầu là Pending sau khi POST thành công
                    message: result.message,
                    submissionId: result.submissionId
                },
                ...prev
            ]);

            startPollingSubmissionStatus(result.submissionId);

        } catch (err) {
            console.error("Nộp bài thất bại trong khối catch của handleSubmit:", err);
            setSubmissionStatus('Lỗi: ' + err.message);
            setTestResults([]);
            setSubHistory(prev => [
                {
                    timestamp: new Date().toLocaleString(),
                    language,
                    codeSnippet: code.substring(0, 50) + (code.length > 50 ? '...' : ''),
                    overallStatus: 'Error',
                    message: `Nộp bài thất bại: ${err.message}`,
                },
                ...prev
            ]);
        }
    };

    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("Kích thước file vượt quá giới hạn 5MB!");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setCode(event.target.result);
            // Tự động phát hiện ngôn ngữ khi import file
            setLanguage(detectLanguageFromExtension(file.name));
        };

        reader.readAsText(file);
    };

    const detectLanguageFromExtension = (filename) => {
        const ext = filename.split('.').pop();
        switch (ext) {
            case 'py': return 'python';
            case 'c':
            case 'cpp': return 'c_cpp';
            case 'java': return 'java';
            default: return 'python'; // mặc định nếu không rõ
        }
    };

    return (
        <div className="problem-detail">
            <h2>{problem.title}</h2>
            <p><strong>Mã bài tập:</strong> {problem._id}</p>

            {/* Hiển thị số lượng người đã giải thành công bằng cách lấy .length */}
            <p><strong>Đã giải:</strong> {problem.successfulSolverIds ? problem.successfulSolverIds.length : 0}</p>

            <p><strong>Giới hạn thời gian:</strong> {problem.timeLimit / 1000} giây</p>
            <p><strong>Giới hạn bộ nhớ:</strong> {problem.memoryLimit} MB</p>

            <p><strong>Độ khó:</strong> {problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 'Chưa xác định'}</p>

            {problem.tags && problem.tags.length > 0 && (
                <p><strong>Thẻ:</strong> {problem.tags.join(', ')}</p>
            )}

            <div className="problem-statement">
                <h3>Đề bài</h3>
                <p>{problem.statement}</p>
            </div>

            <div className="sample-test-cases" style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
                <h3>Ví dụ test case</h3>
                {problem.testcases && problem.testcases.filter(tc => tc.isSample).map((sample, index) => (
                    <div key={index} style={{ marginBottom: '1rem' }}>
                        <h4>Ví dụ {index + 1}</h4>
                        <p><strong>Input:</strong></p>
                        <pre>{sample.input}</pre>
                        <p><strong>Output mong đợi:</strong></p>
                        <pre>{sample.expectedOutput}</pre>
                    </div>
                ))}
                {(!problem.testcases || problem.testcases.filter(tc => tc.isSample).length === 0) && (
                    <p>Không có ví dụ test case nào.</p>
                )}
            </div>

            <div className="sub-history" style={{ marginTop: '2rem' }}>
                <h3>Lịch sử nộp bài</h3>
                {subHistory.length === 0 ? (
                    <p>Chưa có lần nộp bài nào.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Ngôn ngữ</th>
                                <th>Code snippet</th>
                                <th>Trạng thái tổng thể</th>
                                <th>Thông báo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subHistory.map((sub, index) => (
                                <tr key={index} className={sub.overallStatus === 'Accepted' ? 'pass' : 'fail'}>
                                    <td>{sub.timestamp}</td>
                                    <td>{sub.language}</td>
                                    <td><code>{sub.codeSnippet}</code></td>
                                    <td>{sub.overallStatus}</td>
                                    <td>{sub.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <button className="btn-start" onClick={() => setShowEditor(true)}>Làm bài</button>

            {showEditor && (
                <div className="editor-container">
                    <div className="editor-header">
                        <span className="editor-title"><strong>Source code</strong></span>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="python">Python</option>
                            <option value="c_cpp">C/ C++</option>
                            <option value="java">Java</option>
                        </select>
                        <input
                            type="file"
                            accept=".c,.cpp,.py,.java,.txt"
                            onChange={handleFileImport}
                            className="btn-import"
                        />
                    </div>

                    <AceEditor
                        mode={language}
                        theme="monokai"
                        name="codeEditor"
                        value={code}
                        onChange={setCode}
                        fontSize={14}
                        width="100%"
                        height="300px"
                        showPrintMargin={false}
                        showGutter={true}
                        highlightActiveLine={true}
                        setOptions={{
                            showLineNumbers: true,
                            tabSize: 4,
                        }}
                    />
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button
                            className="btn-submit"
                            onClick={handleSubmit}
                            disabled={submissionStatus === 'Đang chấm điểm...'}
                        >
                            {submissionStatus === 'Đang chấm điểm...' ? 'Đang chấm điểm...' : 'Submit'}
                        </button>
                    </div>
                </div>
            )}

            {testResults.length > 0 && (
                <div className="test-result" style={{ marginTop: '2rem' }}>
                    <h3>Kết quả chấm điểm: <span className={submissionStatus === 'Accepted' ? 'pass' : 'fail'}>{submissionStatus}</span></h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Input</th>
                                <th>Expected Output</th>
                                <th>Your Output</th>
                                <th>Status</th>
                                <th>Time (s)</th>
                                <th>Memory (MB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testResults.map((test, index) => (
                                <tr key={index} className={test.passed ? 'pass' : 'fail'}>
                                    <td>{index + 1}</td>
                                    <td><pre>{test.input}</pre></td>
                                    <td><pre>{test.expectedOutput}</pre></td>
                                    <td><pre>{test.actualOutput}</pre></td>
                                    <td>{test.status}</td>
                                    <td>{test.time}</td>
                                    <td>{test.memory}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ProblemDetailScreen;