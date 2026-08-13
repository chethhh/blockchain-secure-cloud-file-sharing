const fs = require('fs');
const path = require('path');

const getContractInfo = () => {
  let contractAddress = process.env.CONTRACT_ADDRESS || '';
  let abi = [];

  const addressFilePath = path.join(__dirname, '../blockchain/contractAddress.json');
  const abiFilePath = path.join(__dirname, '../blockchain/FileSharingABI.json');

  if (fs.existsSync(addressFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(addressFilePath, 'utf8'));
      if (data.contractAddress) {
        contractAddress = data.contractAddress;
      }
    } catch (e) {
      console.warn('[Blockchain Config] Warning: Could not read contractAddress.json');
    }
  }

  if (fs.existsSync(abiFilePath)) {
    try {
      abi = JSON.parse(fs.readFileSync(abiFilePath, 'utf8'));
    } catch (e) {
      console.warn('[Blockchain Config] Warning: Could not read FileSharingABI.json');
    }
  }

  return {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    contractAddress,
    abi
  };
};

module.exports = getContractInfo;
