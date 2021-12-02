import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { hasEthereum, requestAccount } from '../utils/ethereum';
import Minter from '../src/artifacts/contracts/Minter.sol/Minter.json';

export default function GameStatus() {
  // UI state
  const [loading, setLoading] = useState(true);
  // const [totalMinted, setTotalMinted] = useState(0);

  // Constants
  useEffect(() => {
    async function fetchTotals() {
      if (!hasEthereum()) {
        console.log('Install MetaMask');
        setLoading(false);
        return;
      }

      // await getTotalSupply();
  
      setLoading(false);
    }

    fetchTotals();
  });

  // Get total supply of tokens from smart contract
  // async function getTotalSupply() {
  //   try {
  //     // Interact with contract
  //     const provider = new ethers.providers.Web3Provider(window.ethereum);
  //     const contract = new ethers.Contract(
  //       process.env.NEXT_PUBLIC_MINTER_ADDRESS,
  //       Minter.abi,
  //       provider
  //     );
  //     const data = await contract.totalSupply();
  
  //     setTotalMinted(data.toNumber());
  //   } catch(error) {
  //     console.log(error);
  //   }
  // }
  
  return (
    <div className="flex flex-col col-span-1 gap-2 h-full">
      <h1 className="text-xl text-center text-gray-500">
        LEADERBOARD
      </h1>
    </div>
  );
}
