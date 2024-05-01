const mongoose = require("mongoose");
const customerNotification = new mongoose.Schema(
  {
    venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    debtorName: { type: String, required: true },
    debtorEmail: { type: String, required: true },
    debtorPhoneNumber: { type: String, required: true },
    venderBankName: { type: String, required: true },
    venderAccountName: { type: String, required: true },
    venderAccountNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("debtRemainder", customerNotification);
module.exports = data;
