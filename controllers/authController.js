const Student = require("../models/Student");
const { v4: uuidv4 } = require("uuid");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// @desc    Get nonce for wallet login
// @route   GET /api/auth/nonce/:walletAddress
// @access  Public
const getNonce = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;
  const nonce = uuidv4();

  let student = await Student.findOne({ walletAddress: walletAddress.toLowerCase() });

  if (!student) {
    // Optionally create a placeholder or just return nonce
    // For this flow, we'll just send nonce. Verification will handle creation if needed.
  } else {
    student.nonce = nonce;
    await student.save();
  }

  res.status(200).json({ nonce });
});

// @desc    Verify wallet signature and login
// @route   POST /api/auth/verify
// @access  Public
const verifySignature = asyncHandler(async (req, res) => {
  const { walletAddress, signature, nonce } = req.body;

  if (!walletAddress || !signature || !nonce) {
    return res.status(400).json({ success: false, error: "MISSING_PARAMETERS" });
  }

  try {
    const recoveredAddress = ethers.verifyMessage(nonce, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ success: false, error: "INVALID_SIGNATURE" });
    }

    let student = await Student.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!student) {
      // Create new student if they don't exist (Wallet-first registration)
      student = new Student({
        walletAddress: walletAddress.toLowerCase(),
        name: `User_${walletAddress.slice(0, 6)}`,
        email: `${walletAddress.toLowerCase()}@wallet.com`, // Placeholder
        password: uuidv4(), // Placeholder password
      });
    }

    // Reset nonce
    student.nonce = undefined;
    await student.save();

    // Generate JWT
    const token = jwt.sign(
      { id: student._id, walletAddress: student.walletAddress },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "30d" }
    );

    res.status(200).json({
      success: true,
      token,
      student: {
        id: student._id,
        walletAddress: student.walletAddress,
        name: student.name
      }
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, error: "SERVER_ERROR" });
  }
});

module.exports = { getNonce, verifySignature };
