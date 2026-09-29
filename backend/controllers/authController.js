const bcrypt = require('bcrypt');
const createError = require('http-errors');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const appEventEmitter = require('../events/taskEvents');

/**
 * AUTH CONTROLLER
 * Handles User Registration, Password Hashing, Login, Token Generation & Refresh
 * (Uses http-errors package and express-async-errors middleware)
 */

const isProduction = process.env.NODE_ENV === 'production';

// Cookie Options for Refresh Token (HttpOnly for XSS security)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-domain requests between Render frontend & backend
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Input Validation
  if (!name || !email || !password) {
    throw createError(400, 'Name, email, and password are required.');
  }

  if (password.length < 6) {
    throw createError(400, 'Password must be at least 6 characters long.');
  }

  // 2. Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError(400, 'User with this email already exists.');
  }

  // 3. Password Security: Hash password using bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 4. Save User to MySQL
  // SECURITY PRINCIPLE: Public registration MUST always default to 'USER'.
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'USER'
  });

  // 5. Emit Event for MongoDB Audit Log
  appEventEmitter.emit('user.registered', {
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name
  });

  // 6. Generate JWT Tokens
  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);

  // Send Refresh Token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  return res.status(201).json({
    message: 'User registered successfully.',
    accessToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError(400, 'Email and password are required.');
  }

  // 1. Find user by email (Uses MySQL index on email)
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw createError(401, 'Invalid email or password.');
  }

  // 2. Compare plain text password with stored bcrypt hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError(401, 'Invalid email or password.');
  }

  // 3. Emit Event for MongoDB Audit Log
  appEventEmitter.emit('user.login', {
    userId: user.id,
    ip: req.ip
  });

  // 4. Generate JWT Tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Send Refresh Token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  return res.json({
    message: 'Login successful.',
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// REFRESH TOKEN
exports.refresh = async (req, res) => {
  // Extract refresh token from HttpOnly cookie (fallback to req.body.refreshToken)
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw createError(400, 'Refresh token is required.');
  }

  try {
    // 1. Verify refresh token signature & expiration
    const decoded = verifyRefreshToken(refreshToken);

    // 2. Lookup user in MySQL
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw createError(401, 'User associated with token no longer exists.');
    }

    // 3. Generate new Access Token
    const newAccessToken = generateAccessToken(user);

    return res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    if (createError.isHttpError && createError.isHttpError(error)) throw error;
    throw createError(401, 'Invalid or expired refresh token.');
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.json({ message: 'Logout successful.' });
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.userId, {
    attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
  });

  if (!user) {
    throw createError(404, 'User not found.');
  }

  return res.json({ user });
};

// SEED / RESET DEMO ADMIN ACCOUNT
exports.seedAdmin = async (req, res) => {
  try {
    const adminEmail = 'admin@taskshield.com';
    const adminPassword = 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let user = await User.findOne({ where: { email: adminEmail } });
    if (user) {
      user.name = 'Admin User';
      user.password = hashedPassword;
      user.role = 'ADMIN';
      await user.save();
    } else {
      user = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      });
    }

    return res.json({
      status: 'SUCCESS',
      message: 'Admin account has been created/updated successfully!',
      credentials: {
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    console.error('Error seeding admin account:', error);
    return res.status(500).json({ error: error.message });
  }
};

