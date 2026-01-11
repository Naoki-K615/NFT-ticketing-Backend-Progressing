const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { success: false, error: "TOKEN_EXPIRED" };
    }
    if (error.name === "JsonWebTokenError") {
      return { success: false, error: "INVALID_TOKEN" };
    }
    return { success: false, error: "TOKEN_VERIFICATION_FAILED" };
  }
}

function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  JWT_SECRET
};
