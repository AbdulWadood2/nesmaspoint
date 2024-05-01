const express = require("express");
const {
  register,
  login,
  forgetPassword,
  otpCheaker,
  logout,
  updateBuyerProfile,
  getProfile,
} = require("../controllers/buyer_controller");
const {
  refreshToken,
  verifyBuyer,
  refreshTokenForBuyer,
  otpValidation,
} = require("../utils/verifyToken_util");
const ROUTE = express.Router();

// route /api/v1/buyer/signup
// method POST
// @privacy only buyer can do this
ROUTE.route("/signup").post(register);
// route /api/v1/buyer/login
// method POST
// @privacy only buyer can do this
ROUTE.route("/login").post(login);
// route /api/v1/buyer/getProfile
// method get
// @privacy only buyer can do this
ROUTE.route("/getProfile").get(verifyBuyer, getProfile);
// route /api/v1/buyer/logout
// method POST
// @privacy only buyer can do this
ROUTE.route("/logout").post(logout);
// route /api/v1/buyer/forgetPassword
// method GET
// @privacy only buyer can do this
ROUTE.route("/forgetPassword").get(forgetPassword);
// route /api/v1/buyer/setPassword
// method GET
// @privacy only buyer can do this
ROUTE.route("/setPassword").post(otpCheaker);
// API Route: get /api/v1/buyer/otpValidation
// Permission (all can can do this)
ROUTE.route("/otpValidation").get(otpValidation);
// route /api/v1/buyer/refreshToken
// method GET
// @privacy all do this but with their valid token
ROUTE.route("/refreshToken").get(refreshTokenForBuyer);
// API Route: PUT /api/v1/buyer/profile
// Permission (only buyer can do this)
ROUTE.route("/profile").put(verifyBuyer, updateBuyerProfile);
module.exports = ROUTE;
