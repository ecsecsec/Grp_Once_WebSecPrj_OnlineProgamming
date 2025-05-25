import { useParams } from "react-router-dom";
import './ProblemDetail.css';
import { useState } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";


function ProblemDetailScreen() {
    const { problemId } = useParams();
    const [showEditor, setShowEditor] = useState(false);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');

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

    const handleSubmit = async () => {
        const response = await fetch("https://localhost:5000/api/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, language }),
        });

        const result = await response.json();
        if (result.output) alert("Output:\n" + result.output);
        else alert("Lỗi:\n" + result.error);
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
        </div>
    );
}

export default ProblemDetailScreen;
