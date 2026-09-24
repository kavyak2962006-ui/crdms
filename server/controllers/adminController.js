const { pool } = require('../db');

// Get all pending HR accounts
const getPendingHR = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.status, u.created_at, h.company_name, h.designation
       FROM users u
       LEFT JOIN hr_profiles h ON u.id = h.user_id
       WHERE u.role = 'hr' AND u.status = 'pending'
       ORDER BY u.created_at DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching pending HR:', error);
    res.status(500).json({ message: 'Failed to fetch pending HR accounts.' });
  }
};

// Approve HR account
const approveHR = async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await pool.query('SELECT id, name, role FROM users WHERE id = ? AND role = "hr"', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'HR account not found.' });
    }

    await pool.query('UPDATE users SET status = "active" WHERE id = ?', [id]);

    // Create notification
    await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [id, 'HR Account Approved', 'Your HR account has been approved. You can now access the CRDM platform.']
    );

    res.status(200).json({ message: 'HR account approved successfully.' });
  } catch (error) {
    console.error('Error approving HR:', error);
    res.status(500).json({ message: 'Failed to approve HR account.' });
  }
};

// Reject HR account
const rejectHR = async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await pool.query('SELECT id, name, role FROM users WHERE id = ? AND role = "hr"', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'HR account not found.' });
    }

    await pool.query('UPDATE users SET status = "blocked" WHERE id = ?', [id]);

    // Create notification
    await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [id, 'HR Account Rejected', 'Your HR account has been rejected.']
    );

    res.status(200).json({ message: 'HR account rejected.' });
  } catch (error) {
    console.error('Error rejecting HR:', error);
    res.status(500).json({ message: 'Failed to reject HR account.' });
  }
};

// Get all users for Global User Role Management
const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users list.' });
  }
};

// Update User Role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['student', 'hr', 'tpo', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.status(200).json({ message: 'User role updated successfully.' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role.' });
  }
};

// Update User Status (activate / block)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'active', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified.' });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.status(200).json({ message: `User status updated to ${status}.` });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
};

// Admin overview statistics
const getAdminDashboard = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ pendingHR }]] = await pool.query('SELECT COUNT(*) as pendingHR FROM users WHERE role = "hr" AND status = "pending"');
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM users WHERE role = "student"');
    const [[{ totalActiveHR }]] = await pool.query('SELECT COUNT(*) as totalActiveHR FROM users WHERE role = "hr" AND status = "active"');

    res.status(200).json({
      totalUsers,
      pendingHR,
      totalStudents,
      totalActiveHR
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats.' });
  }
};

// Get all placement drives for Admin (Read-Only)
const getAdminDrives = async (req, res) => {
  try {
    const [drives] = await pool.query(
      `SELECT j.id, j.hr_id, j.title, j.company, j.description, j.ctc, j.eligibility_criteria,
              j.registration_opening, j.registration_closing, j.status, j.created_at, j.updated_at,
              u.name as hr_name, u.email as hr_email,
              COUNT(a.id) as total_applications
       FROM job_postings j
       LEFT JOIN users u ON j.hr_id = u.id
       LEFT JOIN applications a ON j.id = a.job_id
       GROUP BY j.id
       ORDER BY j.created_at DESC`
    );

    const now = new Date();
    const enriched = drives.map((job) => {
      const opening = job.registration_opening ? new Date(job.registration_opening) : null;
      const closing = job.registration_closing ? new Date(job.registration_closing) : null;
      let dynamicStatus = 'Open';
      if (opening && now < opening) {
        dynamicStatus = 'Upcoming';
      } else if (closing && now > closing) {
        dynamicStatus = 'Closed';
      }

      return {
        ...job,
        job_title: job.title,
        job_description: job.description,
        dynamic_status: dynamicStatus
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    console.error('Error fetching admin placement drives:', error);
    res.status(500).json({ message: 'Failed to fetch placement drives list.' });
  }
};

// Update placement drive registration timeline (Admin Governance)
const updateAdminDriveTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { registration_opening, registration_closing } = req.body;

    if (!registration_opening || !registration_closing) {
      return res.status(400).json({ message: 'Both registration opening and closing date/time are required.' });
    }

    const openingDate = new Date(registration_opening);
    const closingDate = new Date(registration_closing);

    if (isNaN(openingDate.getTime()) || isNaN(closingDate.getTime())) {
      return res.status(400).json({ message: 'Invalid registration opening or closing date/time.' });
    }

    if (closingDate.getTime() <= openingDate.getTime()) {
      return res.status(400).json({ message: 'Registration closing date/time must be strictly after the opening date/time.' });
    }

    const [existing] = await pool.query('SELECT id FROM job_postings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found.' });
    }

    await pool.query(
      `UPDATE job_postings 
       SET registration_opening = ?, registration_closing = ?, updated_at = NOW() 
       WHERE id = ?`,
      [openingDate, closingDate, id]
    );

    res.status(200).json({ message: 'Drive registration timeline updated successfully by Admin.' });
  } catch (error) {
    console.error('Error updating drive timeline by Admin:', error);
    res.status(500).json({ message: 'Failed to update placement drive timeline.' });
  }
};

module.exports = {
  getPendingHR,
  approveHR,
  rejectHR,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getAdminDashboard,
  getAdminDrives,
  updateAdminDriveTimeline
};
