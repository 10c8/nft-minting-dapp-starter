import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { hasEthereum, requestAccount } from '../utils/ethereum';

export default function Wallet() {
  // UI state
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('CONNECT METAMASK');

  // First load
  useEffect(() => {
    async function fetchConnectedAccount() {
      if (!hasEthereum()) {
        setMessage('INSTALL METAMASK');
        setLoading(false);
        return;
      }

      await setConnectedAccount();

      setLoading(false);
    }

    fetchConnectedAccount();
  },[]);

  // Account changes
  useEffect(() => {
    async function listenMMAccount() {
      if (!hasEthereum())
        return;
      
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts && accounts[0]) {
          setMessage(accounts[0])
        } else {
          setConnected(false);
          setMessage('CONNECT METAMASK');
        }
      });
    }

    listenMMAccount();
  },[])

  // Request connection to wallet
  async function requestConnection() {
    try {
      await requestAccount();
    } catch(error) {
      if (error.message)
        setMessage(error.message);
    }
  }

  // Set address of connected wallet
  async function setConnectedAccount() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      
      if (address) {
        setConnected(true)
        setMessage(address);
      }
    } catch {
      setMessage('CONNECT METAMASK');
    }
  }

  // Handle CONNECT METAMASK click
  async function handleConnectWallet() {
    setLoading(true);

    await requestConnection();
    await setConnectedAccount();

    setLoading(false);
  }

  return (
    <button
      className={`flex items-center p-3 text-xs font-bold bg-transparent rounded-none border-4 border-black lg:text-xl max-w-30 disabled:cursor-not-allowed ${connected ? 'hidden' : ''}`}
      onClick={handleConnectWallet}
      disabled={connected || message === 'INSTALL METAMASK'}
    >
      {!loading ? message : 'Loading...'}
    </button>
  );
}
