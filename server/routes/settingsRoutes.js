const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateProfile,
  updateNotifications
} = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

// All settings routes require authentication
router.use(authenticateToken);

router.get('/', getSettings);
router.put('/profile', upload.single('profile_picture'), updateProfile);
router.put('/notifications', updateNotifications);

module.exports = router;
