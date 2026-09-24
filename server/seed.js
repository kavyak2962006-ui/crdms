const bcrypt = require('bcryptjs');
const { pool, initializeDatabase } = require('./db');

const seedDatabase = async () => {
  try {
    await initializeDatabase();
    console.log('Seeding initial development users...');

    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('Password@123', salt);

    const testUsers = [
      {
        name: 'John Student',
        email: 'student@kct.ac.in',
        password: commonPasswordHash,
        role: 'student',
        status: 'active',
        studentProfile: {
          student_id: '717821CS101',
          department: 'Computer Science & Engineering',
          year: '3rd Year'
        }
      },
      {
        name: 'Sarah Recruiter',
        email: 'hr@example.com',
        password: commonPasswordHash,
        role: 'hr',
        status: 'pending',
        hrProfile: {
          company_name: 'TechCorp Solutions',
          designation: 'Senior Talent Acquisition'
        }
      },
      {
        name: 'Officer TPO',
        email: 'tpo@kct.ac.in',
        password: commonPasswordHash,
        role: 'tpo',
        status: 'active'
      },
      {
        name: 'System Administrator',
        email: 'admin@kct.ac.in',
        password: commonPasswordHash,
        role: 'admin',
        status: 'active'
      }
    ];

    for (const u of testUsers) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length === 0) {
        const [result] = await pool.query(
          'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
          [u.name, u.email, u.password, u.role, u.status]
        );
        const userId = result.insertId;

        if (u.role === 'student' && u.studentProfile) {
          await pool.query(
            'INSERT INTO student_profiles (user_id, student_id, department, year, cgpa, arrear_history) VALUES (?, ?, ?, ?, ?, ?)',
            [
              userId,
              u.studentProfile.student_id,
              u.studentProfile.department,
              u.studentProfile.year,
              u.studentProfile.cgpa || 8.50,
              u.studentProfile.arrear_history || '0'
            ]
          );
        } else if (u.role === 'hr' && u.hrProfile) {
          await pool.query(
            'INSERT INTO hr_profiles (user_id, company_name, designation) VALUES (?, ?, ?)',
            [userId, u.hrProfile.company_name, u.hrProfile.designation]
          );
        }

        console.log(`+ Created test account: ${u.email} (${u.role}, status: ${u.status})`);
      } else {
        console.log(`= User already exists: ${u.email}`);
      }
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
