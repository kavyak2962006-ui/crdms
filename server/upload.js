const multer = require('multer');
const path = require('path');

// Store uploads in the existing server/uploads folder (same as HR uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + file.originalname;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

module.exports = { upload };
