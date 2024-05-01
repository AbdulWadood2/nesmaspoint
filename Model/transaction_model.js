const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
  {
    venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    transactionType: {
      type: Number,
      required: true,
      enum: [0, 1],
    }, // 0 received, 1 subscription purchase
    transactionFrom: { type: String, required: true },
    transactionStatus: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("transaction", transactionSchema);
module.exports = data;
