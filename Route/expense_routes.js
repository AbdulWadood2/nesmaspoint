const router = require("express").Router();
/* security */
const { verifyVender } = require("../utils/verifyToken_util");
/* controller */
const {
  addExpense,
  getAllExpences,
  editExpense,
  deleteExpense,
} = require("../controllers/expense_controller");
/* fileSystem */
// route /api/v1/expense/
// method POST
// privacy only verder do this
router.post("/", verifyVender, addExpense);
// route /api/v1/expense/
// method GET
// privacy only verder do this
router.get("/", verifyVender, getAllExpences);
// route /api/v1/expense/
// method PUT
// privacy only vendor can do this
router.put("/", verifyVender, editExpense);
// route /api/v1/expense/
// method DELETE
// privacy only vendor can do this
router.delete("/", verifyVender, deleteExpense);

module.exports = router;
