const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Đường dẫn đúng với cấu trúc thư mục
const helloRoute = require('./routes/hello');

app.use(cors());
app.use(express.json());

// Dùng router đúng kiểu
app.use('/api/hello', helloRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
