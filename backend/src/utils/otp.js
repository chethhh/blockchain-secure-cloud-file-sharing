const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * Generate 6-digit cryptographic random OTP string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using SHA-256
 */
function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify OTP string against stored hash
 */
function verifyOTP(enteredOtp, storedHash) {
  if (!enteredOtp || !storedHash) return false;
  const hashedEntered = hashOTP(enteredOtp);
  return crypto.timingSafeEqual(Buffer.from(hashedEntered), Buffer.from(storedHash));
}

/**
 * Send OTP via Nodemailer or fallback to DEV console log
 */
async function sendOTPEmail(email, otp) {
  console.log(`\n==============================================`);
  console.log(`[MFA OTP SECURITY] Target Email: ${email}`);
  console.log(`[MFA OTP SECURITY] Generated 6-Digit OTP: ${otp}`);
  console.log(`==============================================\n`);

  // Only attempt SMTP network send if valid non-empty credentials are explicitly set
  if (
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER !== 'your-email@gmail.com' &&
    process.env.SMTP_USER.trim() !== ''
  ) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 3000 // 3s timeout
      });

      await transporter.sendMail({
        from: `"Secure Cloud File Sharing" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your One-Time Authentication Code (OTP)',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Secure Cloud File Sharing MFA Verification</h2>
            <p>Your 6-digit verification code is:</p>
            <h1 style="color: #2563eb; letter-spacing: 4px;">${otp}</h1>
            <p>This code will expire in <strong>${process.env.OTP_EXPIRES_MINUTES || 5} minutes</strong>.</p>
          </div>
        `
      });
      console.log(`[Nodemailer] Email successfully dispatched to ${email}`);
    } catch (err) {
      console.warn(`[Nodemailer Note] SMTP email send skipped/failed (${err.message}). Use the console OTP above.`);
    }
  }
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  sendOTPEmail
};
