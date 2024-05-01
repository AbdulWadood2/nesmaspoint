const express = require("express");
const { incomeAdd, allIncome, editIncome, deleteIncome } = require("../controllers/income_controller");
const ROUTE = express.Router();
const { verifyVender } = require("../utils/verifyToken_util");

// route /api/v1/incomes/
// method POST
// @privacy only vender can do this
ROUTE.route("/").post(verifyVender, incomeAdd);
// route /api/v1/incomes/
// method GET
// @privacy only vender can do this
ROUTE.route("/").get(verifyVender, allIncome);
// route /api/v1/incomes/
// method PUT
// @privacy only vender can do this
ROUTE.route("/").put(verifyVender, editIncome);
// route /api/v1/incomes/
// method DELETE
// @privacy only vender can do this
ROUTE.route("/").delete(verifyVender, deleteIncome);

module.exports = ROUTE;
