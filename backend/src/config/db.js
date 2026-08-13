const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_file_sharing';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5s timeout
    });
    console.log(`[MongoDB] Database connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] Database connection issue: ${error.message}`);
    console.warn('[MongoDB Note] Express API server will stay running while retrying database connection.');
  }
};

module.exports = connectDB;
