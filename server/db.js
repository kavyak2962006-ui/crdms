const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crdm_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create initial pool
let pool = mysql.createPool(dbConfig);

// Helper function to initialize database and tables if missing
const initializeDatabase = async () => {
  try {
    // First attempt to connect without database name to ensure DB exists
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await rootConnection.end();

    // Test connection with pool
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');
    connection.release();

    // Auto-create required tables if not existing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'hr', 'tpo', 'admin') NOT NULL,
        status ENUM('pending', 'active', 'blocked') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    // Ensure settings columns exist in users table
    try {
      const [uCols] = await pool.query(`SHOW COLUMNS FROM users`);
      const uColNames = uCols.map(c => c.Field);
      
      const colsToAdd = [
        { name: 'phone', type: 'VARCHAR(20) DEFAULT NULL' },
        { name: 'profile_picture', type: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'new_drive_alerts', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'application_status_alerts', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'interview_alerts', type: 'BOOLEAN DEFAULT TRUE' }
      ];

      for (const col of colsToAdd) {
        if (!uColNames.includes(col.name)) {
          await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
          console.log(`Added ${col.name} column to users`);
        }
      }
    } catch (migErr) {
      console.error('Error checking/migrating users columns:', migErr.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        student_id VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        year VARCHAR(20) NOT NULL,
        cgpa DECIMAL(4,2) DEFAULT NULL,
        arrear_history VARCHAR(100) DEFAULT '0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    // Ensure cgpa and arrear_history columns exist in student_profiles if table was already created
    try {
      const [spCols] = await pool.query(`SHOW COLUMNS FROM student_profiles`);
      const spColNames = spCols.map(c => c.Field);
      if (!spColNames.includes('cgpa')) {
        await pool.query(`ALTER TABLE student_profiles ADD COLUMN cgpa DECIMAL(4,2) DEFAULT NULL;`);
        console.log('Added cgpa column to student_profiles');
      }
      if (!spColNames.includes('arrear_history')) {
        await pool.query(`ALTER TABLE student_profiles ADD COLUMN arrear_history VARCHAR(100) DEFAULT '0';`);
        console.log('Added arrear_history column to student_profiles');
      }
    } catch (migErr) {
      console.error('Error checking/migrating student_profiles columns:', migErr.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_secondary_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_user_id INT NOT NULL UNIQUE,
        skills TEXT,
        projects TEXT,
        resume_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hr_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        company_name VARCHAR(255) NOT NULL,
        designation VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    // Company profile table (one-to-one with HR user)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hr_user_id INT NOT NULL UNIQUE,
        company_name VARCHAR(255) NOT NULL,
        logo_path VARCHAR(255),
        description TEXT,
        industry VARCHAR(100),
        website VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address VARCHAR(255),
        city VARCHAR(100),
        state_name VARCHAR(100),
        country VARCHAR(100),
        company_size VARCHAR(50),
        founded_year YEAR,
        about TEXT,
        benefits TEXT,
        culture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        FOREIGN KEY (hr_user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hr_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('open', 'closed') DEFAULT 'open',
        ctc VARCHAR(100) DEFAULT NULL,
        eligibility_criteria TEXT DEFAULT NULL,
        registration_opening DATETIME DEFAULT NULL,
        registration_closing DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        FOREIGN KEY (hr_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    // Ensure placement drive columns exist in job_postings if table was already created
    try {
      const [jpCols] = await pool.query(`SHOW COLUMNS FROM job_postings`);
      const jpColNames = jpCols.map(c => c.Field);
      if (!jpColNames.includes('ctc')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN ctc VARCHAR(100) DEFAULT NULL;`);
        console.log('Added ctc column to job_postings');
      }
      if (!jpColNames.includes('eligibility_criteria')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN eligibility_criteria TEXT DEFAULT NULL;`);
        console.log('Added eligibility_criteria column to job_postings');
      }
      if (!jpColNames.includes('registration_opening')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN registration_opening DATETIME DEFAULT NULL;`);
        console.log('Added registration_opening column to job_postings');
      }
      if (!jpColNames.includes('registration_closing')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN registration_closing DATETIME DEFAULT NULL;`);
        console.log('Added registration_closing column to job_postings');
      }
      if (!jpColNames.includes('updated_at')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN updated_at DATETIME DEFAULT NULL;`);
        console.log('Added updated_at column to job_postings');
      }
      if (!jpColNames.includes('minimum_cgpa')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN minimum_cgpa DECIMAL(4,2) DEFAULT NULL;`);
        console.log('Added minimum_cgpa column to job_postings');
      }
      if (!jpColNames.includes('eligible_departments')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN eligible_departments TEXT DEFAULT NULL;`);
        console.log('Added eligible_departments column to job_postings');
      }
      if (!jpColNames.includes('maximum_arrears')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN maximum_arrears INT DEFAULT NULL;`);
        console.log('Added maximum_arrears column to job_postings');
      }
      if (!jpColNames.includes('minimum_year')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN minimum_year VARCHAR(50) DEFAULT NULL;`);
        console.log('Added minimum_year column to job_postings');
      }
      if (!jpColNames.includes('required_skills')) {
        await pool.query(`ALTER TABLE job_postings ADD COLUMN required_skills TEXT DEFAULT NULL;`);
        console.log('Added required_skills column to job_postings');
      }
    } catch (migErr) {
      console.error('Error checking/migrating job_postings columns:', migErr.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        job_id INT NOT NULL,
        status ENUM('Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected') DEFAULT 'Applied',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS interview_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        interview_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        duration_minutes INT NOT NULL,
        status ENUM('Available', 'Booked', 'Completed', 'Cancelled') DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        UNIQUE KEY unique_slot (job_id, interview_date, start_time, end_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS interview_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_id INT NOT NULL,
        student_id INT NOT NULL,
        application_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (slot_id) REFERENCES interview_slots(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
        UNIQUE KEY unique_booking_slot (slot_id),
        UNIQUE KEY unique_student_app (application_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

  } catch (error) {
    console.error('MySQL connection error:', error.message);
  }
};

module.exports = {
  pool,
  initializeDatabase
};
