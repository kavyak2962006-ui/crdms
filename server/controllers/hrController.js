const { pool } = require('../db');
const { sendEmail } = require('../utils/emailService');

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

    // Background process for eligible student notifications
    setImmediate(async () => {
      try {
        const { checkStudentEligibility } = require('./studentController');
        
        const [students] = await pool.query(
          `SELECT u.id as user_id, u.email, u.name, sp.department, sp.year, sp.cgpa, sp.arrear_history, u.new_drive_alerts
           FROM users u
           JOIN student_profiles sp ON u.id = sp.user_id
           WHERE u.role = 'student' AND u.status = 'active'`
        );

        for (const student of students) {
          const eligibility = checkStudentEligibility(student, createdDrive);
          if (eligibility.eligible && student.new_drive_alerts) {
            await pool.query(
              `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
              [
                student.user_id,
                'New Placement Drive Available',
                `A new placement drive has been published: ${companyName} - ${driveTitle}.`
              ]
            );

            sendEmail(
              student.email,
              'CRDM – New Placement Drive Available',
              `Hello ${student.name},\n\nA new placement drive is now available:\n\nCompany: ${companyName}\nDrive: ${driveTitle}\n\nPlease log in to CRDM to view complete details and apply if interested.\n\nRegards,\nCRDM Placement System`,
              `<p>Hello ${student.name},</p><p>A new placement drive is now available:</p><p><b>Company:</b> ${companyName}<br><b>Drive:</b> ${driveTitle}</p><p>Please log in to CRDM to view complete details and apply if interested.</p><p>Regards,<br>CRDM Placement System</p>`
            ).catch(err => console.error("Email failed silently."));
          }
        }
      } catch (err) {
        console.error("Error processing drive notifications:", err);
      }
    });

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

// Export candidates for a placement drive to CSV based on status
const exportCandidates = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ message: 'Status query parameter is required for export.' });
    }

    const validStatuses = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    // Verify drive exists and belongs to this HR
    const [driveRows] = await pool.query(
      'SELECT id, title, company FROM job_postings WHERE id = ? AND hr_id = ?',
      [id, hrUserId]
    );

    if (driveRows.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found or you do not have access.' });
    }

    const drive = driveRows[0];

    // Fetch candidates by status
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
      WHERE a.job_id = ? AND a.status = ?
      ORDER BY u.name ASC`,
      [id, status]
    );

    if (applicants.length === 0) {
      return res.status(404).json({ message: `No ${status.toLowerCase()} candidates found to export.` });
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

    const safeFilename = `${status.toLowerCase()}_candidates_${drive.company}_${drive.title}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase() + '.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error exporting candidates:', error);
    res.status(500).json({ message: 'Failed to export candidates.' });
  }
};

// Bulk update applicant statuses for a drive
const updateApplicantStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;
    const { applicationIds, status } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'No candidates selected for update.' });
    }

    const validStatuses = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      connection.release();
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    // Verify drive belongs to HR
    const [driveRows] = await connection.query(
      'SELECT id, title, company FROM job_postings WHERE id = ? AND hr_id = ?',
      [id, hrUserId]
    );

    if (driveRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Placement drive not found or access denied.' });
    }
    const drive = driveRows[0];

    // Find applications that will actually change
    const placeholders = applicationIds.map(() => '?').join(',');
    const [apps] = await connection.query(
      `SELECT a.id, a.student_id, a.status as old_status, u.email, u.name, u.application_status_alerts
       FROM applications a
       JOIN users u ON a.student_id = u.id
       WHERE a.job_id = ? AND a.id IN (${placeholders})`,
      [id, ...applicationIds]
    );

    const changingApps = apps.filter(app => app.old_status !== status);

    if (changingApps.length === 0) {
      connection.release();
      return res.status(200).json({
        message: '0 candidate(s) updated (all selected already had this status).',
        updatedCount: 0
      });
    }

    const changingIds = changingApps.map(a => a.id);
    const changingPlaceholders = changingIds.map(() => '?').join(',');

    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE applications SET status = ? WHERE id IN (${changingPlaceholders})`,
      [status, ...changingIds]
    );

    for (const app of changingApps) {
      if (app.application_status_alerts) {
        await connection.query(
          `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
          [
            app.student_id,
            'Application Status Updated',
            `Your application for ${drive.company} - ${drive.title} has moved to the ${status} stage.`
          ]
        );
      }
    }

    await connection.commit();

    for (const app of changingApps) {
      if (app.application_status_alerts) {
        sendEmail(
          app.email,
          'CRDM – Application Status Updated',
          `Hello ${app.name},\n\nYour application status for:\nCompany: ${drive.company}\nPlacement Drive: ${drive.title}\n\nhas been updated to:\n${status}\n\nPlease log in to the CRDM portal for more details.\n\nRegards,\nCRDM Placement System`,
          `<p>Hello ${app.name},</p><p>Your application status for:</p><p><b>Company:</b> ${drive.company}<br><b>Placement Drive:</b> ${drive.title}</p><p>has been updated to: <b>${status}</b></p><p>Please log in to the CRDM portal for more details.</p><p>Regards,<br>CRDM Placement System</p>`
        ).catch(() => {});
      }
    }

    res.status(200).json({
      message: `${result.affectedRows} candidate(s) updated to '${status}'.`,
      updatedCount: result.affectedRows
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating applicant statuses:', error);
    res.status(500).json({ message: 'Failed to update candidate statuses.' });
  } finally {
    if (connection) connection.release();
  }
};

// Generate Interview Slots
const generateInterviewSlots = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;
    const { interviewDate, startTime, endTime, slotDuration } = req.body;

    // Basic validation
    if (!interviewDate || !startTime || !endTime || !slotDuration) {
      return res.status(400).json({ message: 'Missing required fields for slot generation.' });
    }

    const duration = parseInt(slotDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ message: 'Slot duration must be a positive number.' });
    }

    // Parse times (using a dummy date to parse time safely)
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    const totalMinutes = (end - start) / 60000;
    if (duration > totalMinutes) {
      return res.status(400).json({ message: 'Slot duration cannot be longer than the total time block.' });
    }

    // Verify drive ownership
    const [driveRows] = await pool.query(
      'SELECT id FROM job_postings WHERE id = ? AND hr_id = ?',
      [id, hrUserId]
    );

    if (driveRows.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found or access denied.' });
    }

    // Generate slots
    const slots = [];
    let current = new Date(start);

    while (current < end) {
      const next = new Date(current.getTime() + duration * 60000);
      
      // Do not generate if it exceeds end time
      if (next > end) {
        break;
      }

      // Format time as HH:MM:SS
      const sTime = current.toTimeString().split(' ')[0];
      const eTime = next.toTimeString().split(' ')[0];

      slots.push([id, interviewDate, sTime, eTime, duration, 'Available']);
      current = next;
    }

    if (slots.length === 0) {
      return res.status(400).json({ message: 'No valid slots could be generated with the given parameters.' });
    }

    // Insert slots (ignoring exact duplicates via INSERT IGNORE)
    const [result] = await pool.query(
      `INSERT IGNORE INTO interview_slots 
       (job_id, interview_date, start_time, end_time, duration_minutes, status) 
       VALUES ?`,
      [slots]
    );

    res.status(200).json({
      message: `${result.affectedRows} new interview slot(s) generated successfully.`,
      generatedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Error generating slots:', error);
    res.status(500).json({ message: 'Failed to generate interview slots.' });
  }
};

// Get Interview Slots for a Drive
const getInterviewSlots = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id } = req.params;

    // Verify drive ownership
    const [driveRows] = await pool.query(
      'SELECT id FROM job_postings WHERE id = ? AND hr_id = ?',
      [id, hrUserId]
    );

    if (driveRows.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found or access denied.' });
    }

    const [slots] = await pool.query(
      `SELECT id, job_id, DATE_FORMAT(interview_date, '%Y-%m-%d') as interview_date, start_time, end_time, duration_minutes, status, created_at 
       FROM interview_slots 
       WHERE job_id = ? 
       ORDER BY interview_date ASC, start_time ASC`,
      [id]
    );

    res.status(200).json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Failed to fetch interview slots.' });
  }
};

// Delete an Interview Slot
const deleteInterviewSlot = async (req, res) => {
  try {
    const hrUserId = req.user.id;
    const { id: driveId, slotId } = req.params;

    // Verify drive ownership
    const [driveRows] = await pool.query(
      'SELECT id FROM job_postings WHERE id = ? AND hr_id = ?',
      [driveId, hrUserId]
    );

    if (driveRows.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found or access denied.' });
    }

    // Attempt to delete slot (Cascades bookings if any, or we can restrict to Available only)
    const [result] = await pool.query(
      'DELETE FROM interview_slots WHERE id = ? AND job_id = ?',
      [slotId, driveId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slot not found.' });
    }

    res.status(200).json({ message: 'Slot deleted successfully.' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ message: 'Failed to delete interview slot.' });
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
  exportCandidates,
  updateApplicantStatus,
  generateInterviewSlots,
  getInterviewSlots,
  deleteInterviewSlot,
  computeDriveStatus,
  parseDriveEligibility
};
