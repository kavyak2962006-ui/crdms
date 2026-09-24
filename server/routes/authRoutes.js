const express = require('express');
const router = express.Router();
const {
  login,
  registerStudent,
  registerHR,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', registerStudent);
router.post('/register-hr', registerHR);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);

module.exports = router;
