const { ethers } = require("ethers");

// ABI for ERC-1155 balanceOf function
const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)"
];

/**
 * Verify if a wallet address owns a specific ERC-1155 token
 * @param {string} walletAddress - User's wallet address
 * @param {string} contractAddress - ERC-1155 Contract address
 * @param {string|number} tokenId - ID of the token to check
 * @param {string} rpcUrl - Ethereum RPC URL
 * @returns {Promise<boolean>}
 */
const verifyTokenOwnership = async (walletAddress, contractAddress, tokenId, rpcUrl) => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl || "https://rpc.ankr.com/eth");
    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
    
    const balance = await contract.balanceOf(walletAddress, tokenId);
    
    return balance > 0n; // ethers v6 returns BigInt
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
};

module.exports = { verifyTokenOwnership };
