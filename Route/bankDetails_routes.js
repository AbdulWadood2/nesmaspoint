// bankDetails_routes.js

const router = require("express").Router();
const {
  verifyVender,
  verifyTokenAndAdmin,
  verifyBuyer,
} = require("../utils/verifyToken_util");
const {
  createOrUpdateBankDetails,
  getVendersBankDetails,
  getBankDetailsByVender,
} = require("../controllers/bankDetails_controller");

// API Route: POST /api/v1/bankDetail
// Description: Create or update bank details for the authenticated vendor
// Permission: Vender only
router.post("/", verifyVender, createOrUpdateBankDetails);
// API Route: PUT /api/v1/bankDetail
// Description: update bank details for the authenticated vendor
// Permission: Vender only
router.put("/", verifyVender, createOrUpdateBankDetails);

// API Route: get /api/v1/bankDetail
// Description: get bank detail only by vender
// Permission: Vender only
router.get("/", verifyVender, getBankDetailsByVender);

// API Route: GET /api/v1/bankDetail/admin
// Description: Get bank details for all vendors
// Permission: admin  can do that
router.get("/admin", verifyTokenAndAdmin, getVendersBankDetails);
// API Route: GET /api/v1/bankDetail/buyer
// Description: Get bank details for all vendors
// Permission:  buyer can do that
router.get("/buyer", verifyBuyer, getVendersBankDetails);

module.exports = router;
