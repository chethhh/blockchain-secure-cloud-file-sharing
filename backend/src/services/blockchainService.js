const { ethers } = require('ethers');
const getContractInfo = require('../config/blockchain');

let provider;
let wallet;
let contract;

function initBlockchain() {
  const config = getContractInfo();
  if (!config.contractAddress || !config.abi || config.abi.length === 0) {
    console.warn('[Blockchain Warning] Smart contract address or ABI not yet available. Deploy contract using `npx hardhat run scripts/deploy.js --network localhost`.');
    return null;
  }

  try {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    wallet = new ethers.Wallet(config.privateKey, provider);
    contract = new ethers.Contract(config.contractAddress, config.abi, wallet);
    return contract;
  } catch (err) {
    console.error(`[Blockchain Error] Initialization error: ${err.message}`);
    return null;
  }
}

/**
 * Uploads file metadata reference (IPFS CID) to Solidity contract
 */
async function uploadFileToBlockchain(ipfsHash) {
  const instance = initBlockchain();
  if (!instance) {
    // Return mock values if contract is not deployed yet in basic dev environment
    console.warn('[Blockchain Service] Running in fallback mode without active smart contract connection.');
    return {
      fileId: Math.floor(Date.now() / 1000),
      transactionHash: `0xmock${Math.random().toString(16).substring(2)}`
    };
  }

  try {
    const tx = await instance.uploadFile(ipfsHash);
    const receipt = await tx.wait();
    
    // Parse FileUploaded event to extract fileId
    let fileId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = instance.interface.parseLog(log);
        if (parsed && parsed.name === 'FileUploaded') {
          fileId = Number(parsed.args.fileId);
          break;
        }
      } catch (e) {
        // ignore non-matching logs
      }
    }

    if (fileId === null) {
      const fileCount = await instance.fileCount();
      fileId = Number(fileCount);
    }

    return {
      fileId,
      transactionHash: receipt.hash
    };
  } catch (error) {
    console.error(`[Blockchain Error] uploadFile failed: ${error.message}`);
    throw new Error(`Blockchain upload transaction failed: ${error.message}`);
  }
}

/**
 * Grants file access on-chain
 */
async function grantBlockchainAccess(fileId, userWalletAddress) {
  const instance = initBlockchain();
  if (!instance) {
    return { transactionHash: `0xmock_grant_${Math.random().toString(16).substring(2)}` };
  }

  try {
    const tx = await instance.grantAccess(userWalletAddress, fileId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash };
  } catch (error) {
    console.error(`[Blockchain Error] grantAccess failed: ${error.message}`);
    throw new Error(`Blockchain grantAccess failed: ${error.message}`);
  }
}

/**
 * Revokes file access on-chain
 */
async function revokeBlockchainAccess(fileId, userWalletAddress) {
  const instance = initBlockchain();
  if (!instance) {
    return { transactionHash: `0xmock_revoke_${Math.random().toString(16).substring(2)}` };
  }

  try {
    const tx = await instance.revokeAccess(userWalletAddress, fileId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash };
  } catch (error) {
    console.error(`[Blockchain Error] revokeAccess failed: ${error.message}`);
    throw new Error(`Blockchain revokeAccess failed: ${error.message}`);
  }
}

/**
 * Verifies on-chain if a wallet address has access to a file
 */
async function verifyBlockchainAccess(fileId, userWalletAddress) {
  const instance = initBlockchain();
  if (!instance) {
    // If no contract deployed, fallback to true in demo mode
    return true;
  }

  try {
    const hasAccess = await instance.hasAccess(userWalletAddress, fileId);
    return hasAccess;
  } catch (error) {
    console.error(`[Blockchain Error] verifyBlockchainAccess failed: ${error.message}`);
    return false;
  }
}

/**
 * Get details for a file directly from smart contract
 */
async function getFileBlockchainDetails(fileId) {
  const instance = initBlockchain();
  if (!instance) return null;

  try {
    const details = await instance.getFileDetails(fileId);
    return {
      ipfsHash: details[0],
      owner: details[1],
      createdAt: Number(details[2]),
      exists: details[3]
    };
  } catch (error) {
    console.error(`[Blockchain Error] getFileDetails failed: ${error.message}`);
    return null;
  }
}

module.exports = {
  uploadFileToBlockchain,
  grantBlockchainAccess,
  revokeBlockchainAccess,
  verifyBlockchainAccess,
  getFileBlockchainDetails
};
