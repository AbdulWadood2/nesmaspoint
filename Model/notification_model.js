// notification_model.js

const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  text: { type: String, required: true },
  description: { type: String, required: true },
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, default: null },
  venderId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
});

const Notification = mongoose.model("notification", notificationSchema);
module.exports = Notification;
