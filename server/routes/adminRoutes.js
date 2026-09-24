const express = require('express');
const router = express.Router();
const {
  getPendingHR,
  approveHR,
  rejectHR,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getAdminDashboard,
  getAdminDrives,
  updateAdminDriveTimeline
} = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/drives', getAdminDrives);
router.put('/drives/:id/timeline', updateAdminDriveTimeline);
router.get('/hr/pending', getPendingHR);
router.put('/hr/:id/approve', approveHR);
router.put('/hr/:id/reject', rejectHR);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;
