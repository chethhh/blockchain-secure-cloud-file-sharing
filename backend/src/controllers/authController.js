const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const walletRoutes = require('./routes/walletRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();

/* =========================================================
   CORS CONFIGURATION
   ========================================================= */

const allowedOrigins = [
  'https://blockchain-secure-cloud-file-sharing.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, curl, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

/* =========================================================
   SECURITY HEADERS
   ========================================================= */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
  })
);

/* =========================================================
   RATE LIMITING
   ========================================================= */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  }
});

app.use('/api/', limiter);

/* =========================================================
   BODY PARSERS
   ========================================================= */

app.use(
  express.json({
    limit: '15mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '15mb'
  })
);

/* =========================================================
   ROOT ROUTE
   ========================================================= */

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    message: 'Welcome to Blockchain Secure Cloud File Sharing API Server 🚀',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString()
  });
});

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    service: 'Blockchain Secure Cloud File Sharing API',
    timestamp: new Date().toISOString()
  });
});

/* =========================================================
   TEMPORARY API TEST ROUTE
   ========================================================= */

app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is working correctly',
    authRegisterRoute: '/api/auth/register',
    timestamp: new Date().toISOString()
  });
});

/* =========================================================
   API ROUTES
   ========================================================= */

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/activity', activityRoutes);

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`
  });
});

/* =========================================================
   CENTRAL ERROR HANDLER
   ========================================================= */

app.use(errorHandler);

module.exports = app;