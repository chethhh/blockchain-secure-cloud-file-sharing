const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 32; // 256 bits

/**
 * Gets master encryption key derived or parsed from environment variables
 */
function getMasterKey() {
  const masterSecret = process.env.MASTER_ENCRYPTION_KEY || 'default_master_encryption_key_32bytes_hex_string_0000000000000000';
  return crypto.createHash('sha256').update(masterSecret).digest();
}

/**
 * Encrypts a plaintext file Buffer using AES-256-GCM.
 * Protects the per-file encryption key by encrypting it with the Master Key (Envelope Encryption).
 */
function encryptBuffer(buffer) {
  // 1. Generate random per-file AES-256 encryption key
  const fileKey = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // 2. Encrypt buffer with per-file key
  const cipher = crypto.createCipheriv(ALGORITHM, fileKey, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 3. Encrypt per-file key using Master Key
  const masterKey = getMasterKey();
  const keyIv = crypto.randomBytes(IV_LENGTH);
  const keyCipher = crypto.createCipheriv(ALGORITHM, masterKey, keyIv);
  const encryptedKeyBuffer = Buffer.concat([keyCipher.update(fileKey), keyCipher.final()]);
  const keyAuthTag = keyCipher.getAuthTag();

  // Pack master key IV, auth tag and encrypted key payload into single hex payload
  const envelopeKey = JSON.stringify({
    keyIv: keyIv.toString('hex'),
    keyAuthTag: keyAuthTag.toString('hex'),
    keyData: encryptedKeyBuffer.toString('hex')
  });

  return {
    encryptedBuffer,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encryptedKey: Buffer.from(envelopeKey).toString('hex')
  };
}

/**
 * Decrypts an encrypted file Buffer using stored metadata.
 */
function decryptBuffer(encryptedBuffer, ivHex, authTagHex, encryptedKeyHex) {
  // 1. Unwrap envelope encrypted file key
  const masterKey = getMasterKey();
  const envelopePayload = JSON.parse(Buffer.from(encryptedKeyHex, 'hex').toString('utf8'));
  
  const keyIv = Buffer.from(envelopePayload.keyIv, 'hex');
  const keyAuthTag = Buffer.from(envelopePayload.keyAuthTag, 'hex');
  const keyData = Buffer.from(envelopePayload.keyData, 'hex');

  const keyDecipher = crypto.createDecipheriv(ALGORITHM, masterKey, keyIv);
  keyDecipher.setAuthTag(keyAuthTag);
  const fileKey = Buffer.concat([keyDecipher.update(keyData), keyDecipher.final()]);

  // 2. Decrypt file payload
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, fileKey, iv);
  decipher.setAuthTag(authTag);
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

  return decryptedBuffer;
}

module.exports = {
  encryptBuffer,
  decryptBuffer
};
