const { pool } = require('../db');

const getTPODashboard = async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM users WHERE role = "student"');
    const [[{ totalCompanies }]] = await pool.query('SELECT COUNT(*) as totalCompanies FROM users WHERE role = "hr" AND status = "active"');
    const [[{ activeDrives }]] = await pool.query('SELECT COUNT(*) as activeDrives FROM job_postings WHERE status = "open"');
    const [[{ totalPlaced }]] = await pool.query('SELECT COUNT(DISTINCT student_id) as totalPlaced FROM applications WHERE status = "Offered"');

    const [recentDrives] = await pool.query(
      `SELECT id, title, company, description, status, created_at FROM job_postings ORDER BY created_at DESC LIMIT 5`
    );

    res.status(200).json({
      stats: {
        totalStudents,
        totalCompanies,
        activeDrives,
        totalPlaced
      },
      recentDrives: recentDrives || []
    });
  } catch (error) {
    console.error('Error fetching TPO dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch TPO dashboard stats.' });
  }
};

// Get all students with their academic profile details (TPO view)
const getTPOStudents = async (req, res) => {
  try {
    const [students] = await pool.query(
      `SELECT u.id, u.name, u.email, u.status, sp.student_id, sp.department, sp.year, sp.cgpa, sp.arrear_history
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.role = 'student'
       ORDER BY u.id ASC`
    );
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students for TPO:', error);
    res.status(500).json({ message: 'Failed to fetch student academic records.' });
  }
};

// Get core academic details for a specific student (TPO view)
const getStudentAcademic = async (req, res) => {
  try {
    const studentId = req.params.id;
    const [[student]] = await pool.query(
      `SELECT sp.user_id, u.name, u.email, sp.student_id, sp.department, sp.year, sp.cgpa, sp.arrear_history
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = ? AND u.role = 'student'`,
      [studentId]
    );
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student academic details:', error);
    res.status(500).json({ message: 'Failed to fetch student academic details.' });
  }
};

// Update core academic details for a specific student (TPO edit only)
const updateStudentAcademic = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { department, cgpa, arrear_history, year } = req.body;

    // Check if student profile exists
    const [existing] = await pool.query('SELECT id FROM student_profiles WHERE user_id = ?', [studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (department !== undefined) {
      if (!department || typeof department !== 'string' || department.trim() === '') {
        return res.status(400).json({ message: 'Department cannot be empty.' });
      }
      fields.push('department = ?');
      values.push(department.trim());
    }

    if (cgpa !== undefined) {
      if (cgpa === null || cgpa === '') {
        fields.push('cgpa = NULL');
      } else {
        const numCgpa = parseFloat(cgpa);
        if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
          return res.status(400).json({ message: 'CGPA must be a valid number between 0.00 and 10.00.' });
        }
        fields.push('cgpa = ?');
        values.push(numCgpa.toFixed(2));
      }
    }

    if (arrear_history !== undefined) {
      fields.push('arrear_history = ?');
      values.push(String(arrear_history).trim());
    }

    if (year !== undefined && year.trim() !== '') {
      fields.push('year = ?');
      values.push(year.trim());
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update.' });
    }

    const sql = `UPDATE student_profiles SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(studentId);
    await pool.query(sql, values);

    // Return updated record
    const [[updated]] = await pool.query(
      `SELECT sp.user_id, u.name, u.email, sp.student_id, sp.department, sp.year, sp.cgpa, sp.arrear_history
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = ?`,
      [studentId]
    );

    res.status(200).json({
      message: 'Student academic details updated successfully.',
      student: updated
    });
  } catch (error) {
    console.error('Error updating student academic details:', error);
    res.status(500).json({ message: error.message || 'Failed to update student academic details.' });
  }
};

module.exports = {
  getTPODashboard,
  getTPOStudents,
  getStudentAcademic,
  updateStudentAcademic
};
