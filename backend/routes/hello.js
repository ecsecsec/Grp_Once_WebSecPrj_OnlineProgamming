const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({message: "Chào mừng đến với Web!"})
});

module.exports = router;
