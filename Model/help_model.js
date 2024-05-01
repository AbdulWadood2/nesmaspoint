const mongoose = require("mongoose");
const helpSchema = new mongoose.Schema(
  {
    callPhoneNumber: { type: String, required: true },
    chatWhatsAppPhoneNumber: { type: String, required: true },
    contactEmail: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("help", helpSchema);
module.exports = data;
