const express = require("express");
const ROUTE = express.Router();
/* controllers */
const {
  allCustomer,
  addCustomer,
  makeCustomerByVender,
  updateCustomerByVender,
  deleteCustomerByVender,
  allCreatedCustomerByVender,
  sendNotificationToAllCustomers,
} = require("../controllers/customer_controller");
/* verification */
const { verifyVender, verifyBuyer } = require("../utils/verifyToken_util");

// route /api/v1/customers/
// method GET
// @privacy only vender can do this
ROUTE.route("/").get(verifyVender, allCustomer);
// route /api/v1/customers/
// method POSt
// @privacy only buyer can do this
ROUTE.route("/").post(verifyBuyer, addCustomer);

// route /api/v1/customers/makeByVender
// method POST
// @privacy only vender can do this
ROUTE.route("/makeByVender").post(verifyVender, makeCustomerByVender);

// route /api/v1/customers/makeByVender
// method PUT
// @privacy only vender can do this
ROUTE.route("/makeByVender").put(verifyVender, updateCustomerByVender);

// route /api/v1/customers/makeByVender
// method DELETE
// @privacy only vender can do this
ROUTE.route("/makeByVender").delete(verifyVender, deleteCustomerByVender);

// route /api/v1/customers/makeByVender
// method GET
// @privacy only vender can do this
ROUTE.route("/makeByVender").get(verifyVender, allCreatedCustomerByVender);

// route /api/v1/customers/makeByVender/notification
// method post
// @privacy only vender can do this
ROUTE.route("/makeByVender/notification").post(
  verifyVender,
  sendNotificationToAllCustomers
);

module.exports = ROUTE;
