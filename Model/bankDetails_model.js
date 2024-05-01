const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  venderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  bankName: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: Number, required: true },
  dateCreated: { type: String, required: true, default: Date.now() },
  dateModified: { type: String, default: null },
});

const Notification = mongoose.model("bankDetail", notificationSchema);
module.exports = Notification;
