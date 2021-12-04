import { useContext } from 'react';

import { Context } from '../store';
import Wallet from './Wallet';

export default function MintButton({ loading, action }) {
  const [state, dispatch] = useContext(Context);

  return (
    // <>
    //   {state.walletConnected ? (
    //     <button
    //       className="p-2 px-6 pt-3 bg-transparent border-4 border-black hover:border-blue-400"
    //       // onClick={action}
    //     >
    //       {loading ? 'Loading...' : 'Mint'}
    //     </button>
    //   ) : (
    //     <Wallet />
    //   )}
    // </>
    <>
      <button
        className="p-2 px-6 pt-3 bg-transparent border-4 border-black hover:border-blue-400"
        // onClick={action}
      >
        {loading ? 'Loading...' : 'MINT DOGE'}
      </button>
    </>
  );
}
