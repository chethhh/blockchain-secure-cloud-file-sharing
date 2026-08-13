import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { walletAPI } from '../services/api';
import { AuthContext } from './AuthContext';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const [account, setAccount] = useState(user?.walletAddress || null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState(null);

  useEffect(() => {
    if (user?.walletAddress) {
      setAccount(user.walletAddress);
    }
  }, [user]);

  // Listen to MetaMask account & network events
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          console.log('[MetaMask] Account changed:', accounts[0]);
          setAccount(accounts[0].toLowerCase());
        } else {
          setAccount(null);
        }
      });

      window.ethereum.on('chainChanged', (newChainId) => {
        console.log('[MetaMask] Network changed:', newChainId);
        setChainId(newChainId);
        window.location.reload();
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      const msg = 'MetaMask browser extension is not installed! Please install MetaMask to use blockchain file features.';
      setWalletError(msg);
      throw new Error(msg);
    }

    setIsConnecting(true);
    setWalletError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in MetaMask');
      }

      const walletAddress = accounts[0].toLowerCase();
      const network = await provider.getNetwork();
      setChainId(network.chainId.toString());

      // 1. Get Cryptographic Challenge Nonce from Backend
      const nonceRes = await walletAPI.getNonce(walletAddress);
      const nonce = nonceRes.data.nonce;

      // 2. Prompt MetaMask user to sign the Nonce
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonce);

      // 3. Send signature to Backend for cryptographic verification
      const verifyRes = await walletAPI.verifySignature(walletAddress, signature);

      if (verifyRes.data.success) {
        setAccount(walletAddress);
        updateUserProfile(verifyRes.data.user);
        setIsConnecting(false);
        return walletAddress;
      }
    } catch (err) {
      setIsConnecting(false);
      const msg = err.response?.data?.message || err.message || 'Failed to connect wallet';
      setWalletError(msg);
      throw new Error(msg);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isConnecting,
        walletError,
        connectWallet,
        disconnectWallet,
        isConnected: !!account
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
