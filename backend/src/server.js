require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, () => {
  console.log(`
================================================================
  🚀 SECURE BLOCKCHAIN CLOUD FILE SHARING BACKEND SERVER RUNNING
  📡 URL: http://localhost:${PORT}
  🌍 ENVIRONMENT: ${process.env.NODE_ENV || 'development'}
  🔐 MFA OTP DEV LOG: ${process.env.DEV_LOG_OTP || 'true'}
================================================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] Error: ${err.message}`);
});
