const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'crdm_super_secret_jwt_key_2026', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired authentication token.' });
    }
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access Denied: You do not have permission to access this resource.' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
