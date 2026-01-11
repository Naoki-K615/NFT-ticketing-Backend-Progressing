const { verifyToken } = require("../config/jwt");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "NO_AUTHORIZATION_HEADER"
    });
  }
  
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "INVALID_TOKEN_FORMAT"
    });
  }
  
  const token = authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "NO_TOKEN_PROVIDED"
    });
  }
  
  const result = verifyToken(token);
  
  if (!result.success) {
    return res.status(401).json({
      success: false,
      error: result.error
    });
  }
  
  req.user = result.decoded;
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  
  const token = authHeader.split(" ")[1];
  const result = verifyToken(token);
  
  if (result.success) {
    req.user = result.decoded;
  }
  
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth
};
