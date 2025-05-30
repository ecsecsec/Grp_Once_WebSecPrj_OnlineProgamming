// File: backend/routes/submit.js
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const WORKDIR = path.join(__dirname, '../../submissions');
if (!fs.existsSync(WORKDIR)) fs.mkdirSync(WORKDIR);

router.post('/', async (req, res) => {
    const { code, language, problemId } = req.body;

    if (!code || !language || !problemId) {
        return res.status(400).json({ error: 'Missing code, language, or problemId' });
    }

    const id = uuidv4();
    const filename = path.join(WORKDIR, `${id}.${getExtension(language)}`);
    fs.writeFileSync(filename, code);

    let runCmd = getRunCommand(filename, language);

    exec(runCmd, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) {
            return res.status(200).json({
                output: stderr || err.message,
                success: false,
            });
        }
        res.json({
            output: stdout,
            success: true,
        });
    });
});

function getExtension(language) {
    switch (language) {
        case 'python': return 'py';
        case 'c_cpp': return 'cpp';
        case 'java': return 'java';
        default: return 'txt';
    }
}

function getRunCommand(filename, language) {
    switch (language) {
        case 'python': return `python3 ${filename}`;
        case 'c_cpp': {
            const exe = filename.replace(/\.cpp$/, '');
            return `g++ ${filename} -o ${exe} && ${exe}`;
        }
        case 'java': {
            const dir = path.dirname(filename);
            const base = path.basename(filename, '.java');
            return `javac ${filename} && java -cp ${dir} ${base}`;
        }
        default: return '';
    }
}

module.exports = router;
