//utils/executor.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const LANG_CONFIG = {
    python: {
        ext: 'py',
        run: (filename) => `python3 ${filename}`,
    },
    c_cpp: {
        ext: 'cpp',
        run: (filename) => {
            const exe = filename.replace('.cpp', '');
            return `g++ ${filename} -o ${exe} && ${exe}`;
        },
    },
    java: {
        ext: 'java',
        run: (filename) => `javac ${filename} && java ${path.basename(filename, '.java')}`,
    },
};

module.exports = function executeCode(code, language) {
    return new Promise((resolve, reject) => {
        const lang = LANG_CONFIG[language];
        if (!lang) return reject(new Error('Ngôn ngữ không được hỗ trợ'));

        const filename = `${uuidv4()}.${lang.ext}`;
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, code);

        exec(lang.run(filepath), { timeout: 5000 }, (error, stdout, stderr) => {
            fs.unlinkSync(filepath); // cleanup
            if (language === 'c_cpp') {
                const exe = filepath.replace('.cpp', '');
                if (fs.existsSync(exe)) fs.unlinkSync(exe);
            }
            if (error) return reject(stderr || error.message);
            resolve(stdout);
        });
    });
};
