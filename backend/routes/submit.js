const express = require('express');
const router = express.Router();
const executeCode = require('../utils/executor');

router.post('/', async (req, res) => {
    const { code, language } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Thiếu mã nguồn hoặc ngôn ngữ' });
    }

    try {
        const output = await executeCode(code, language);
        res.json({ output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
