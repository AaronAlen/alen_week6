const bcrypt = require('bcrypt');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const appEventEmitter = require('../events/taskEvents');

/**
 * AUTH CONTROLLER
 * Handles User Registration, Password Hashing, Login, Token Generation & Refresh
 */

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Input Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // 3. Password Security: Hash password using bcrypt
    // Salt rounds = 10 (good balance between security and performance)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Save User to MySQL
    // SECURITY PRINCIPLE: Public registration MUST always default to 'USER'.
    // Users should never be allowed to grant themselves 'ADMIN' privileges during signup.
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'USER' // Always force USER role for public signups
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

    return res.status(201).json({
      message: 'User registered successfully.',
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 1. Find user by email (Uses MySQL index on email)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 2. Compare plain text password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 3. Emit Event for MongoDB Audit Log
    appEventEmitter.emit('user.login', {
      userId: user.id,
      ip: req.ip
    });

    // 4. Generate JWT Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

// REFRESH TOKEN
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    // 1. Verify refresh token signature & expiration
    const decoded = verifyRefreshToken(refreshToken);

    // 2. Lookup user in MySQL
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User associated with token no longer exists.' });
    }

    // 3. Generate new Access Token
    const newAccessToken = generateAccessToken(user);

    return res.json({
      accessToken: newAccessToken
    });

  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  return res.json({ message: 'Logout successful. Please clear stored tokens on the client.' });
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'] // Query optimization: exclude password
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving profile.' });
  }
};
