const { pool } = require('../db');

// Helper to compute dynamic drive status based on current time
const computeDriveStatus = (opening, closing) => {
  const now = new Date();
  if (opening && now < new Date(opening)) {
    return 'Upcoming';
  }
  if (closing && now > new Date(closing)) {
    return 'Closed';
  }
  return 'Open';
};

// Helper to parse drive eligibility fields
const parseDriveEligibility = (job) => {
  let depts = [];
  if (job.eligible_departments) {
    try {
      depts = typeof job.eligible_departments === 'string' ? JSON.parse(job.eligible_departments) : job.eligible_departments;
    } catch (e) {
      depts = [job.eligible_departments];
    }
  }
  return {
    ...job,
    job_title: job.title,
    job_description: job.description,
    minimum_cgpa: job.minimum_cgpa !== null && job.minimum_cgpa !== undefined ? Number(job.minimum_cgpa) : null,
    eligible_departments: Array.isArray(depts) ? depts : [],
    maximum_arrears: job.maximum_arrears !== null && job.maximum_arrears !== undefined ? Number(job.maximum_arrears) : null,
    minimum_year: job.minimum_year || null,
    required_skills: job.required_skills || null,
    dynamic_status: computeDriveStatus(job.registration_opening, job.registration_closing)
  };
};

const getHRDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.status, h.company_name, h.designation
       FROM users u
       LEFT JOIN hr_profiles h ON u.id = h.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'HR profile not found.' });
    }

    const hrInfo = users[0];

    const [notifications] = await pool.query(
      `SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    const [jobPostings] = await pool.query(
      `SELECT j.id, j.hr_id, j.title, j.company, j.description, j.ctc, j.eligibility_criteria,
              j.minimum_cgpa, j.eligible_departments, j.maximum_arrears, j.minimum_year, j.required_skills,
              j.registration_opening, j.registration_closing, j.status, j.created_at, j.updated_at,
              COUNT(a.id) as applications_count
       FROM job_postings j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.hr_id = ?
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [userId]
    );

    // Calculate application count for this HR's drives
    const [[{ totalApplications }]] = await pool.query(
      `SELECT COUNT(*) as totalApplications
       FROM applications a
       JOIN job_postings j ON a.job_id = j.id
       WHERE j.hr_id = ?`,
      [userId]
    );

    const enrichedDrives = jobPostings.map(parseDriveEligibility);
    const activeDrivesCount = enrichedDrives.filter(d => d.dynamic_status === 'Open').length;
    const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

    res.status(200).json({
      hrInfo,
      stats: {
        activePostings: activeDrivesCount,
        totalPostings: jobPostings.length,
        totalApplications: totalApplications || 0,
        unreadNotifications: unreadNotificationsCount,
        totalNotifications: notifications.length
      },
      notifications: notifications || [],
      jobPostings: enrichedDrives || []
    });
  } catch (error) {
    console.error('Error fetching HR dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch HR dashboard data.' });
  }
};

const getHRNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications] = await pool.query(
      `SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [userId]
    );
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read.' });
  }
};

// Create a new placement drive (HR only)
const createPlacementDrive = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const {
      job_title,
      title,
      job_description,
      description,
      ctc,
      eligibility_criteria,
      minimum_cgpa,
      eligible_departments,
      maximum_arrears,
      minimum_year,
      required_skills,
      registration_opening,
      registration_closing
    } = req.body;

    const driveTitle = (job_title || title || '').trim();
    const driveDesc = (job_description || description || '').trim();
    const driveCtc = (ctc || '').trim();

    // Mandatory Core Validations
    if (!driveTitle) {
      return res.status(400).json({ message: 'Job title is required.' });
    }
    if (!driveDesc) {
      return res.status(400).json({ message: 'Job description is required.' });
    }
    if (!driveCtc) {
      return res.status(400).json({ message: 'CTC is required.' });
    }
    if (!registration_opening) {
      return res.status(400).json({ message: 'Registration opening date/time is required.' });
    }
    if (!registration_closing) {
      return res.status(400).json({ message: 'Registration closing date/time is required.' });
    }

    const openingDate = new Date(registration_opening);
    const closingDate = new Date(registration_closing);

    if (isNaN(openingDate.getTime())) {
      return res.status(400).json({ message: 'Registration opening date/time is invalid.' });
    }
    if (isNaN(closingDate.getTime())) {
      return res.status(400).json({ message: 'Registration closing date/time is invalid.' });
    }
    if (closingDate.getTime() <= openingDate.getTime()) {
      return res.status(400).json({ message: 'Registration closing date/time must be strictly after opening date/time.' });
    }

    // Structured Eligibility Validation
    let parsedCgpa = null;
    if (minimum_cgpa !== undefined && minimum_cgpa !== null && minimum_cgpa !== '') {
      parsedCgpa = parseFloat(minimum_cgpa);
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        return res.status(400).json({ message: 'Minimum CGPA must be a valid number between 0.0 and 10.0.' });
      }
    }

    let parsedArrears = null;
    if (maximum_arrears !== undefined && maximum_arrears !== null && maximum_arrears !== '') {
      parsedArrears = parseInt(maximum_arrears, 10);
      if (isNaN(parsedArrears) || parsedArrears < 0) {
        return res.status(400).json({ message: 'Maximum arrears must be a non-negative integer (0, 1, 2, etc.).' });
      }
    }

    let deptsJson = null;
    if (eligible_departments) {
      let deptsArr = Array.isArray(eligible_departments) ? eligible_departments : [];
      if (typeof eligible_departments === 'string') {
        try {
          deptsArr = JSON.parse(eligible_departments);
        } catch (e) {
          deptsArr = eligible_departments.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (deptsArr.length > 0) {
        deptsJson = JSON.stringify(deptsArr);
      }
    }

    const parsedMinYear = minimum_year ? String(minimum_year).trim() : null;
    const parsedSkills = required_skills ? String(required_skills).trim() : null;

    // Build human-readable eligibility summary if text criteria not explicitly provided
    let summaryCriteria = (eligibility_criteria || '').trim();
    if (!summaryCriteria) {
      const summaryParts = [];
      if (parsedCgpa !== null) summaryParts.push(`Min CGPA: ${parsedCgpa.toFixed(2)}`);
      if (deptsJson) {
        const dArr = JSON.parse(deptsJson);
        summaryParts.push(`Depts: ${dArr.join(', ')}`);
      }
      if (parsedArrears !== null) summaryParts.push(`Max Arrears: ${parsedArrears}`);
      if (parsedMinYear) summaryParts.push(`Min Year: ${parsedMinYear}`);
      if (parsedSkills) summaryParts.push(`Skills: ${parsedSkills}`);
      summaryCriteria = summaryParts.length > 0 ? summaryParts.join(' | ') : 'Standard eligibility requirements.';
    }

    // Resolve company name
    const [[hrProfile]] = await pool.query(
      `SELECT cp.company_name as cp_name, hp.company_name as hp_name
       FROM users u
       LEFT JOIN company_profiles cp ON u.id = cp.hr_user_id
       LEFT JOIN hr_profiles hp ON u.id = hp.user_id
       WHERE u.id = ?`,
      [hrUserId]
    );

    const companyName = hrProfile?.cp_name || hrProfile?.hp_name || req.body.company || 'Corporate Partner';

    const [result] = await pool.query(
      `INSERT INTO job_postings (
        hr_id, title, company, description, ctc, eligibility_criteria,
        minimum_cgpa, eligible_departments, maximum_arrears, minimum_year, required_skills,
        registration_opening, registration_closing, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW(), NOW())`,
      [
        hrUserId,
        driveTitle,
        companyName,
        driveDesc,
        driveCtc,
        summaryCriteria,
        parsedCgpa,
        deptsJson,
        parsedArrears,
        parsedMinYear,
        parsedSkills,
        openingDate,
        closingDate
      ]
    );

    const newDriveId = result.insertId;

    const [[createdDrive]] = await pool.query(
      `SELECT * FROM job_postings WHERE id = ?`,
      [newDriveId]
    );

    res.status(201).json({
      message: 'Placement drive created successfully with structured eligibility requirements.',
      drive: parseDriveEligibility(createdDrive)
    });
  } catch (error) {
    console.error('Error creating placement drive:', error);
    res.status(500).json({ message: 'Failed to create placement drive.' });
  }
};

// Get all drives created by authenticated HR
const getHRDrives = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const [drives] = await pool.query(
      `SELECT j.*, COUNT(a.id) as applications_count
       FROM job_postings j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.hr_id = ?
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [hrUserId]
    );

    res.status(200).json(drives.map(parseDriveEligibility));
  } catch (error) {
    console.error('Error fetching HR drives:', error);
    res.status(500).json({ message: 'Failed to fetch HR placement drives.' });
  }
};

