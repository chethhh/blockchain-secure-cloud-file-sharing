/**
 * Middleware for Role-Based Access Control (RBAC)
 * @param  {...string} roles Allowed roles ('Admin', 'Editor', 'Viewer')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to role(s): [${roles.join(', ')}]. Your role is '${req.user.role}'`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
