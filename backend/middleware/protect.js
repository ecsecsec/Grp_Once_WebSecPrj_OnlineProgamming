const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  console.log('Authorization header =>', authHeader);

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token =>', decoded);

    req.user = await User.findById(decoded.user.id).select('-password');
    next();
  } catch (err) {
    console.error('JWT error =>', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = protect;
