const authMiddleware = require('./auth');

const isAdmin = (req, res, next) => {
  // First run the standard auth check
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  });
};

module.exports = isAdmin;
