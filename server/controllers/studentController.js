const { pool } = require('../db');
const path = require('path');

const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user details & profile
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, sp.student_id, sp.department, sp.year, sp.cgpa, sp.arrear_history
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const studentInfo = users[0];

    // Query application stats from applications table if present
    const [appStats] = await pool.query(
      `SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN status = 'Shortlisted' THEN 1 ELSE 0 END) as shortlisted,
        SUM(CASE WHEN status = 'Interview' THEN 1 ELSE 0 END) as interviews,
        SUM(CASE WHEN status = 'Offered' THEN 1 ELSE 0 END) as offers
       FROM applications WHERE student_id = ?`,
      [userId]
    );

    const stats = {
      applications: appStats[0].totalApplications || 0,
      shortlisted: appStats[0].shortlisted || 0,
      interviews: appStats[0].interviews || 0,
      offers: appStats[0].offers || 0
    };

    // Retrieve recent applications
    const [applications] = await pool.query(
      `SELECT a.id, a.job_id, a.status, a.created_at, j.title, j.company
       FROM applications a
       JOIN job_postings j ON a.job_id = j.id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC LIMIT 5`,
      [userId]
    );

    // Retrieve open drives where registration_opening has been reached
    const [upcomingDrives] = await pool.query(
      `SELECT id, title, company, description, ctc, eligibility_criteria, registration_opening, registration_closing, created_at
       FROM job_postings
       WHERE registration_opening IS NOT NULL AND registration_opening <= NOW()
       ORDER BY registration_opening DESC LIMIT 5`
    );

    res.status(200).json({
      studentInfo,
      stats,
      applications: applications || [],
      upcomingDrives: upcomingDrives || []
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch student dashboard data.' });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, sp.student_id, sp.department, sp.year, sp.cgpa, sp.arrear_history
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Failed to fetch student profile.' });
  }
};

