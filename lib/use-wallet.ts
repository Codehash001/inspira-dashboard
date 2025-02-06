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

  const switchToHoleskyNetwork = async (provider: ethers.BrowserProvider) => {
    console.log('Switching to Holešky network...');
    const chainId = '0x4268'; // 17000 in hex
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      console.log('Successfully switched to Holešky');
    } catch (error: any) {
      console.log('Error switching chain:', error);
      if (error.code === 4902) {
        console.log('Adding Holešky network to MetaMask...');
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName: 'Holešky',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://ethereum-holesky.publicnode.com'],
              blockExplorerUrls: ['https://holesky.etherscan.io'],
            },
          ],
        });
        console.log('Successfully added Holešky network');
      } else {
        throw error;
      }
    }

    // Wait a bit for the network switch to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify we're on the correct network
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(17000)) {
      throw new Error('Failed to switch to Holešky network');
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
      
      if (network.chainId !== BigInt(17000)) {
        console.log('Wrong network, switching to Holešky...');
        await switchToHoleskyNetwork(provider);
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
