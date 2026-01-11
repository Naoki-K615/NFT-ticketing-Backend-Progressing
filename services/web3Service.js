// fixed file: services/web3Service.js

const { ethers } = require("ethers");
const { v4: uuidv4 } = require("uuid");

const nonceStore = new Map();

const NONCE_EXPIRY_MS = 5 * 60 * 1000;

function generateNonce(walletAddress) {
  const address = walletAddress.toLowerCase();
  const nonce = uuidv4();
  const expiresAt = Date.now() + NONCE_EXPIRY_MS;
  
  nonceStore.set(address, { nonce, expiresAt });
  
  return nonce;
}

function getNonce(walletAddress) {
  const address = walletAddress.toLowerCase();
  const data = nonceStore.get(address);
  
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    nonceStore.delete(address);
    return null;
  }
  
  return data.nonce;
}

function verifySignature(walletAddress, nonce, signature) {
  try {
    const address = walletAddress.toLowerCase();
    const storedNonce = getNonce(address);
    
    if (!storedNonce || storedNonce !== nonce) {
      return { success: false, error: "INVALID_OR_EXPIRED_NONCE" };
    }
    
    const message = `Sign this message to authenticate with NFT Ticketing.\n\nNonce: ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address) {
      return { success: false, error: "SIGNATURE_MISMATCH" };
    }
    
    nonceStore.delete(address);
    
    return { success: true, address: recoveredAddress };
  } catch (error) {
    console.error("Signature verification error:", error);
    return { success: false, error: "VERIFICATION_FAILED" };
  }
}

function createSignMessage(nonce) {
  return `Sign this message to authenticate with NFT Ticketing.\n\nNonce: ${nonce}`;
}

module.exports = {
  generateNonce,
  getNonce,
  verifySignature,
  createSignMessage
};