// Get single drive by ID (HR ownership check)
const getHRDriveById = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT j.*, COUNT(a.id) as applications_count
       FROM job_postings j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.id = ? AND j.hr_id = ?
       GROUP BY j.id`,
      [id, hrUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found or unauthorized.' });
    }

    res.status(200).json(parseDriveEligibility(rows[0]));
  } catch (error) {
    console.error('Error fetching drive by ID:', error);
    res.status(500).json({ message: 'Failed to fetch drive details.' });
  }
};

// Update drive (HR ownership check)
const updateHRDrive = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, hr_id FROM job_postings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found.' });
    }
    if (existing[0].hr_id !== hrUserId) {
      return res.status(403).json({ message: 'Unauthorized: You can only edit drives you created.' });
    }

    const {
      job_title,
      title,
      job_description,
      description,
      ctc,
      eligibility_criteria,
      minimum_cgpa,
      eligible_departments,
      maximum_arrears,
      minimum_year,
      required_skills,
      registration_opening,
      registration_closing
    } = req.body;

    const driveTitle = (job_title || title || '').trim();
    const driveDesc = (job_description || description || '').trim();
    const driveCtc = (ctc || '').trim();

    if (!driveTitle) {
      return res.status(400).json({ message: 'Job title is required.' });
    }
    if (!driveDesc) {
      return res.status(400).json({ message: 'Job description is required.' });
    }
    if (!driveCtc) {
      return res.status(400).json({ message: 'CTC is required.' });
    }
    if (!registration_opening) {
      return res.status(400).json({ message: 'Registration opening date/time is required.' });
    }
    if (!registration_closing) {
      return res.status(400).json({ message: 'Registration closing date/time is required.' });
    }

    const openingDate = new Date(registration_opening);
    const closingDate = new Date(registration_closing);

    if (isNaN(openingDate.getTime()) || isNaN(closingDate.getTime())) {
      return res.status(400).json({ message: 'Invalid registration opening or closing date/time.' });
    }
    if (closingDate.getTime() <= openingDate.getTime()) {
      return res.status(400).json({ message: 'Registration closing date/time must be strictly after opening date/time.' });
    }

    // Structured Eligibility Validation
    let parsedCgpa = null;
    if (minimum_cgpa !== undefined && minimum_cgpa !== null && minimum_cgpa !== '') {
      parsedCgpa = parseFloat(minimum_cgpa);
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        return res.status(400).json({ message: 'Minimum CGPA must be a valid number between 0.0 and 10.0.' });
      }
    }

    let parsedArrears = null;
    if (maximum_arrears !== undefined && maximum_arrears !== null && maximum_arrears !== '') {
      parsedArrears = parseInt(maximum_arrears, 10);
      if (isNaN(parsedArrears) || parsedArrears < 0) {
        return res.status(400).json({ message: 'Maximum arrears must be a non-negative integer.' });
      }
    }

    let deptsJson = null;
    if (eligible_departments) {
      let deptsArr = Array.isArray(eligible_departments) ? eligible_departments : [];
      if (typeof eligible_departments === 'string') {
        try {
          deptsArr = JSON.parse(eligible_departments);
        } catch (e) {
          deptsArr = eligible_departments.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (deptsArr.length > 0) {
        deptsJson = JSON.stringify(deptsArr);
      }
    }

    const parsedMinYear = minimum_year ? String(minimum_year).trim() : null;
    const parsedSkills = required_skills ? String(required_skills).trim() : null;

    let summaryCriteria = (eligibility_criteria || '').trim();
    if (!summaryCriteria) {
      const summaryParts = [];
      if (parsedCgpa !== null) summaryParts.push(`Min CGPA: ${parsedCgpa.toFixed(2)}`);
      if (deptsJson) {
        const dArr = JSON.parse(deptsJson);
        summaryParts.push(`Depts: ${dArr.join(', ')}`);
      }
      if (parsedArrears !== null) summaryParts.push(`Max Arrears: ${parsedArrears}`);
      if (parsedMinYear) summaryParts.push(`Min Year: ${parsedMinYear}`);
      if (parsedSkills) summaryParts.push(`Skills: ${parsedSkills}`);
      summaryCriteria = summaryParts.length > 0 ? summaryParts.join(' | ') : 'Standard eligibility requirements.';
    }

    await pool.query(
      `UPDATE job_postings
       SET title = ?, description = ?, ctc = ?, eligibility_criteria = ?,
           minimum_cgpa = ?, eligible_departments = ?, maximum_arrears = ?, minimum_year = ?, required_skills = ?,
           registration_opening = ?, registration_closing = ?, updated_at = NOW()
       WHERE id = ? AND hr_id = ?`,
      [
        driveTitle,
        driveDesc,
        driveCtc,
        summaryCriteria,
        parsedCgpa,
        deptsJson,
        parsedArrears,
        parsedMinYear,
        parsedSkills,
        openingDate,
        closingDate,
        id,
        hrUserId
      ]
    );

    const [[updatedDrive]] = await pool.query('SELECT * FROM job_postings WHERE id = ?', [id]);

    res.status(200).json({
      message: 'Placement drive updated successfully.',
      drive: parseDriveEligibility(updatedDrive)
    });
  } catch (error) {
    console.error('Error updating HR drive:', error);
    res.status(500).json({ message: 'Failed to update placement drive.' });
  }
};

// Delete drive (HR ownership check)
const deleteHRDrive = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, hr_id FROM job_postings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found.' });
    }
    if (existing[0].hr_id !== hrUserId) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete drives you created.' });
    }

    await pool.query('DELETE FROM job_postings WHERE id = ? AND hr_id = ?', [id, hrUserId]);

    res.status(200).json({ message: 'Placement drive deleted successfully.' });
  } catch (error) {
    console.error('Error deleting HR drive:', error);
    res.status(500).json({ message: 'Failed to delete placement drive.' });
  }
};

// Get real-time applicant list for a specific drive (HR ownership enforced)
const getDriveApplicants = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;

    // Verify drive exists and belongs to this HR
    const [driveRows] = await pool.query(
      'SELECT id, title, company FROM job_postings WHERE id = ? AND hr_id = ?',
      [id, hrUserId]
    );

    if (driveRows.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found or you do not have access.' });
    }

    const drive = driveRows[0];

    // Fetch all applicants with student profile data
    const [applicants] = await pool.query(
      `SELECT
        a.id AS application_id,
        a.status AS application_status,
        a.created_at AS applied_at,
        u.id AS user_id,
        u.name AS student_name,
        u.email AS student_email,
        sp.student_id AS student_roll_no,
        sp.department,
        sp.year,
        sp.cgpa,
        sp.arrear_history,
        ssp.skills,
        ssp.resume_path
      FROM applications a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN student_secondary_profiles ssp ON u.id = ssp.student_user_id
      WHERE a.job_id = ?
      ORDER BY a.created_at DESC`,
      [id]
    );

    res.status(200).json({
      driveId: drive.id,
      driveTitle: drive.title,
      company: drive.company,
      totalApplicants: applicants.length,
      applicants
    });
  } catch (error) {
    console.error('Error fetching drive applicants:', error);
    res.status(500).json({ message: 'Failed to fetch applicant list.' });
  }
};

// Export shortlisted candidates for a placement drive to CSV
const exportShortlistedCandidates = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;

    // Verify drive exists and belongs to this HR
    const [driveRows] = await pool.query(
      'SELECT id, title, company FROM job_postings WHERE id = ? AND hr_id = ?',
      [id, hrUserId]
    );

    if (driveRows.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found or you do not have access.' });
    }

    const drive = driveRows[0];

    // Fetch shortlisted candidates
    const [applicants] = await pool.query(
      `SELECT
        a.id AS application_id,
        u.name AS student_name,
        u.email AS student_email,
        sp.student_id AS student_roll_no,
        sp.department,
        sp.year,
        sp.cgpa,
        sp.arrear_history,
        a.status AS application_status,
        a.created_at AS applied_at
      FROM applications a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE a.job_id = ? AND a.status = 'Shortlisted'
      ORDER BY u.name ASC`,
      [id]
    );

    if (applicants.length === 0) {
      return res.status(404).json({ message: 'No shortlisted candidates found to export.' });
    }

    // Build CSV
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str);
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const headers = [
      'Application ID', 'Student Name', 'Email', 'Roll No', 'Department', 'Year',
      'CGPA', 'Arrear History', 'Application Status', 'Applied At', 'Company', 'Drive Title'
    ];

    let csvContent = headers.map(escapeCsv).join(',') + '\n';

    applicants.forEach(app => {
      const row = [
        app.application_id,
        app.student_name,
        app.student_email,
        app.student_roll_no,
        app.department,
        app.year,
        app.cgpa,
        app.arrear_history,
        app.application_status,
        new Date(app.applied_at).toLocaleString(),
        drive.company,
        drive.title
      ];
      csvContent += row.map(escapeCsv).join(',') + '\n';
    });

    const safeFilename = `shortlisted_${drive.company}_${drive.title}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase() + '.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error exporting shortlisted candidates:', error);
    res.status(500).json({ message: 'Failed to export shortlisted candidates.' });
  }
};

module.exports = {
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
  exportShortlistedCandidates,
  computeDriveStatus,
  parseDriveEligibility
};
