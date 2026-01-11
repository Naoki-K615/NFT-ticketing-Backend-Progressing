const express = require("express");
const router = express.Router();
const { generateNonce, verifySignature, createSignMessage } = require("../services/web3Service");
const { generateToken } = require("../config/jwt");
const Student = require("../models/Student");

router.post("/nonce", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "WALLET_ADDRESS_REQUIRED"
      });
    }
    
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_WALLET_ADDRESS"
      });
    }
    
    const nonce = generateNonce(walletAddress);
    const message = createSignMessage(nonce);
    
    res.status(200).json({
      success: true,
      nonce,
      message
    });
  } catch (error) {
    console.error("Nonce generation error:", error);
    res.status(500).json({
      success: false,
      error: "NONCE_GENERATION_FAILED"
    });
  }
});

router.post("/verify-signature", async (req, res) => {
  try {
    const { walletAddress, nonce, signature } = req.body;
    
    if (!walletAddress || !nonce || !signature) {
      return res.status(400).json({
        success: false,
        error: "MISSING_REQUIRED_FIELDS"
      });
    }
    
    const result = verifySignature(walletAddress, nonce, signature);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error
      });
    }
    
    let student = await Student.findOne({ walletAddress: result.address.toLowerCase() });
    
    if (!student) {
      student = new Student({
        walletAddress: result.address.toLowerCase(),
        name: `User_${result.address.slice(0, 8)}`,
        email: `${result.address.toLowerCase()}@wallet.local`,
        password: "wallet-auth-user"
      });
      await student.save();
    }
    
    const token = generateToken({
      walletAddress: result.address.toLowerCase(),
      studentId: student._id,
      type: "wallet"
    });
    
    res.status(200).json({
      success: true,
      token,
      user: {
        walletAddress: result.address,
        name: student.name,
        id: student._id
      }
    });
  } catch (error) {
    console.error("Signature verification error:", error);
    res.status(500).json({
      success: false,
      error: "VERIFICATION_FAILED"
    });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "NO_TOKEN_PROVIDED"
    });
  }
  
  const token = authHeader.split(" ")[1];
  const { verifyToken } = require("../config/jwt");
  const result = verifyToken(token);
  
  if (!result.success) {
    return res.status(401).json({
      success: false,
      error: result.error
    });
  }
  
  try {
    const student = await Student.findById(result.decoded.studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND"
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: student._id,
        walletAddress: student.walletAddress,
        name: student.name,
        email: student.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "FETCH_USER_FAILED"
    });
  }
});

module.exports = router;
