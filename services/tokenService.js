const { ethers } = require("ethers");

const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])"
];

const RPC_URL = process.env.RPC_URL || "https://mainnet.infura.io/v3/YOUR_INFURA_KEY";

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

async function verifyTokenOwnership(walletAddress, contractAddress, tokenId) {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
    
    const balance = await contract.balanceOf(walletAddress, tokenId);
    
    return {
      success: true,
      hasToken: balance > 0n,
      balance: balance.toString()
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return {
      success: false,
      error: "TOKEN_VERIFICATION_FAILED",
      message: error.message
    };
  }
}

async function verifyMultipleTokens(walletAddress, contractAddress, tokenIds) {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
    
    const addresses = tokenIds.map(() => walletAddress);
    const balances = await contract.balanceOfBatch(addresses, tokenIds);
    
    const results = tokenIds.map((tokenId, index) => ({
      tokenId: tokenId.toString(),
      hasToken: balances[index] > 0n,
      balance: balances[index].toString()
    }));
    
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error("Batch token verification error:", error);
    return {
      success: false,
      error: "BATCH_VERIFICATION_FAILED",
      message: error.message
    };
  }
}

async function verifyTicketToken(walletAddress, eventContractAddress, ticketTokenId) {
  const result = await verifyTokenOwnership(walletAddress, eventContractAddress, ticketTokenId);
  
  if (!result.success) {
    return result;
  }
  
  return {
    success: true,
    isValidTicket: result.hasToken,
    ticketBalance: result.balance
  };
}

module.exports = {
  verifyTokenOwnership,
  verifyMultipleTokens,
  verifyTicketToken
};
