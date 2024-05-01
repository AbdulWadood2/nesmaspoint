const express = require("express");
const {
  register,
  login,
  forgetPassword,
  otpCheaker,
  getUserProfile,
  updateUserProfile,
  logout,
  makePaystack_custVender,
  analytics,
  deleteVender,
  loanApplication,
  cancelLoanApplication,
  getLoanApplications,
  getWallet,
  transaction,
  getTransactions,
  createDebtor,
  getDebtors,
  updateDebtor,
  deleteDebtor,
  sendLoanRemainderEmail,
  getSalesAndExpense,
} = require("../controllers/vender_controller");
const {
  refreshToken,
  verifyVender,
  otpValidation,
} = require("../utils/verifyToken_util");
const ROUTE = express.Router();

// API Route: POST /api/v1/vender/signup
// Permission (only vender can do this)
ROUTE.route("/signup").post(register);
// API Route: POST /api/v1/vender/login
// Permission (only vender can do this)
ROUTE.route("/login").post(login);
// API Route: POST /api/v1/vender/logout
// Permission (only vender can do this)
ROUTE.route("/logout").post(verifyVender, logout);
// API Route: GET /api/v1/vender/forgetPassword
// Permission (only vender can do this)
ROUTE.route("/forgetPassword").get(forgetPassword);
// API Route: POST /api/v1/vender/setPassword
// Permission (only vender can do this)
ROUTE.route("/setPassword").post(otpCheaker);
// API Route: get /api/v1/vender/otpValidation
// Permission (all can can do this)
ROUTE.route("/otpValidation").get(otpValidation);
// API Route: GET /api/v1/vender/refreshToken
// Permission (all can do this)
ROUTE.route("/refreshToken").get(refreshToken);

// New routes for user profile

// API Route: GET /api/v1/vender/profile
// Permission (only vender can do this)
ROUTE.route("/profile").get(verifyVender, getUserProfile);
// API Route: PUT /api/v1/vender/profile
// Permission (only vender can do this)
ROUTE.route("/profile").put(verifyVender, updateUserProfile);

// API Route: POST /api/v1/vender/makePaystack_custVender
// Permission (only vender can do this)
ROUTE.route("/makePaystack_custVender").post(
  verifyVender,
  makePaystack_custVender
);

ROUTE.route("/analytics").get(verifyVender, analytics);

// method delete
// API Route: POST /api/v1/vender/deleteAccount
// Permission (only vender can do this) with token
ROUTE.route("/deleteAccount").delete(verifyVender, deleteVender);

// method post
// API Route: POST /api/v1/vender/makeLoanApplication
// Permission (only vender can do this) with token
ROUTE.route("/makeLoanApplication").post(verifyVender, loanApplication);

// method put
// API Route: PUT /api/v1/vender/cancelLoanApplication
// Permission (only vender can do this) with token
// cancelLoanApplication
ROUTE.route("/cancelLoanApplication").put(verifyVender, cancelLoanApplication);

// method get
// API Route: PUT /api/v1/vender/loanApplications
// Permission (only vender can do this) with token
// get all loan application
ROUTE.route("/loanApplications").get(verifyVender, getLoanApplications);

// method get
// API Route: GET /api/v1 this) with token
// desc get wallet
ROUTE.route("/wallet").get(verifyVender, getWallet);

// method post
// API Route: POST /api/v1/vender/transaction
// Permission (only vender can do this) with token
ROUTE.route("/transaction").post(verifyVender, transaction);

// method get
// API Route: GET /api/v1/vender/transactions
// Permission (only vender can do this) with token
ROUTE.route("/transactions").get(verifyVender, getTransactions);

// method post
// API Route: POST /api/v1/vender/debtor
// Permission (only vender can do this) with token
ROUTE.route("/debtor").post(verifyVender, createDebtor);

// method get
// API Route: GET /api/v1/vender/debtor
// Permission (only vender can do this) with token
// get all debtors
ROUTE.route("/debtor").get(verifyVender, getDebtors);

// method put
// API Route: PUT /api/v1/vender/debtor
// Permission (only vender can do this) with token
// update debtor
ROUTE.route("/debtor").put(verifyVender, updateDebtor);

// method delete
// API Route: DELETE /api/v1/vender/debtor
// Permission (only vender can do this) with token
// delete debtor
ROUTE.route("/debtor").delete(verifyVender, deleteDebtor);

// method post
// API Route: POST /api/v1/vender/debtor/loanRemainderEmail
// Permission (only vender can do this) with token
// send loan remainder email
ROUTE.route("/debtor/loanRemainderEmail").post(
  verifyVender,
  sendLoanRemainderEmail
);

// method get
// Api Route  GET /api/v1/vender/expenseAndIncomes
// only vender can do this
ROUTE.route("/expenseAndIncomes").get(verifyVender, getSalesAndExpense);

module.exports = ROUTE;
