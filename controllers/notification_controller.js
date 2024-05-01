// notification_controller.js

const { validateNotification } = require("../utils/joi_validator_util");
const Notification = require("../Model/notification_model");
const admin_model = require("../Model/admin_model");
const {
  successMessage,
  errorMessage,
  sendFCMNotification,
} = require("../functions/utility.functions");
const { isValidObjectId } = require("../functions/utility.functions");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/appError");

// API Method: POST
// API Route: /api/v1/notifications/
// Description: Create a new notification (admin)
// Permission: Admin only
const createNotification = async (req, res, next) => {
  try {
    const validationResult = validateNotification(req.body);
    if (validationResult.error) {
      // Handle validation errors
      return next(
        new AppError(validationResult.error, StatusCodes.INTERNAL_SERVER_ERROR)
      );
    } else {
      // Create the notification
      const notification = await Notification.create(validationResult.value);
      const data = {
        notification: {
          title: validationResult.value.text,
          body: validationResult.value.description,
        },
        data: {
          title: req.body.title,
          body: req.body.description,
        },
        to: "/topics/default",
      };

      await sendFCMNotification(data, process.env.fcmServerKey);
      // Respond with success message and the created notification
      return successMessage(
        StatusCodes.CREATED,
        res,
        "Notification created successfully",
        notification
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Method: PUT
// API Route: /api/v1/notifications/
// Description: Edit a specific notification by its ID (admin)
// Permission: Admin only
const editNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.query;
    const { text, description } = req.body;

    // Check if the notification ID is a valid ObjectId
    if (!isValidObjectId(notificationId)) {
      return next(
        new AppError(
          "You do not have a valid objectId for the notification",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Validate request body here if needed

    // Update the notification by its ID
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { text, description, dateModified: Date.now() },
      { new: true }
    );

    // Check if the notification exists
    if (!updatedNotification) {
      return next(
        new AppError("Notification not found", StatusCodes.NOT_FOUND)
      );
    }

    // Respond with success message and the updated notification
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Notification updated successfully",
      updatedNotification
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Method: DELETE
// API Route: /api/v1/notifications/
// Description: Soft delete a specific notification by its ID (admin)
// Permission: Admin only
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.query;

    // Check if the notification ID is a valid ObjectId
    if (!isValidObjectId(notificationId)) {
      return next(
        new AppError(
          "You do not have a valid objectId for the notification",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Soft delete the notification by its ID
    const deletedNotification = await Notification.findByIdAndDelete(
      notificationId
    );

    // Check if the notification exists
    if (!deletedNotification) {
      return next(
        new AppError("Notification not found", StatusCodes.NOT_FOUND)
      );
    }

    // Respond with success message and the soft deleted notification
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Notification deleted successfully",
      deletedNotification
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/notifications/
// Description: Get all notifications (all)
// Permission: only vender and admin both use it
const getAllNotifications = async (req, res, next) => {
  try {
    const admin = await admin_model.findById(req.user.id);
    let notifications;
    if (admin) {
      // Retrieve all notifications (excluding soft deleted) - sorted from new to old
      notifications = await Notification.find({ venderId: null }).sort({
        dateCreated: -1,
      });
    } else {
      // Retrieve all notifications (excluding soft deleted) - sorted from new to old
      notifications = await Notification.aggregate([
        {
          $match: {
            $or: [
              { dateCreated: { $gt: req.user.dateCreated } },
              { venderId: req.user.id },
            ],
          },
        },
        {
          $sort: { dateCreated: -1 },
        },
      ]);
    }
    // Respond with success and the list of notifications
    return successMessage(StatusCodes.ACCEPTED, res, null, notifications);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  createNotification,
  editNotification,
  deleteNotification,
  getAllNotifications,
};
