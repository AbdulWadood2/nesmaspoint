const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema(
  {
    venderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    totalAmount: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("wallet", walletSchema);
module.exports = data;
