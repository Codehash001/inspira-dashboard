"use client"

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      checkConnection();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('Checking existing accounts:', accounts);
        
        if (accounts && accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setAddress(accounts[0]);
          setSigner(signer);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length > 0) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAddress(accounts[0]);
        setSigner(signer);
        setIsConnected(true);
      } catch (error) {
        console.error('Error handling account change:', error);
        setAddress(null);
        setSigner(null);
        setIsConnected(false);
      }
    } else {
      setAddress(null);
      setSigner(null);
      setIsConnected(false);
    }
  };

  const handleChainChanged = () => {
    console.log('Chain changed, reloading...');
    window.location.reload();
  };

  const switchToMainnet = async (provider: ethers.BrowserProvider) => {
    console.log('Switching to Ethereum mainnet...');
    const chainId = '0x1'; // 1 in hex for Ethereum mainnet
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      console.log('Successfully switched to Ethereum mainnet');
    } catch (error: any) {
      console.log('Error switching chain:', error);
      if (error.code === 4902) {
        console.log('Adding Ethereum mainnet to MetaMask...');
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName: 'Ethereum Mainnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/L5eN8r2m79oOujs39Ra9Rm_W5nLva5pH'],
              blockExplorerUrls: ['https://etherscan.io'],
            },
          ],
        });
        console.log('Successfully added Ethereum mainnet');
      } else {
        throw error;
      }
    }
    
    // Verify we're on the correct network
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(1)) {
      throw new Error('Failed to switch to Ethereum mainnet');
    }
  };

  const connectWallet = async () => {
    console.log('Connecting wallet...');
    if (!window.ethereum) {
      console.log('MetaMask not installed, redirecting...');
      window.open('https://metamask.io/download/', '_blank');
      throw new Error('Please install MetaMask');
    }

    try {
      // First request accounts
      console.log('Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Got accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check and switch network if needed
      const network = await provider.getNetwork();
      console.log('Current network:', network);
      
      if (network.chainId !== BigInt(1)) {
        console.log('Wrong network, switching to Ethereum mainnet...');
        await switchToMainnet(provider);
      }
      
      // Get signer after network switch
      console.log('Getting signer...');
      const signer = await provider.getSigner();
      console.log('Got signer');
      
      const address = await signer.getAddress();
      console.log('Got address:', address);
      
      setAddress(address);
      setSigner(signer);
      setIsConnected(true);
      
      return { signer, address };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    console.log('Disconnecting wallet...');
    setAddress(null);
    setSigner(null);
    setIsConnected(false);
  };

  return {
    address,
    signer,
    isConnected,
    connectWallet,
    disconnectWallet
  };
}
