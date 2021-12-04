const Reducer = (state, action) => {
  switch(action.type) {
    case 'SET_WALLET_CONNECTED':
      return {
        ...state,
        walletConnected: action.payload
      };

      default:
        return state;
  }
};

export default Reducer;
