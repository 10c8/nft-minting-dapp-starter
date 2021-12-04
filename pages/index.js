import Head from 'next/head';
import { useState, useRef } from 'react';
import { ethers } from 'ethers';

import { hasEthereum } from '../utils/ethereum'
import TotalSupply from '../components/TotalSupply';
import MintButton from '../components/MintButton';
import Wallet from '../components/Wallet';
import GameStatus from '../components/GameStatus';
import Leaderboard from '../components/Leaderboard';
// import YourNFTs from '../components/YourNFTs';

import Minter from './abi/Doge.json';

export default function Home() {
  const getMintPrice = async () => {
    try {
      // Interact with contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_DOGE_ADDR,
        Minter,
        provider
      );

      const data = await contract.MINT_PRICE();
      return data.toNumber();
    } catch(error) {
      console.log(error);
    }
  }

  // Constants
  const MINT_PRICE = getMintPrice();
  const MAX_MINT = 10;

  // UI state
  const [mintQuantity, setMintQuantity] = useState(10);
  // const mintQuantityInputRef = useRef();
  const [mintError, setMintError] = useState(false);
  const [mintMessage, setMintMessage] = useState('');
  const [mintLoading, setMintLoading] = useState(false);

  // Call smart contract to mint NFT(s) from current address
  async function mintNFTs() {
    // // Check quantity
    // if (mintQuantity < 1) {
    //   setMintMessage('You need to mint at least 1 NFT.');
    //   setMintError(true);
    //   // mintQuantityInputRef.current.focus();
    //   return;
    // }

    // if (mintQuantity > MAX_MINT) {
    //   setMintMessage('You can only mint a maximum of 10 NFTs.');
    //   setMintError(true);
    //   // mintQuantityInputRef.current.focus();
    //   return;
    // }

    // // Get wallet details
    // if(!hasEthereum())
    //   return;
    
    // try {
    //   const provider = new ethers.providers.Web3Provider(window.ethereum);
    //   const signer = provider.getSigner();

    //   try {
    //     // const address = await signer.getAddress();

    //     setMintLoading(true);

    //     // Interact with contract
    //     const contract = new ethers.Contract(
    //       process.env.NEXT_PUBLIC_MINTER_ADDRESS,
    //       Minter,
    //       signer
    //     );
    //     const totalPrice = MINT_PRICE * mintQuantity;
    //     const transaction = await contract.mint(mintQuantity, {
    //       value: ethers.utils.parseEther(totalPrice.toString())
    //     });

    //     await transaction.wait();

    //     // mintQuantityInputRef.current.value = 0;
    //     setMintMessage(`Congrats, you minted ${mintQuantity} token(s)!`);
    //     setMintError(false);
    //   } catch {
    //     setMintMessage('Connect your wallet first.');
    //     setMintError(true);
    //   }
    // } catch(error) {
    //   setMintMessage(error.message);
    //   setMintError(true);
    // }

    // setMintLoading(false);
  }

  return (
    <div className="flex flex-col items-center p-4 pt-8 mx-auto w-full lg:p-8 lg:max-w-7xl">
      <Head>
        <title>NFT Minting dApp Starter</title>
        <meta name="description" content="Mint an NFT, or a number of NFTs, from the client-side." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className="mt-6 bg-cover logo"
        style={{
          width: 'calc(679px * 0.75)',
          height: 'calc(87px * 0.75)',
          // filter: 'drop-shadow(16px 16px 0px rgba(0, 0, 0, 0.3))'
        }}
      />

      <main
        className="flex flex-col gap-3 items-center mt-16 w-full lg:flex-row"
        style={{
          fontFamily: 'Broken Console Bold'
        }}
      >
        {/* Minting Box */}
        <div className="flex flex-col flex-shrink-0 gap-8 items-center p-8 w-full h-80 bg-yellow-100 bg-opacity-90 lg:p-10 lg:w-1/2 bordered">
          <h1 className="text-4xl text-red-600">MINTING</h1>
          <TotalSupply />
          <MintButton loading={mintLoading} action={mintNFTs} />
        </div>

        {/* Staking Box */}
        <div className="grid flex-shrink-0 grid-rows-2 w-full h-80 bg-yellow-100 bg-opacity-90 lg:w-1/2 bordered">
          <div
            className="flex row-span-1 items-center px-4 w-full"
            style={{
              borderBottom: '7px solid black'
            }}
          >
            <h1 className="mt-2 mr-auto text-4xl">UNSTAKED</h1>
            <Wallet />
          </div>
          <div
            className="flex row-span-1 items-center px-4 w-full"
            style={{
              borderTop: '7px solid black'
            }}
          >
            <h1 className="mt-2 mr-auto text-4xl">STAKED</h1>
            <Wallet />
          </div>
        </div>
      </main>

      <main
        className="flex flex-col gap-6 items-center mt-3 w-full lg:flex-row"
        style={{
          fontFamily: 'Broken Console Bold'
        }}
      >
        {/* Game Status */}
        <div className="p-6 w-full h-80 bg-yellow-100 bg-opacity-90 bordered lg:w-1/2">
          <GameStatus />
        </div>
      </main>
      
      {/* <GameStatus /> */}

      {/* <Leaderboard /> */}

      <div
        className="flex fixed bottom-0 left-0 items-center px-20 mt-8 w-full h-20 bg-yellow-100 bg-opacity-90"
        style={{
          fontFamily: 'Broken Console Bold'
        }}
      >
        <div
          className="mr-auto w-32 h-12 bg-center bg-no-repeat bg-contain pb"
        />
        <a href="#" className="text-red-600 underline">
          TERMS OF SERVICE
        </a>
        <div className="flex items-center px-3 pt-2 pb-1 ml-auto border-2 border-blue-400">
          <a href="#" className="text-red-600">WHITEPAPER</a>
        </div>
      </div>

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