// Get secondary profile for the logged-in student
const getSecondaryProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT * FROM student_secondary_profiles WHERE student_user_id = ?`,
      [userId]
    );
    if (rows.length === 0) {
      return res.json({ skills: '', projects: '', resume_path: '' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching secondary profile:', error);
    res.status(500).json({ message: 'Failed to fetch secondary profile.' });
  }
};

// Save secondary profile (create or update). Handles resume PDF upload.
// Academic fields (department, cgpa, arrear_history, year) are strictly excluded and protected from student modification.
const saveSecondaryProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skills = '', projects = '' } = req.body;
    let resumePath = null;
    if (req.file) {
      resumePath = `uploads/${req.file.filename}`;
    }
    // Check if profile exists
    const [existing] = await pool.query(
      `SELECT id FROM student_secondary_profiles WHERE student_user_id = ?`,
      [userId]
    );
    if (existing.length > 0) {
      // Update existing profile (only secondary fields permitted)
      const fields = ['updated_at = NOW()'];
      const values = [];
      if (skills !== undefined) { fields.push('skills = ?'); values.push(skills); }
      if (projects !== undefined) { fields.push('projects = ?'); values.push(projects); }
      if (resumePath) { fields.push('resume_path = ?'); values.push(resumePath); }
      
      const sql = `UPDATE student_secondary_profiles SET ${fields.join(', ')} WHERE student_user_id = ?`;
      values.push(userId);
      await pool.query(sql, values);
    } else {
      // Insert new secondary profile
      await pool.query(
        `INSERT INTO student_secondary_profiles (student_user_id, skills, projects, resume_path, updated_at) VALUES (?,?,?,?, NOW())`,
        [userId, skills, projects, resumePath]
      );
    }
    res.json({ message: 'Secondary profile saved successfully.' });
  } catch (error) {
    console.error('Error saving secondary profile:', error);
    res.status(500).json({ message: error.message || 'Failed to save secondary profile.' });
  }
};

// Helper to convert year strings to comparative numeric rank
const yearToRank = (yearStr) => {
  if (!yearStr) return 0;
  const s = String(yearStr).toLowerCase();
  if (s.includes('1') || s.includes('1st')) return 1;
  if (s.includes('2') || s.includes('2nd')) return 2;
  if (s.includes('3') || s.includes('3rd')) return 3;
  if (s.includes('4') || s.includes('4th')) return 4;
  return 0;
};

// Department name normalization helper
const isDepartmentMatch = (studentDept, eligibleDepts) => {
  if (!eligibleDepts || !Array.isArray(eligibleDepts) || eligibleDepts.length === 0) return true;
  if (!studentDept) return false;

  const deptMap = {
    'cse': ['computer science & engineering', 'computer science', 'cse'],
    'it': ['information technology', 'it'],
    'ece': ['electronics & communication', 'electronics & communication engineering', 'ece'],
    'eee': ['electrical & electronics', 'electrical & electronics engineering', 'eee'],
    'mech': ['mechanical engineering', 'mechanical', 'mech'],
    'ai & ds': ['artificial intelligence & data science', 'ai & ds', 'aids']
  };

  const stdLower = studentDept.toLowerCase().trim();

  return eligibleDepts.some(d => {
    const dLower = String(d).toLowerCase().trim();
    if (stdLower === dLower) return true;
    
    for (const [shortCode, aliases] of Object.entries(deptMap)) {
      if ((dLower === shortCode || aliases.includes(dLower)) && (aliases.includes(stdLower) || stdLower === shortCode)) {
        return true;
      }
    }
    return false;
  });
};

// Automatic Deterministic Eligibility Engine
const checkStudentEligibility = (student, drive) => {
  const hasIncompleteAcademic = 
    student.cgpa === null || student.cgpa === undefined ||
    !student.department ||
    !student.year ||
    student.arrear_history === null || student.arrear_history === undefined;

  const checks = {};
  let overallPassed = true;

  if (hasIncompleteAcademic) {
    return {
      eligible: false,
      isIncomplete: true,
      reason: 'Eligibility cannot be confirmed because your academic profile is incomplete or unverified by TPO.',
      checks: {
        academic_profile: {
          passed: false,
          message: 'Academic profile is incomplete. Please contact the TPO.'
        }
      }
    };
  }

  // 1. Minimum CGPA
  if (drive.minimum_cgpa !== null && drive.minimum_cgpa !== undefined && drive.minimum_cgpa !== '') {
    const minCgpa = Number(drive.minimum_cgpa);
    const studentCgpa = Number(student.cgpa);
    const cgpaPassed = studentCgpa >= minCgpa;
    if (!cgpaPassed) overallPassed = false;
    checks.cgpa = {
      passed: cgpaPassed,
      required: minCgpa.toFixed(2),
      actual: studentCgpa.toFixed(2),
      message: cgpaPassed 
        ? `CGPA ${studentCgpa.toFixed(2)} meets minimum required ${minCgpa.toFixed(2)}`
        : `CGPA ${studentCgpa.toFixed(2)} is below minimum required ${minCgpa.toFixed(2)}`
    };
  }

  // 2. Eligible Departments
  let deptsArr = [];
  if (drive.eligible_departments) {
    try {
      deptsArr = typeof drive.eligible_departments === 'string' ? JSON.parse(drive.eligible_departments) : drive.eligible_departments;
    } catch (e) {
      deptsArr = [drive.eligible_departments];
    }
  }

  if (Array.isArray(deptsArr) && deptsArr.length > 0) {
    const deptPassed = isDepartmentMatch(student.department, deptsArr);
    if (!deptPassed) overallPassed = false;
    checks.department = {
      passed: deptPassed,
      required: deptsArr.join(', '),
      actual: student.department,
      message: deptPassed
        ? `Department (${student.department}) is eligible`
        : `Department (${student.department}) is not among eligible departments (${deptsArr.join(', ')})`
    };
  }

  // 3. Maximum Arrears
  if (drive.maximum_arrears !== null && drive.maximum_arrears !== undefined && drive.maximum_arrears !== '') {
    const maxArrears = Number(drive.maximum_arrears);
    const studentArrears = parseInt(student.arrear_history || '0', 10);
    const arrearsPassed = !isNaN(studentArrears) && studentArrears <= maxArrears;
    if (!arrearsPassed) overallPassed = false;
    checks.arrears = {
      passed: arrearsPassed,
      required: maxArrears,
      actual: studentArrears,
      message: arrearsPassed
        ? `Arrears count (${studentArrears}) is within maximum allowed (${maxArrears})`
        : `Arrears count (${studentArrears}) exceeds maximum allowed (${maxArrears})`
    };
  }

  // 4. Minimum Year
  if (drive.minimum_year) {
    const reqYearRank = yearToRank(drive.minimum_year);
    const stdYearRank = yearToRank(student.year);
    const yearPassed = stdYearRank >= reqYearRank;
    if (!yearPassed) overallPassed = false;
    checks.year = {
      passed: yearPassed,
      required: drive.minimum_year,
      actual: student.year,
      message: yearPassed
        ? `Year (${student.year}) meets minimum required (${drive.minimum_year})`
        : `Year (${student.year}) is below minimum required (${drive.minimum_year})`
    };
  }

  // 5. Required Skills (Optional)
  if (drive.required_skills && drive.required_skills.trim() !== '') {
    const requiredSkillsArr = drive.required_skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (requiredSkillsArr.length > 0) {
      const stdSkills = (student.skills || '').toLowerCase();
      const missingSkills = requiredSkillsArr.filter(reqSkill => !stdSkills.includes(reqSkill));
      const skillsPassed = missingSkills.length === 0;
      if (!skillsPassed) overallPassed = false;
      checks.skills = {
        passed: skillsPassed,
        required: drive.required_skills,
        actual: student.skills || 'None specified',
        message: skillsPassed
          ? `Skills match required criteria (${drive.required_skills})`
          : `Missing required skills: ${missingSkills.join(', ')}`
      };
    }
  }

  // If drive has no structured eligibility criteria
  const isLegacy = Object.keys(checks).length === 0;
  if (isLegacy) {
    return {
      eligible: false,
      isLegacy: true,
      reason: 'Manual verification required for legacy placement drives.',
      checks: {
        legacy_notice: {
          passed: false,
          message: 'Manual verification required'
        }
      }
    };
  }

  return {
    eligible: overallPassed,
    isIncomplete: false,
    reason: overallPassed
      ? 'You meet all structured eligibility requirements.'
      : 'You do not meet the eligibility requirements for this drive.',
    checks
  };
};

// Get placement drives for students with automatic eligibility calculation
const getStudentDrives = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch TPO-managed student academic data & secondary profile skills
    const [[studentProfile]] = await pool.query(
      `SELECT sp.student_id, sp.department, sp.year, sp.cgpa, sp.arrear_history, ssp.skills
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN student_secondary_profiles ssp ON u.id = ssp.student_user_id
       WHERE u.id = ?`,
      [userId]
    );

    // Retrieve drives where registration_opening <= NOW()
    const [drives] = await pool.query(
      `SELECT j.*,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.student_id = ?) as is_registered,
              (SELECT a.status FROM applications a WHERE a.job_id = j.id AND a.student_id = ? LIMIT 1) as application_status
       FROM job_postings j
       WHERE j.registration_opening IS NOT NULL AND j.registration_opening <= NOW()
       ORDER BY j.registration_opening DESC`,
      [userId, userId]
    );

    const now = new Date();
    const enrichedDrives = drives.map((job) => {
      const opening = new Date(job.registration_opening);
      const closing = new Date(job.registration_closing);
      let dynamicStatus = 'Open';
      if (now < opening) {
        dynamicStatus = 'Upcoming';
      } else if (now > closing) {
        dynamicStatus = 'Closed';
      }

      let depts = [];
      if (job.eligible_departments) {
        try {
          depts = typeof job.eligible_departments === 'string' ? JSON.parse(job.eligible_departments) : job.eligible_departments;
        } catch (e) {
          depts = [job.eligible_departments];
        }
      }

      // Compute student eligibility matching
      const eligibility = studentProfile ? checkStudentEligibility(studentProfile, job) : {
        eligible: false,
        isIncomplete: true,
        reason: 'Student academic profile not found.',
        checks: {}
      };

      return {
        ...job,
        job_title: job.title,
        job_description: job.description,
        minimum_cgpa: job.minimum_cgpa !== null && job.minimum_cgpa !== undefined ? Number(job.minimum_cgpa) : null,
        eligible_departments: Array.isArray(depts) ? depts : [],
        maximum_arrears: job.maximum_arrears !== null && job.maximum_arrears !== undefined ? Number(job.maximum_arrears) : null,
        minimum_year: job.minimum_year || null,
        required_skills: job.required_skills || null,
        dynamic_status: dynamicStatus,
        is_registered: job.is_registered > 0,
        eligibility
      };
    });

    res.status(200).json(enrichedDrives);
  } catch (error) {
    console.error('Error fetching student placement drives:', error);
    res.status(500).json({ message: 'Failed to fetch placement drives.' });
  }
};

// Student registration for a placement drive with server-side eligibility & timeline enforcement
const registerForDrive = async (req, res) => {
  try {
    const userId = req.user.id; // Strictly from authenticated JWT token
    const { id } = req.params;

    // Fetch drive details
    const [drives] = await pool.query(
      `SELECT * FROM job_postings WHERE id = ?`,
      [id]
    );

    if (drives.length === 0) {
      return res.status(404).json({ message: 'Placement drive not found.' });
    }

    const drive = drives[0];
    const now = new Date();
    const openingDate = new Date(drive.registration_opening);
    const closingDate = new Date(drive.registration_closing);

    // Timeline Enforcement
    if (now < openingDate) {
      return res.status(400).json({ message: 'Registration for this placement drive has not opened yet.' });
    }

    if (now > closingDate) {
      return res.status(400).json({ message: 'Registration for this placement drive is closed.' });
    }

    // Fetch TPO-managed student academic profile
    const [[studentProfile]] = await pool.query(
      `SELECT sp.student_id, sp.department, sp.year, sp.cgpa, sp.arrear_history, ssp.skills
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN student_secondary_profiles ssp ON u.id = ssp.student_user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!studentProfile) {
      return res.status(400).json({ message: 'Student academic profile not found. Please contact TPO.' });
    }

    // Backend Automatic Eligibility Security Verification
    const evaluation = checkStudentEligibility(studentProfile, drive);
    if (!evaluation.eligible) {
      return res.status(400).json({
        message: evaluation.reason || 'Registration rejected: You do not meet the eligibility criteria for this placement drive.',
        checks: evaluation.checks
      });
    }

    // Check for duplicate registration
    const [existingApp] = await pool.query(
      `SELECT id FROM applications WHERE student_id = ? AND job_id = ?`,
      [userId, id]
    );

    if (existingApp.length > 0) {
      return res.status(400).json({ message: 'You have already registered for this placement drive.' });
    }

    // Insert registration
    await pool.query(
      `INSERT INTO applications (student_id, job_id, status, created_at) VALUES (?, ?, 'Applied', NOW())`,
      [userId, id]
    );

    // Notify HR of the new application if drive has an HR owner
    if (drive.hr_id) {
      try {
        const [[studentUser]] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
        const studentName = studentUser?.name || 'A candidate';
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, FALSE, NOW())`,
          [
            drive.hr_id,
            'New Application Received',
            `${studentName} has submitted an application for "${drive.title || 'Placement Drive'}".`
          ]
        );
      } catch (notifErr) {
        console.error('Error creating HR notification on application:', notifErr);
      }
    }

    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Error registering for placement drive:', error);
    res.status(500).json({ message: 'Failed to register for placement drive.' });
  }
};

// Get Available Interview Slots and Student's Booking
const getAvailableInterviewSlots = async (req, res) => {
  try {
    const studentId = req.user.id;
    const driveId = req.params.driveId;

    // Check if student has a shortlisted application for this drive
    const [appRows] = await pool.query(
      `SELECT id, status FROM applications 
       WHERE student_id = ? AND job_id = ?`,
      [studentId, driveId]
    );

    if (appRows.length === 0 || !['Shortlisted', 'Interview'].includes(appRows[0].status)) {
      return res.status(403).json({ message: 'You must be shortlisted to view interview slots.' });
    }

    const applicationId = appRows[0].id;

    // Fetch student's booking if any
    const [bookingRows] = await pool.query(
      `SELECT s.id, s.job_id, DATE_FORMAT(s.interview_date, '%Y-%m-%d') as interview_date, s.start_time, s.end_time, s.duration_minutes, s.status, s.created_at 
       FROM interview_slots s
       JOIN interview_bookings b ON s.id = b.slot_id
       WHERE b.application_id = ?`,
      [applicationId]
    );

    const studentBooking = bookingRows.length > 0 ? bookingRows[0] : null;

    // Fetch available slots
    const [availableSlots] = await pool.query(
      `SELECT id, job_id, DATE_FORMAT(interview_date, '%Y-%m-%d') as interview_date, start_time, end_time, duration_minutes, status, created_at 
       FROM interview_slots 
       WHERE job_id = ? AND status = 'Available'
       ORDER BY interview_date ASC, start_time ASC`,
      [driveId]
    );

    res.status(200).json({
      availableSlots,
      studentBooking
    });

  } catch (error) {
    console.error('Error fetching interview slots:', error);
    res.status(500).json({ message: 'Failed to fetch interview slots.' });
  }
};

// Book an Interview Slot
const bookInterviewSlot = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const studentId = req.user.id;
    const { driveId, slotId } = req.params;

    // 1. Verify student application and status
    const [appRows] = await connection.query(
      `SELECT id, status FROM applications 
       WHERE student_id = ? AND job_id = ?`,
      [studentId, driveId]
    );

    if (appRows.length === 0 || !['Shortlisted', 'Interview'].includes(appRows[0].status)) {
      await connection.rollback();
      return res.status(403).json({ message: 'You must be shortlisted to book an interview.' });
    }

    const applicationId = appRows[0].id;

    // 2. Verify slot exists, belongs to the drive, and is Available
    const [slotRows] = await connection.query(
      `SELECT id, status FROM interview_slots WHERE id = ? AND job_id = ? FOR UPDATE`,
      [slotId, driveId]
    );

    if (slotRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Interview slot not found.' });
    }

    if (slotRows[0].status !== 'Available') {
      await connection.rollback();
      return res.status(409).json({ message: 'This interview slot has already been booked by another student.' });
    }

    // 3. Attempt Booking Insertion
    try {
      await connection.query(
        `INSERT INTO interview_bookings (slot_id, student_id, application_id)
         VALUES (?, ?, ?)`,
        [slotId, studentId, applicationId]
      );
    } catch (err) {
      // Catch UNIQUE constraint violation (either slot is booked or student already booked a slot)
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('unique_student_app')) {
          return res.status(409).json({ message: 'You have already booked an interview slot for this placement drive.' });
        }
        return res.status(409).json({ message: 'This interview slot has already been booked by another student.' });
      }
      throw err;
    }

    // 4. Update Slot Status
    await connection.query(
      `UPDATE interview_slots SET status = 'Booked' WHERE id = ?`,
      [slotId]
    );

    await connection.commit();
    res.status(200).json({ message: 'Interview slot booked successfully.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error booking interview slot:', error);
    res.status(500).json({ message: 'Failed to book interview slot.' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getStudentDashboard,
  getStudentProfile,
  getSecondaryProfile,
  saveSecondaryProfile,
  getStudentDrives,
  registerForDrive,
  checkStudentEligibility,
  getAvailableInterviewSlots,
  bookInterviewSlot
};

