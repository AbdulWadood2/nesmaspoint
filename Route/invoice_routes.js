const router = require("express").Router();
/* security */
const { verifyVender } = require("../utils/verifyToken_util");
/* controller */
const {
  addInvoice,
  getAllInvoices,
  editInvoice,
  deleteInvoice
} = require("../controllers/invoice_controller");
/* fileSystem */
// route /api/v1/invoice/
// method POST
// @privacy only vender can do this
router.post("/", verifyVender, addInvoice);
// route /api/v1/invoice/
// method GET
// @privacy only vender can do this
router.get("/", verifyVender, getAllInvoices);
// route /api/v1/invoice/
// method PUT
// @privacy only vender can do this
router.put("/", verifyVender, editInvoice);
// route /api/v1/invoice/
// method DELETE
// @privacy only vender can do this
router.delete("/", verifyVender, deleteInvoice);

module.exports = router;
