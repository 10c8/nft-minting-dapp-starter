import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { hasEthereum, requestAccount } from '../utils/ethereum';
// import Minter from '../src/artifacts/contracts/Minter.sol/Minter.json';
import Minter from '../pages/abi/cheebs.json';

export default function TotalSupply() {
  // UI state
  const [loading, setLoading] = useState(true);
  const [totalMinted, setTotalMinted] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // Constants
  const TOTAL = 1000;

  useEffect(() => {
    async function fetchTotals() {
      if (!hasEthereum()) {
        console.log('Install MetaMask');
        setLoading(false);
        return;
      }

      await getTotalSupply();
      await getTotalValue();
  
      setLoading(false);
    }

    fetchTotals();
  });

  // Get total supply of tokens from smart contract
  async function getTotalSupply() {
    // try {
      // Interact with contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_MINTER_ADDRESS,
        Minter.abi,
        provider
      );
      const data = await contract.minted();
  
      setTotalMinted(data.toNumber());
    // } catch(error) {
    //   console.log(`Failed to get "minted": ${error}`);
    // }
  }

  // Get total value collected by the smart contract
  async function getTotalValue() {
    // try {
    //   // Interact with contract
    //   const provider = new ethers.providers.Web3Provider(window.ethereum);
    //   const contract = new ethers.Contract(
    //     process.env.NEXT_PUBLIC_MINTER_ADDRESS,
    //     Minter.abi,
    //     provider
    //   );
    //   const data = await contract.getBalance();
  
    //   setTotalValue(ethers.utils.formatEther(data).toString());
    // } catch(error) {
    //   console.log(error);
    // }

    return 0;
  }

  return (
    <div className="flex flex-col gap-3 items-center w-full">
      {/* Progress Bar */}
      <div
        className="grid overflow-hidden relative grid-cols-5 w-full h-12 text-xs border-4 border-black"
      >
        <div
          className="absolute top-0 left-0 z-0 h-full bg-red-500"
          style={{
            width: `${Math.round((totalMinted / TOTAL) * 100)}%`
          }}
        />

        <span
          className="flex z-10 col-span-1 justify-center h-full border-r border-gray"
          style={{
            lineHeight: '46px'
          }}
        >
          GEN 0
        </span>
        <span
          className="flex z-10 col-span-1 justify-center h-full border-r border-l border-gray"
          style={{
            lineHeight: '46px'
          }}
        >
          200 ETH
        </span>
        <span
          className="flex z-10 col-span-2 justify-center h-full border-r border-l border-gray"
          style={{
            lineHeight: '46px'
          }}
        >
          400 ETH
        </span>
        <span
          className="flex z-10 col-span-1 justify-center h-full border-l border-gray"
          style={{
            lineHeight: '46px'
          }}
        >
          800 ETH
        </span>
      </div>

      <span>{loading ? 'Loading...' : `${totalMinted}/${TOTAL}`} MINTED</span>
      {/* <span>{loading ? 'Loading...' : `${totalValue}ETH`}</span> */}
    </div>
  );
}
