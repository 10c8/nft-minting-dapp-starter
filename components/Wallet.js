import { useEffect, useState, useContext, useCallback } from 'react';
import { ethers } from 'ethers';

import { hasEthereum, requestAccount } from '../utils/ethereum';
import { Context } from '../store';

export default function Wallet() {
  const [state, dispatch] = useContext(Context);

  // UI state
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('CONNECT METAMASK');

  // Set address of connected wallet
  const setConnectedAccount = useCallback(async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      
      if (address) {
        setConnected(true);
        dispatch({
          type: 'SET_WALLET_CONNECTED',
          payload: true
        });

        // setMessage(address);
      }
    } catch {
      setMessage('CONNECT METAMASK');
    }
  }, [dispatch]);
  
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
  }, [setConnectedAccount]);

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
          dispatch({
            type: 'SET_WALLET_CONNECTED',
            payload: false
          });

          setMessage('CONNECT METAMASK');
        }
      });
    }

    listenMMAccount();
  }, [dispatch])

  // Request connection to wallet
  async function requestConnection() {
    try {
      await requestAccount();
    } catch(error) {
      if (error.message)
        setMessage(error.message);
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
      className={`flex items-center px-6 p-2 pt-3 text-md font-bold bg-transparent rounded-none border-4 border-black text-red-600 max-w-30 disabled:cursor-not-allowed hover:border-blue-400 ${connected ? 'hidden' : ''}`}
      onClick={handleConnectWallet}
      // disabled={connected || message === 'INSTALL METAMASK'}
      disabled
    >
      {!loading ? message : 'Loading...'}
    </button>
  );
}
