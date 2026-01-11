const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/tokenController");

router.post("/verify", verifyToken);

module.exports = router;
