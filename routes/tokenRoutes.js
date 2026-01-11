const express = require("express");
const router = express.Router();
const { verifyTokenOwnership, verifyMultipleTokens, verifyTicketToken } = require("../services/tokenService");

router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, contractAddress, tokenId } = req.body;
    
    if (!walletAddress || !contractAddress || tokenId === undefined) {
      return res.status(400).json({
        success: false,
        error: "MISSING_REQUIRED_FIELDS"
      });
    }
    
    const result = await verifyTokenOwnership(walletAddress, contractAddress, tokenId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      error: "TOKEN_VERIFICATION_FAILED"
    });
  }
});

router.post("/verify-batch", async (req, res) => {
  try {
    const { walletAddress, contractAddress, tokenIds } = req.body;
    
    if (!walletAddress || !contractAddress || !Array.isArray(tokenIds)) {
      return res.status(400).json({
        success: false,
        error: "MISSING_REQUIRED_FIELDS"
      });
    }
    
    const result = await verifyMultipleTokens(walletAddress, contractAddress, tokenIds);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Batch token verification error:", error);
    res.status(500).json({
      success: false,
      error: "BATCH_VERIFICATION_FAILED"
    });
  }
});

router.post("/verify-ticket", async (req, res) => {
  try {
    const { walletAddress, eventContractAddress, ticketTokenId } = req.body;
    
    if (!walletAddress || !eventContractAddress || ticketTokenId === undefined) {
      return res.status(400).json({
        success: false,
        error: "MISSING_REQUIRED_FIELDS"
      });
    }
    
    const result = await verifyTicketToken(walletAddress, eventContractAddress, ticketTokenId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Ticket verification error:", error);
    res.status(500).json({
      success: false,
      error: "TICKET_VERIFICATION_FAILED"
    });
  }
});

module.exports = router;
