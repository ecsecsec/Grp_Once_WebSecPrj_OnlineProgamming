// backend/app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Cấu hình CORS chặt chẽ hơn cho production
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI) // Đảm bảo MONGO_URI trong .env
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const helloRoute = require('./routes/hello'); // Nếu vẫn dùng
const authRoute = require('./routes/auth');
const problemRoutes = require('./routes/problem');
const adminRoutes = require('./routes/admin/set-role'); 
const submissionRoutes = require('./routes/submission'); 

app.use('/api/hello', helloRoute);
app.use('/api/auth', authRoute);
app.use('/api/problem', problemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes); 


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});