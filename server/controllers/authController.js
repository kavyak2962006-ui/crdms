const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// Login controller
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required.' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // After password verification, ensure selected role matches DB role
    if (role && role !== user.role) {
      return res.status(401).json({ message: 'Invalid credentials for the selected role.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your HR account is pending administrator approval.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact the administrator.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET || 'crdm_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Register Student controller
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, student_id, department, year } = req.body;

    if (!name || !email || !password || !student_id || !department || !year) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const collegeDomain = process.env.COLLEGE_EMAIL_DOMAIN || 'kct.ac.in';
    const emailLower = email.toLowerCase().trim();

    if (!emailLower.endsWith(`@${collegeDomain}`)) {
      return res.status(400).json({ message: 'Please use your official college email address.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [emailLower]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, emailLower, hashedPassword, 'student', 'active']
    );

    const userId = result.insertId;

    await pool.query(
      'INSERT INTO student_profiles (user_id, student_id, department, year) VALUES (?, ?, ?, ?)',
      [userId, student_id, department, year]
    );

    res.status(201).json({ message: 'Student registration successful. You can now log in.' });
  } catch (error) {
    console.error('Register Student Error:', error);
    res.status(500).json({ message: 'Server error during student registration.' });
  }
};

// Register HR controller
const registerHR = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, company_name, designation } = req.body;

    if (!name || !email || !password || !company_name) {
      return res.status(400).json({ message: 'Name, email, password, and company name are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const emailLower = email.toLowerCase().trim();

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [emailLower]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, emailLower, hashedPassword, 'hr', 'pending']
    );

    const userId = result.insertId;

    await pool.query(
      'INSERT INTO hr_profiles (user_id, company_name, designation) VALUES (?, ?, ?)',
      [userId, company_name, designation || 'Recruiter']
    );

    res.status(201).json({
      message: 'HR registration submitted successfully. Your account is pending administrator approval.'
    });
  } catch (error) {
    console.error('Register HR Error:', error);
    res.status(500).json({ message: 'Server error during HR registration.' });
  }
};

// Forgot Password controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const emailLower = email.toLowerCase().trim();
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [emailLower]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    const userId = users[0].id;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    await pool.query(
      'INSERT INTO password_otps (user_id, otp, expires_at, is_used) VALUES (?, ?, ?, ?)',
      [userId, otp, expiresAt, false]
    );

    console.log('\n==================================================');
    console.log(`[DEVELOPMENT MODE OTP LOG]`);
    console.log(`Email: ${emailLower}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Expires At: ${expiresAt.toLocaleString()}`);
    console.log('==================================================\n');

    res.status(200).json({
      message: 'OTP has been generated. (For development, check backend terminal logs for the OTP code)'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error during password recovery request.' });
  }
};

// Reset Password controller
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const emailLower = email.toLowerCase().trim();
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [emailLower]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const userId = users[0].id;

    const [otps] = await pool.query(
      'SELECT * FROM password_otps WHERE user_id = ? AND otp = ? AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
      [userId, otp]
    );

    if (otps.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP or OTP has already been used.' });
    }

    const otpRecord = otps[0];
    const now = new Date();

    if (new Date(otpRecord.expires_at) < now) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    await pool.query('UPDATE password_otps SET is_used = TRUE WHERE id = ?', [otpRecord.id]);

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};

// Get current user details
const getMe = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = users[0];
    let profile = null;

    if (user.role === 'student') {
      const [p] = await pool.query('SELECT student_id, department, year FROM student_profiles WHERE user_id = ?', [user.id]);
      if (p.length > 0) profile = p[0];
    } else if (user.role === 'hr') {
      const [p] = await pool.query('SELECT company_name, designation FROM hr_profiles WHERE user_id = ?', [user.id]);
      if (p.length > 0) profile = p[0];
    }

    res.status(200).json({ user: { ...user, profile } });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
};

module.exports = {
  login,
  registerStudent,
  registerHR,
  forgotPassword,
  resetPassword,
  getMe
};
