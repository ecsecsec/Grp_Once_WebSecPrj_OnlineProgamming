const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/hello', (req, res) =>{
    res => res.json({message: 'hello'});
});
app.get('/', (req, res) => {
    res.send("loading");
});
app.post('/submit', async (req, res) => {
    const { code, language } = req.body;
    const filename = `Main_${Date.now()}`;
    const tempDir = './tmp';
    const inputFilePath = path.join(tempDir, filename);

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    let filepath, command;

    switch (language) {
        case 'python':
            filepath = `${inputFilePath}.py`;
            fs.writeFileSync(filepath, code);
            command = `python3 ${filepath}`;
            break;
        case 'c_cpp':
            filepath = `${inputFilePath}.cpp`;
            fs.writeFileSync(filepath, code);
            command = `g++ ${filepath} -o ${inputFilePath}.out && ${inputFilePath}.out`;
            break;
        case 'java':
            filepath = `${inputFilePath}.java`;
            fs.writeFileSync(filepath, code);
            command = `javac ${filepath} && java -cp ${tempDir} ${filename}`;
            break;
        default:
            return res.status(400).json({ error: 'Ngôn ngữ không hỗ trợ' });
    }

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        fs.rmSync(tempDir, { recursive: true, force: true });

        if (error) {
            return res.json({ output: stderr || error.message });
        }
        return res.json({ output: stdout });
    });
});

app.listen(PORT, () => {
    console.log(`Backend is running at http://localhost:${PORT}`);
});
