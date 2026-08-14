const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * JWT TOKEN GENERATION & VERIFICATION UTILITIES
 * 
 * Access Tokens: Short-lived (15 minutes by default). Carries payload required for authorization.
 * Refresh Tokens: Long-lived (7 days by default). Used to issue new access tokens when access token expires.
 * 
 * WHY SMALL PAYLOAD?
 * JWTs are transmitted with every HTTP request in headers. Storing sensitive or large data increases payload size
 * and risks exposing passwords or PII if intercepted.
 */

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_default_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_default_456';

const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generates short-lived Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
};

/**
 * Generates long-lived Refresh Token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
};

/**
 * Verifies Access Token signature and expiration
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

/**
 * Verifies Refresh Token signature and expiration
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
