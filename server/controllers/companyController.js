const { pool } = require('../db');
const path = require('path');
const fs = require('fs');

// GET company profile for authenticated HR
const getCompanyProfile = async (req, res) => {
  try {
    const hrId = req.user.id;
    const [rows] = await pool.execute('SELECT * FROM company_profiles WHERE hr_user_id = ?', [hrId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Company profile not found.' });
    }
    const profile = rows[0];
    // Map DB columns to API fields expected by frontend
    if (profile.email) {
      profile.company_email = profile.email;
      delete profile.email;
    }
    // DB already uses logo_path, no extra mapping required
    res.json(profile);
  } catch (err) {
    console.error('Error fetching company profile:', err);
    res.status(500).json({ message: 'Server error while fetching company profile.' });
  }
};

// CREATE company profile for authenticated HR
const createCompanyProfile = async (req, res) => {
  try {
    const hrId = req.user.id;
    // check if already exists
    const [exist] = await pool.execute('SELECT id FROM company_profiles WHERE hr_user_id = ?', [hrId]);
    if (exist.length > 0) {
      return res.status(400).json({ message: 'Company profile already exists. Use update instead.' });
    }
    const {
      company_name,
      industry,
      website,
      company_email,
      phone,
      address,
      city,
      state_name,
      country,
      company_size,
      founded_year,
      description,
      culture,
      benefits
    } = req.body;
    let logoPath = null;
    if (req.file) {
      logoPath = path.join('uploads', req.file.filename);
    }
    await pool.execute(
      `INSERT INTO company_profiles (hr_user_id, company_name, industry, website, email, phone, address, city, state_name, country, company_size, founded_year, description, culture, benefits, logo_path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        hrId,
        company_name,
        industry,
        website,
        company_email,
        phone,
        address,
        city,
        state_name,
        country,
        company_size,
        founded_year,
        description,
        culture,
        benefits,
        logoPath
      ]
    );
    res.status(201).json({ message: 'Company profile created successfully.' });
  } catch (err) {
    console.error('Error creating company profile:', err);
    res.status(500).json({ message: 'Server error while creating company profile.' });
  }
};

// UPDATE company profile for authenticated HR
const updateCompanyProfile = async (req, res) => {
  try {
    const hrId = req.user.id;
    const [rows] = await pool.execute('SELECT * FROM company_profiles WHERE hr_user_id = ?', [hrId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Company profile not found.' });
    }
    const existing = rows[0];
    const {
      company_name,
      industry,
      website,
      company_email,
      phone,
      address,
      city,
      state_name,
      country,
      company_size,
      founded_year,
      description,
      culture,
      benefits
    } = req.body;
    let logoPath = existing.logo_path;
    if (req.file) {
      // delete old file if exists
      if (logoPath && fs.existsSync(path.join(__dirname, '..', logoPath))) {
        fs.unlinkSync(path.join(__dirname, '..', logoPath));
      }
      logoPath = path.join('uploads', req.file.filename);
    }
    await pool.execute(
      `UPDATE company_profiles SET company_name = ?, industry = ?, website = ?, email = ?, phone = ?, address = ?, city = ?, state_name = ?, country = ?, company_size = ?, founded_year = ?, description = ?, culture = ?, benefits = ?, logo_path = ? WHERE hr_user_id = ?`,
      [
        company_name,
        industry,
        website,
        company_email,
        phone,
        address,
        city,
        state_name,
        country,
        company_size,
        founded_year,
        description,
        culture,
        benefits,
        logoPath,
        hrId
      ]
    );
    res.json({ message: 'Company profile updated successfully.' });
  } catch (err) {
    console.error('Error updating company profile:', err);
    res.status(500).json({ message: 'Server error while updating company profile.' });
  }
};

module.exports = { getCompanyProfile, createCompanyProfile, updateCompanyProfile };
