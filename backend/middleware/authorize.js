/**
 * AUTHORIZATION MIDDLEWARE (Role-Based Access Control - RBAC)
 * 
 * Authentication answers: "Who are you?"
 * Authorization answers: "What are you allowed to do?"
 * 
 * Usage example: authorize('ADMIN')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. You do not have permission to access this resource.' });
    }
    next();
  };
};

module.exports = authorize;
