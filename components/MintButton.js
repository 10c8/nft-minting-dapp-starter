export default function MintButton({ loading, action }) {
  return (
    <button
      className="px-8 pt-4 pb-3 bg-transparent border-4 border-black"
      onClick={action}
    >
      {loading ? 'Loading...' : 'Mint'}
    </button>
  );
}
