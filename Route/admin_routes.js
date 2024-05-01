const express = require("express");
const {
  login,
  logout,
  forgetPassword,
  otpCheaker,
  getUserProfile,
  updateUserProfile,
  makeLoanPackage,
  getLoanPackages,
  getLoanApplications,
  editLoanApplication,
  deleteLoanPackage,
  createUpdateTermAndConditions,
  getTermAndConditions,
  createUpdateHelp,
  getHelp,
  editLoanPackage,
} = require("../controllers/admin_controller");
const {
  refreshToken,
  verifyTokenAndAdmin,
  otpValidation,
  refreshTokenForAdmin,
  verifyAll,
} = require("../utils/verifyToken_util");
const ROUTE = express.Router();
// method POST
// route /api/v1/admin/login
// privacy only admin can do this
ROUTE.route("/").post(login);
// method POST
// route /api/v1/admin/logout
// privacy only specific admin can do this
ROUTE.route("/logout").post(verifyTokenAndAdmin, logout);
// method GET
// route /api/v1/admin/forgetPassword
// privacy only admin can do this
// @details generate send otp
ROUTE.route("/forgetPassword").get(forgetPassword);
// method POST
// route /api/v1/admin/setPassword
// privacy only admin can do this
// @details check otp then change password
ROUTE.route("/setPassword").post(otpCheaker);
// API Route: get /api/v1/admin/otpValidation
// Permission (all can can do this)
ROUTE.route("/otpValidation").get(otpValidation);
// method GET
// route /api/v1/admin/refreshToken
// @privacy all can do this by their valid token
ROUTE.route("/refreshToken").get(refreshTokenForAdmin);
// method GET
// route /api/v1/admin/userProfile
// @privacy only admin can do this
// @detail get profile
ROUTE.route("/userProfile").get(verifyTokenAndAdmin, getUserProfile);
// method PUT
// route /api/v1/admin/userProfile
// @privacy only admin can do this
// @detail edit profile
ROUTE.route("/userProfile").put(verifyTokenAndAdmin, updateUserProfile);

// method POST
// route /api/v1/admin/loanPackage
// privacy only admin can do this
// @details create loan package
ROUTE.route("/loanPackage").post(verifyTokenAndAdmin, makeLoanPackage);

// method GET
// route /api/v1/admin/loanPackage
// privacy all can do this
// @details get all loan package
// @access public
ROUTE.route("/loanPackage").get(verifyAll, getLoanPackages);

// method delete
// route /api/v1/admin/loanPackage
// privacy only admin can do this
ROUTE.route("/loanPackage").delete(verifyTokenAndAdmin, deleteLoanPackage);

// method put
// route /api/v1/admin/loanPackage
// privacy only admin can do this
ROUTE.route("/loanPackage").put(verifyTokenAndAdmin, editLoanPackage);

// method GET
// route /api/v1/admin/loanApplications
// privacy admin can do this only
ROUTE.route("/loanApplications").get(verifyTokenAndAdmin, getLoanApplications);

// method PUT
// route /api/v1/admin/loanApplication
// privacy admin can do this only
ROUTE.route("/loanApplication").put(verifyTokenAndAdmin, editLoanApplication);

// method post
// route /api/v1/admin/termsAndConditions
// privacy only admin can do this
// @details create terms and conditions
ROUTE.route("/termsAndConditions").post(
  verifyTokenAndAdmin,
  createUpdateTermAndConditions
);

// method GET
// route /api/v1/admin/termsAndConditions
// privacy all can do this
// @details get terms and conditions
ROUTE.route("/termsAndConditions").get(verifyAll, getTermAndConditions);

// method POST
// route /api/v1/admin/help
// privacy admin can do this only
// description create or update help
ROUTE.route("/help").post(verifyTokenAndAdmin, createUpdateHelp);

// method GET
// route /api/v1/admin/help
// privacy all can do this
// description get help
ROUTE.route("/help").get(verifyAll, getHelp);

module.exports = ROUTE;
