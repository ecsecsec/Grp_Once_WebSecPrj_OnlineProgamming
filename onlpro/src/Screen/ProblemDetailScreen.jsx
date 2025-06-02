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
    const [testResult, setTestResult] = useState(null);
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
        const response = await fetch("http://localhost:5000/api/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, language, problemId, }),
        });

        const result = await response.json();

        if (result.output) alert("Output:\n" + result.output);
        else alert("Lỗi:\n" + result.error);


        setSubHistory(prev => [
            {
                timestamp: new Date().toLocaleString(),
                language,
                codeSnippet: code.substring(0, 50) + (code.length > 50 ? '...' : ''),
                output: result.output || '',
                error: result.error || '',
                passed: !!result.output,
            },
            ...prev
        ]);
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
            <p><strong>Mã:</strong> {problem.id}</p>
            <p><strong>Dạng bài:</strong> {problem.type}</p>
            <p><strong>Đã giải:</strong> {problem.solvedBy}</p>
            <p>{problem.detail}</p>
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
                                <th>Kết quả</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subHistory.map((sub, index) => (
                                <tr key={index} className={sub.passed ? 'pass' : 'fail'}>
                                    <td>{sub.timestamp}</td>
                                    <td>{sub.language}</td>
                                    <td><code>{sub.codeSnippet}</code></td>
                                    <td>{sub.passed ? 'Passed' : `Failed (${sub.error || 'Unknown error'})`}</td>
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
                        <button className="btn-submit" onClick={handleSubmit}>Submit</button>
                    </div>
                </div>
            )}
            {testResult && (
                <div className="test-result">
                    <h3>Kết quả test case:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Input</th>
                                <th>Expected</th>
                                <th>Actual</th>
                                <th>Passed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testResult.map((test, index) => (
                                <tr key={index} className={test.passed ? 'pass' : 'fail'}>
                                    <td>{index + 1}</td>
                                    <td>{test.input}</td>
                                    <td>{test.expected}</td>
                                    <td>{test.actual}</td>
                                    <td>{test.passed ? 'Passed' : 'Failed'}</td>
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
