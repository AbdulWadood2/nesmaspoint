const express = require("express");
const {
  getShippingMethod,
  updateShippingMethod,
  shippingForBuyer,
} = require("../controllers/shipping_controller");

const { verifyVender, verifyBuyer } = require("../utils/verifyToken_util");

const shippingRoutes = express.Router();

// API Route: GET /api/v1/shipping/
// Permission (only vender can do this)
shippingRoutes.get("/", verifyVender, getShippingMethod);

// API Route: PUT /api/v1/shipping/
// Permission (only vender can do this)
shippingRoutes.put("/", verifyVender, updateShippingMethod);

// API Route: GET /api/v1/shipping/forBuyer
// Permission (only buyer can do this)
shippingRoutes.get("/forBuyer", verifyBuyer, shippingForBuyer);

module.exports = shippingRoutes;
