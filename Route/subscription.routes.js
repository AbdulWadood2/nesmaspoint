const router = require("express").Router();
const { verifyVender } = require("../utils/verifyToken_util");
const {
  createSubscription,
  removeSubscription,
  getCurrentSubscription,
} = require("../controllers/subscription_controller");

// API Route: POST /api/v1/subscription/
// Description: Add Subscription
// Permission (only vender can do this)
router.post("/", verifyVender, createSubscription);

// API Route: DELETE /api/v1/subscription/
// Description: remove Subscription
// Permission (only vender can do this)
router.delete("/", verifyVender, removeSubscription);

// API Route: GET /api/v1/subscription/
// Description: get the current
// Permission (only vender can do this)
router.get("/", verifyVender, getCurrentSubscription);

module.exports = router;
