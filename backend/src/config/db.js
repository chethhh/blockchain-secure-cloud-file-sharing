const mongoose = require('mongoose');

// Disable Mongoose command buffering so disconnected queries fail fast to memory store
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_file_sharing';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // 3s timeout
      bufferCommands: false
    });
    console.log(`[MongoDB] Database connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] Database connection issue: ${error.message}`);
    console.warn('[MongoDB Note] Express API server using instant fail-safe memory store fallback.');
  }
};

module.exports = connectDB;
