const { pool } = require('../db');
const path = require('path');

const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[user]] = await pool.query(
      `SELECT name, email, phone, profile_picture, new_drive_alerts, application_status_alerts, interview_alerts 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, phone } = req.body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (email) {
      const [[existing]] = await pool.query(`SELECT id FROM users WHERE email = ? AND id != ?`, [email, userId]);
      if (existing) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
    }

    let profilePicturePath = null;
    if (req.file) {
      profilePicturePath = `/uploads/${req.file.filename}`;
    }

    let updateQuery = `UPDATE users SET updated_at = NOW()`;
    const updateParams = [];

    if (email) {
      updateQuery += `, email = ?`;
      updateParams.push(email);
    }
    if (phone !== undefined) {
      updateQuery += `, phone = ?`;
      updateParams.push(phone);
    }
    if (profilePicturePath) {
      updateQuery += `, profile_picture = ?`;
      updateParams.push(profilePicturePath);
    }

    updateQuery += ` WHERE id = ?`;
    updateParams.push(userId);

    await pool.query(updateQuery, updateParams);

    const [[updatedUser]] = await pool.query(
      `SELECT name, email, phone, profile_picture, new_drive_alerts, application_status_alerts, interview_alerts 
       FROM users WHERE id = ?`,
      [userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { new_drive_alerts, application_status_alerts, interview_alerts } = req.body;

    await pool.query(
      `UPDATE users 
       SET new_drive_alerts = ?, application_status_alerts = ?, interview_alerts = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        new_drive_alerts ? 1 : 0,
        application_status_alerts ? 1 : 0,
        interview_alerts ? 1 : 0,
        userId
      ]
    );

    res.status(200).json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

module.exports = {
  getSettings,
  updateProfile,
  updateNotifications
};
