const mongoose = require("mongoose");
const customerNotification = new mongoose.Schema(
  {
    venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdCustomerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("customerNotification", customerNotification);
module.exports = data;
