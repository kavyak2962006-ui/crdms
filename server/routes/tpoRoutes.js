const express = require('express');
const router = express.Router();
const { 
  getTPODashboard, 
  getTPOStudents, 
  getStudentAcademic, 
  updateStudentAcademic 
} = require('../controllers/tpoController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('tpo'));

router.get('/dashboard', getTPODashboard);
router.get('/students', getTPOStudents);
router.get('/students/:id/academic', getStudentAcademic);
router.put('/students/:id/academic', updateStudentAcademic);

module.exports = router;
