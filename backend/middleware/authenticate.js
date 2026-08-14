const { verifyAccessToken } = require('../utils/tokens');

/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Conceptual Flow:
 * Request -> Read Authorization Header -> Bearer Token? -> Verify Token -> Attach req.user -> next()
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header exists and follows "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token signature and check expiration
    const decoded = verifyAccessToken(token);

    // 3. Attach user payload to request object for downstream controllers
    req.user = decoded; // Contains { userId, role, iat, exp }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired access token.' });
  }
};

module.exports = authenticate;
