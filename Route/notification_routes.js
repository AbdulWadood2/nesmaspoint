// notification_routes.js

const router = require("express").Router();
const {
  verifyTokenAndAdmin,
  verifyVender,
  verifyAll,
} = require("../utils/verifyToken_util");
const {
  createNotification,
  editNotification,
  deleteNotification,
  getAllNotifications,
} = require("../controllers/notification_controller");

// API Route: POST /api/v1/notifications/
// Description: Create a new notification (admin)
// Permission: Admin only
router.post("/", verifyTokenAndAdmin, createNotification);

// API Route: PUT /api/v1/notifications/
// Description: Edit a specific notification by its ID (admin)
// Permission: Admin only
router.put("/", verifyTokenAndAdmin, editNotification);

// API Route: DELETE /api/v1/notifications/
// Description: Soft delete a specific notification by its ID (admin)
// Permission: Admin only
router.delete("/", verifyTokenAndAdmin, deleteNotification);

// API Route: GET /api/v1/notifications
// Description: Get all notifications (all)
// Permission: only vender and admin both use it
router.get("/", verifyAll, getAllNotifications);

module.exports = router;
