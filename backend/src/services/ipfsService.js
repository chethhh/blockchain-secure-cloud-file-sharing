const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pinataConfig = require('../config/pinata');

const MOCK_STORAGE_DIR = path.join(__dirname, '../../uploads/ipfs_mock');

if (!fs.existsSync(MOCK_STORAGE_DIR)) {
  fs.mkdirSync(MOCK_STORAGE_DIR, { recursive: true });
}

/**
 * Uploads an encrypted file buffer to IPFS via Pinata (or fallback mock local IPFS storage)
 * @param {Buffer} buffer Encrypted file buffer
 * @param {string} filename Original or encrypted filename metadata
 * @returns {Promise<{ success: boolean, cid: string }>}
 */
async function uploadToIPFS(buffer, filename) {
  // If Pinata JWT is configured, attempt real Pinata IPFS pin
  if (pinataConfig.jwt && pinataConfig.jwt !== 'your_pinata_jwt_token_here') {
    try {
      const formData = new FormData();
      formData.append('file', buffer, { filename: filename || 'encrypted_file.bin' });

      const pinataMetadata = JSON.stringify({ name: filename || 'encrypted_file' });
      formData.append('pinataMetadata', pinataMetadata);

      const pinataOptions = JSON.stringify({ cidVersion: 0 });
      formData.append('pinataOptions', pinataOptions);

      const response = await axios.post(pinataConfig.pinningEndpoint, formData, {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${pinataConfig.jwt}`
        }
      });

      if (response.data && response.data.IpfsHash) {
        console.log(`[Pinata IPFS] File pinned successfully with CID: ${response.data.IpfsHash}`);
        return {
          success: true,
          cid: response.data.IpfsHash
        };
      }
    } catch (error) {
      console.warn(`[Pinata Warning] Direct Pinata pin failed (${error.message}). Falling back to local IPFS simulation.`);
    }
  }

  // Local IPFS storage simulation for offline / demo mode
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const mockCid = `Qm${hash.substring(0, 44)}`;
  const filePath = path.join(MOCK_STORAGE_DIR, `${mockCid}.bin`);
  
  fs.writeFileSync(filePath, buffer);
  console.log(`[Mock IPFS] Local IPFS simulated pin saved file to: ${filePath} with CID: ${mockCid}`);

  return {
    success: true,
    cid: mockCid
  };
}

/**
 * Downloads an encrypted file buffer from IPFS given a CID.
 * @param {string} cid IPFS Content Identifier
 * @returns {Promise<Buffer>}
 */
async function fetchFromIPFS(cid) {
  // Check local mock storage first
  const localFilePath = path.join(MOCK_STORAGE_DIR, `${cid}.bin`);
  if (fs.existsSync(localFilePath)) {
    console.log(`[Mock IPFS] Fetched file locally from mock store: ${cid}`);
    return fs.readFileSync(localFilePath);
  }

  // Fetch from Pinata Gateway
  try {
    const gatewayUrl = `${pinataConfig.gatewayUrl}/ipfs/${cid}`;
    console.log(`[IPFS Gateway] Requesting ${gatewayUrl}`);
    const response = await axios.get(gatewayUrl, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download file from IPFS Gateway for CID ${cid}: ${error.message}`);
  }
}

module.exports = {
  uploadToIPFS,
  fetchFromIPFS
};
