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
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // Listen for chain changes
      window.ethereum.on('chainChanged', handleChainChanged);

      // Initial connection check
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
        if (accounts.length > 0) {
          const signer = await getSigner();
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
    if (accounts.length > 0) {
      const signer = await getSigner();
      setAddress(accounts[0]);
      setSigner(signer);
      setIsConnected(true);
    } else {
      setAddress(null);
      setSigner(null);
      setIsConnected(false);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const getSigner = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create Web3Provider and get signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check if we're on the correct network (Sepolia)
        const network = await provider.getNetwork();
        const SEPOLIA_CHAIN_ID = BigInt('11155111');
        if (network.chainId !== SEPOLIA_CHAIN_ID) { // Sepolia chainId
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
            });
          } catch (error: any) {
            // If the chain hasn't been added to MetaMask
            if (error.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'SEP',
                    decimals: 18
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
              });
            }
          }
          // Get the signer again after network switch
          return await provider.getSigner();
        }
        return await provider.getSigner();
      } catch (error) {
        console.error('Error getting signer:', error);
        return null;
      }
    }
    return null;
  };

  const connect = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const signer = await getSigner();
        if (signer) {
          const address = await signer.getAddress();
          setAddress(address);
          setSigner(signer);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  const disconnect = () => {
    setAddress(null);
    setSigner(null);
    setIsConnected(false);
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return {
    connect,
    disconnect,
    isConnected,
    address,
    signer,
    shortenAddress: address ? shortenAddress(address) : '',
  };
}
