require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_file_sharing';
    await mongoose.connect(mongoUri);
    console.log('[Seed Admin] Connected to MongoDB database.');

    const adminEmail = 'admin@fileshare.local';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Seed Admin] Admin account already exists: ${adminEmail}`);
      process.exit(0);
    }

    const admin = new User({
      name: 'System Administrator',
      email: adminEmail,
      password: 'Admin@123456',
      role: 'Admin',
      isEmailVerified: true
    });

    await admin.save();

    console.log(`
=====================================================
  ✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!
  👤 Name: System Administrator
  📧 Email: admin@fileshare.local
  🔑 Password: Admin@123456
  🛡️ Role: Admin
=====================================================
    `);

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Admin Error] ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
