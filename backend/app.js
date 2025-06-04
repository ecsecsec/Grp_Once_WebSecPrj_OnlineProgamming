const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // ✅ Kết nối MongoDB
require('dotenv').config(); // ✅ Load .env file

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log(' MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const helloRoute = require('./routes/hello');
const authRoute = require('./routes/auth');
const submitRoute = require('./routes/submit');
const problemRoutes = require('./routes/problem');
const adminRoutes = require('./routes/admin/set-role');

app.use('/api/hello', helloRoute);
app.use('/api/auth', authRoute);
app.use('/api/submit', submitRoute);
app.use('/api/problem', problemRoutes);
app.use('/api/admin', adminRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
