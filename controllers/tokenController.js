const { verifyTokenOwnership } = require("../services/tokenService");
const asyncHandler = require("express-async-handler");

// @desc    Verify ERC-1155 token ownership
// @route   POST /api/token/verify
// @access  Private (or Public with walletAddress)
const verifyToken = asyncHandler(async (req, res) => {
  const { walletAddress, contractAddress, tokenId } = req.body;

  if (!walletAddress || !contractAddress || !tokenId) {
    return res.status(400).json({ 
      success: false, 
      error: "MISSING_PARAMETERS",
      message: "walletAddress, contractAddress, and tokenId are required" 
    });
  }

  const isOwner = await verifyTokenOwnership(
    walletAddress, 
    contractAddress, 
    tokenId,
    process.env.RPC_URL
  );

  if (isOwner) {
    res.status(200).json({ 
      success: true, 
      isOwner: true,
      message: "Token ownership verified" 
    });
  } else {
    res.status(403).json({ 
      success: false, 
      isOwner: false,
      error: "TOKEN_NOT_FOUND",
      message: "User does not own the required token" 
    });
  }
});

module.exports = { verifyToken };
