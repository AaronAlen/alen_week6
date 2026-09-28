const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. API Security: Helmet sets HTTP headers (X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet());

// 2. API Security: CORS configuration
const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, health checks)
    if (!origin) return callback(null, true);
    // Allow matching clientUrl, local dev, or vercel preview/prod apps
    if (
      !clientUrl ||
      clientUrl === '*' ||
      origin === clientUrl ||
      origin === 'http://localhost:5173' ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS request blocked by security policy'));
  },
  credentials: true
}));

// 3. Cookie Parsing Middleware
app.use(cookieParser());

// 4. API Security: Rate Limiting (Prevents Brute-Force login & DoS attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', limiter);

// Body Parsing Middleware
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found.' });
});

// Global Error Handler (Centralized error processing)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected server error occurred.';

  // Log internal server errors (500) for debugging
  if (statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({ message });
});

module.exports = app;
