const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initializeDatabase } = require('./db');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hrRoutes = require('./routes/hrRoutes');
const tpoRoutes = require('./routes/tpoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/tpo', tpoRoutes);

// Root route
app.get('/', (req, res) => {
  res.send({ message: 'CRDM Backend API is running successfully' });
});

// Start Server & Connect Database
app.listen(PORT, async () => {
  console.log(`CRDM Backend running on port ${PORT}`);
  await initializeDatabase();
});
