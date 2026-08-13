import { ethers } from 'ethers';
import contractInfo from './contractAddress.json';
import contractABI from './FileSharingABI.json';

export const getBrowserContract = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed in your browser');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contractAddress = contractInfo.contractAddress || import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('Smart contract address is not configured');
  }

  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  return { contract, signer, provider };
};
