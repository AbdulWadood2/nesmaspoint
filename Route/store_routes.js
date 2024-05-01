const router = require("express").Router();
/* security */
const { verifyBuyer, verifyVender } = require("../utils/verifyToken_util");
/* controller */
const {
  getStore,
  getMyStore,
  editStore,
} = require("../controllers/store_controller");
// API Route: POST /api/v1/store/
// Permission all can do this
router.get("/", getStore);
// API Route: POST /api/v1/store/getMyStore
// Permission (only vender can do this)
router.get("/getMyStore", verifyVender, getMyStore);
// API Route: PUT /api/v1/store/
// Permission (only vender can do this)
router.put("/", verifyVender, editStore);
module.exports = router;
