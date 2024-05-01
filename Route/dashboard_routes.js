const router = require("express").Router();
const {
  verifyVender,
  verifyTokenAndAdmin,
} = require("../utils/verifyToken_util");
const {
  getDashboardInfo,
  getUsers,
  deleteVender,
  inActiiveVender,
  searchVenders,
  topVenders,
} = require("../controllers/dashboard_controller");

// API Route: GET /api/v1/dashboard/
// Description: get dashbourd info
// Permission (only admin can do this)
router.get("/", verifyTokenAndAdmin, getDashboardInfo);

// API Route: GET /api/v1/dashboard/getVenders
// Description: get allVenders with advanced filters
// Permission (only admin can do this)
router.get("/getVenders", verifyTokenAndAdmin, getUsers);

// API Route: POST /api/v1/dashboard/venderDelete
// Description: 1) vender delete
// Description: 2) vender unDelete
// Permission (only admin can do this)
router.post("/venderDelete", verifyTokenAndAdmin, deleteVender);

// API Route: POST /api/v1/dashboard/venderActivate
// Description: 1) vender activate
// Description: 2) vender de activate
// Permission (only admin can do this)
router.post("/venderActivate", verifyTokenAndAdmin, inActiiveVender);

// API Route: GET /api/v1/dashboard/searchVenders
// Description: search venders
// Permission (only admin can do this)
router.post("/searchVenders", verifyTokenAndAdmin, searchVenders);

// API Route: Post /api/v1/dashboard/topVenders
// Description: get Top Venders
// Permission (only admin can do this)
router.get("/topVenders", verifyTokenAndAdmin, topVenders);

module.exports = router;
