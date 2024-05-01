const express = require("express");
const { storeShare } = require("../controllers/shareStore_controller");

const { verifyVender } = require("../utils/verifyToken_util");

const shareStore = express.Router();

// API Route: POST /api/v1/shareStore
// Description: api when share link
// Permission (only vender can do this)
shareStore.post("/", verifyVender, storeShare);

module.exports = shareStore;
