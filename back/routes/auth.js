const express = require('express');
const router = express.Router();
const {
  login,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
  resendCode,
  getProfile,
  debugPassword,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Публичные маршруты
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-code', resendCode);
router.post('/debug-password', debugPassword);

// Защищенные маршруты
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;