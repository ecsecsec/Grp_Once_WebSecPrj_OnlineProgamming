const express = require('express');
const cors = require('cors');
const submitRoute = require('./routes/submit');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/submit', submitRoute);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
