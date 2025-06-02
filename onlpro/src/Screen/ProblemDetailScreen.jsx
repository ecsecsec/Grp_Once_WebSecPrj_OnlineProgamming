import { useParams } from "react-router-dom";
import './ProblemDetail.css';
import { useState, useEffect } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";


function ProblemDetailScreen() {
    const { problemId } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showEditor, setShowEditor] = useState(false);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');

    // Sửa lỗi: Khai báo đúng tên state
    const [submissionStatus, setSubmissionStatus] = useState(null); // Trạng thái tổng thể: Accepted, Failed, Running...
    const [testResults, setTestResults] = useState([]); // Kết quả chi tiết từng test case

    const [subHistory, setSubHistory] = useState([]);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/problem/getproblem/${problemId}`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
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
    }, [problemId]);

    if (loading) return <div>Đang tải bài tập...</div>;
    if (error) return <div>Lỗi khi tải bài tập: {error}</div>;
    if (!problem) return <div>Không tìm thấy bài tập!</div>;


    const handleSubmit = async () => {
        setSubmissionStatus('Running...');
        setTestResults([]); // Xóa kết quả cũ trước khi submit mới

        try {
            const response = await fetch("http://localhost:5000/api/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code, language, problemId }),
            });

            const result = await response.json();

            setSubmissionStatus(result.overallStatus); // Cập nhật trạng thái tổng thể
            setTestResults(result.testResults || []); // Cập nhật kết quả chi tiết từng test case

            // Xóa các alert không cần thiết, thông tin đã hiển thị trong bảng testResults
            // if (result.output) alert("Output:\n" + result.output);
            // else alert("Lỗi:\n" + result.error);


            setSubHistory(prev => [
                {
                    timestamp: new Date().toLocaleString(),
                    language,
                    codeSnippet: code.substring(0, 50) + (code.length > 50 ? '...' : ''),
                    overallStatus: result.overallStatus,
                    message: result.message,
                    // Nếu bạn muốn lưu trữ testResults chi tiết trong lịch sử, hãy thêm vào đây
                    // testResults: result.testResults,
                },
                ...prev
            ]);
        } catch (err) {
            console.error("Submission failed:", err);
            setSubmissionStatus('Error: ' + err.message);
            setTestResults([]); // Đảm bảo clear kết quả nếu có lỗi
            setSubHistory(prev => [
                {
                    timestamp: new Date().toLocaleString(),
                    language,
                    codeSnippet: code.substring(0, 50) + (code.length > 50 ? '...' : ''),
                    overallStatus: 'Error',
                    message: `Lỗi kết nối hoặc xử lý: ${err.message}`,
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
            {/* Sử dụng problem.id nếu bạn đã cấu hình backend trả về trường này */}
            {/* Hoặc sử dụng problem._id nếu bạn dùng ID mặc định của MongoDB */}
            <p><strong>Mã:</strong> {problem.id}</p>
            <p><strong>Dạng bài:</strong> {problem.type}</p>
            <p><strong>Đã giải:</strong> {problem.solvedBy}</p>
            <p>{problem.detail}</p>

            {/* Hiển thị test case mẫu nếu có */}
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
                            // Sửa lỗi: Dùng biến `submissionStatus` để kiểm tra điều kiện
                            disabled={submissionStatus === 'Running...'}
                        >
                            {submissionStatus === 'Running...' ? 'Đang chấm điểm...' : 'Submit'}
                        </button>
                    </div>
                </div>
            )}

            {/* Hiển thị kết quả chấm điểm chi tiết */}
            {testResults.length > 0 && ( // Kiểm tra testResults chứ không phải testResult
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
                                    <td>{test.testCase}</td>
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