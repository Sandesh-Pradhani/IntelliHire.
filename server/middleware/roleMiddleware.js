/**
 * Role-based access control middleware.
 *
 * Problem: Routes need to restrict access by user role.
 * Why this approach: Composable middleware that checks decoded JWT role against allowed roles.
 * Alternatives considered: Single middleware that wraps auth + role (reduces flexibility).
 *
 * Usage:
 *   router.get('/candidates-only', authMiddleware, requireRole('candidate'), handler)
 *   router.get('/recruiter-only', authMiddleware, requireRole('recruiter'), handler)
 */

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role

      if (!userRole) {
        return res.status(403).json({
          message: 'Access denied: no role assigned',
        })
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: `Access denied: requires ${allowedRoles.join(' or ')} role`,
        })
      }

      next()
    } catch (error) {
      res.status(403).json({
        message: 'Access denied: role verification failed',
      })
    }
  }
}

module.exports = { requireRole }