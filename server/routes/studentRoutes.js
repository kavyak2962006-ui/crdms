const express = require('express');
const router = express.Router();
const { 
  getStudentDashboard, 
  getStudentProfile, 
  getSecondaryProfile, 
  saveSecondaryProfile,
  getStudentDrives,
  registerForDrive,
  getAvailableInterviewSlots,
  bookInterviewSlot
} = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

router.use(authenticateToken);
router.use(authorizeRoles('student'));

router.get('/secondary-profile', getSecondaryProfile);
router.post('/secondary-profile', upload.single('resume'), saveSecondaryProfile);

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);

// Placement Drive routes for students
router.get('/drives', getStudentDrives);
router.post('/drives/:id/register', registerForDrive);

router.get('/drives/:driveId/interview-slots', getAvailableInterviewSlots);
router.post('/drives/:driveId/interview-slots/:slotId/book', bookInterviewSlot);

module.exports = router;
