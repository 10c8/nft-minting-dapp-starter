import Head from 'next/head';
import { useState, useRef } from 'react';
import { ethers } from 'ethers';

import { hasEthereum } from '../utils/ethereum'
import TotalSupply from '../components/TotalSupply';
import Wallet from '../components/Wallet';
import YourNFTs from '../components/YourNFTs';
import Minter from '../src/artifacts/contracts/Minter.sol/Minter.json';

export default function Home() {
  // Constants
  const MINT_PRICE = 0.03;
  const MAX_MINT = 10;

  // UI state
  const [mintQuantity, setMintQuantity] = useState(1);
  const mintQuantityInputRef = useRef();
  const [mintError, setMintError] = useState(false);
  const [mintMessage, setMintMessage] = useState('');
  const [mintLoading, setMintLoading] = useState(false);

  // Call smart contract to mint NFT(s) from current address
  async function mintNFTs() {
    // Check quantity
    if (mintQuantity < 1) {
      setMintMessage('You need to mint at least 1 NFT.');
      setMintError(true);
      mintQuantityInputRef.current.focus();
      return;
    }

    if (mintQuantity > MAX_MINT) {
      setMintMessage('You can only mint a maximum of 10 NFTs.');
      setMintError(true);
      mintQuantityInputRef.current.focus();
      return;
    }

    // Get wallet details
    if(!hasEthereum())
      return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      try {
        // const address = await signer.getAddress();

        setMintLoading(true);

        // Interact with contract
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_MINTER_ADDRESS,
          Minter.abi,
          signer
        );
        const totalPrice = MINT_PRICE * mintQuantity;
        const transaction = await contract.mint(mintQuantity, {
          value: ethers.utils.parseEther(totalPrice.toString())
        });

        await transaction.wait();

        mintQuantityInputRef.current.value = 0;
        setMintMessage(`Congrats, you minted ${mintQuantity} token(s)!`);
        setMintError(false);
      } catch {
        setMintMessage('Connect your wallet first.');
        setMintError(true);
      }
    } catch(error) {
      setMintMessage(error.message);
      setMintError(true);
    }

    setMintLoading(false);
  }

  return (
    <div className="flex flex-col items-center p-8 mx-auto max-w-7xl">
      <Head>
        <title>NFT Minting dApp Starter</title>
        <meta name="description" content="Mint an NFT, or a number of NFTs, from the client-side." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1
        className="text-6xl text-red-500"
        style={{
          fontFamily: 'Broken Console Bold',
          textShadow: '6px 6px 0 black'
        }}
      >
        NOT WOLF GAME
      </h1>

      <main
        className="flex gap-6 items-center mt-6 w-full"
        style={{
          fontFamily: 'Broken Console Bold'
        }}
      >
        {/* Minting Box */}
        <div className="flex flex-col gap-8 items-center p-10 w-full border-4 border-black">
          <h1 className="text-4xl">MINTING</h1>
          <TotalSupply />
          <button
            className="px-8 pt-4 pb-3 bg-transparent border-4 border-black"
            onClick={mintNFTs}
          >
            {mintLoading ? 'Loading...' : 'Mint'}
          </button>
        </div>

        <div className="flex flex-col gap-8 items-center p-10 w-full h-60 border-4 border-black">
          <Wallet />
        </div>
      </main>

      {/* <main className="space-y-8">
        {!process.env.NEXT_PUBLIC_MINTER_ADDRESS ? (
          <p className="text-md">
            Please add a value to the <pre>NEXT_PUBLIC_MINTER_ADDRESS</pre> environment variable.
          </p>
        ) : (
          <>
            <h1 className="mb-8 text-4xl font-semibold">
              NFT Minting dApp Starter
            </h1>
            <div className="space-y-8">
              <div className="p-4 bg-gray-100 lg:p-8">
                <div>
                  <h2 className="mb-2 text-2xl font-semibold">Mint NFTs</h2>
                  <label className="inline-block mb-2 text-sm text-gray-600">
                    How many NFTs would you like to mint from the smart contract?
                  </label>
                  <div className="flex">
                    <input
                      className={!mintError
                        ? "p-4 w-2/3 text-center rounded-tl rounded-bl border focus:outline-none focus:border-blue-600"
                        : "p-4 w-2/3 text-center rounded-tl rounded-bl border border-red-500 focus:outline-none focus:border-blue-600"
                      }
                      onChange={e => setMintQuantity(e.target.value)}
                      value={mintQuantity}
                      placeholder="1"
                      type="number"
                      min="1"
                      max="10"
                      ref={mintQuantityInputRef}
                    />
                    <button
                      className="px-8 py-4 w-1/3 text-white bg-blue-600 rounded-tr rounded-br hover:bg-blue-700"
                      onClick={mintNFTs}
                    >
                      {mintLoading ? 'Loading...' : 'Mint'}
                    </button>
                  </div>
                  {mintMessage && (
                    <span
                      className={mintError
                        ? "block mt-2 text-xs text-red-600"
                        : "block mt-2 text-xs text-green-600"
                      }
                    >
                      {mintMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        <YourNFTs />
      </main> */}

      <footer className="mt-20 text-center">
      </footer>
    </div>
  );
};
