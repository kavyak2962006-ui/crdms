const express = require('express');
const router = express.Router();
const {
  getHRDashboard,
  getHRNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createPlacementDrive,
  getHRDrives,
  getHRDriveById,
  updateHRDrive,
  deleteHRDrive,
  getDriveApplicants,
  exportShortlistedCandidates
} = require('../controllers/hrController');
const { getCompanyProfile, createCompanyProfile, updateCompanyProfile } = require('../controllers/companyController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({ storage });

router.use(authenticateToken);
router.use(authorizeRoles('hr'));

router.get('/dashboard', getHRDashboard);
router.get('/notifications', getHRNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/mark-all-read', markAllNotificationsRead);

// Placement Drive routes (HR only)
router.post('/drives', createPlacementDrive);
router.get('/drives', getHRDrives);
router.get('/drives/:id', getHRDriveById);
router.put('/drives/:id', updateHRDrive);
router.delete('/drives/:id', deleteHRDrive);
router.get('/drives/:id/applicants', getDriveApplicants);
router.get('/drives/:id/shortlisted/export', exportShortlistedCandidates);

// Company profile routes (HR only)
router.get('/company/profile', getCompanyProfile);
router.post('/company/profile', upload.single('logo'), createCompanyProfile);
router.put('/company/profile', upload.single('logo'), updateCompanyProfile);

module.exports = router;
