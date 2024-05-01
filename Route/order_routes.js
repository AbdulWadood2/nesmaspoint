// order_routes.js

const router = require("express").Router();
const {
  verifyVender,
  verifyBuyer,
  verifyTokenAndAdmin,
} = require("../utils/verifyToken_util");
const {
  createOrder,
  getAllOrders,
  updateOrder,
  getOrderHistory,
  getSpecificOrder,
  searchOrders,
} = require("../controllers/order_controller");

// API Route: POST /api/v1/order/
// Description: Create a new order
// Permission (only buyer can do this)
router.post("/", verifyBuyer, createOrder);

// API Route: GET /api/v1/order/
// Description: Get all orders for the authenticated vendor
// Permission (only vender can do this)
router.get("/", verifyVender, getAllOrders);

// API Route: PUT /api/v1/order/
// Description: Update a specific order by its ID
// Permission (only vender can do this)
router.put("/", verifyVender, updateOrder);

// API Route: GET /api/v1/order/orderHistory
// Description: get order history
// Permission (only buyer can do this)
router.get("/orderHistory", verifyBuyer, getOrderHistory);

// API Route: GET /api/v1/order/specificOrder
// Description: get a specific order by its ID
// Permission all can do this public
router.get("/specificOrder", getSpecificOrder);

router.get("/search", verifyVender, searchOrders);

module.exports = router;
