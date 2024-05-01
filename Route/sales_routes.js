const express = require("express");
const {
  addSales,
  getAllSales,
  editSales,
  deleteSales,
} = require("../controllers/sales_controller");
const ROUTE = express.Router();
const { verifyVender } = require("../utils/verifyToken_util");

// API Route: POST /api/v1/sales/
// Permission (only vender can do this)
ROUTE.route("/").post(verifyVender, addSales);
// API Route: GET /api/v1/sales/
// Permission (only vender can do this)
ROUTE.route("/").get(verifyVender, getAllSales);
// API Route: PUT /api/v1/sales/
// Permission (only vender can do this)
ROUTE.route("/").put(verifyVender, editSales);
// API Route: DELETE /api/v1/sales/
// Permission (only vender can do this)
ROUTE.route("/").delete(verifyVender, deleteSales);

module.exports = ROUTE;
