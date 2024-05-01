const mongoose = require("mongoose");
const debtorSchema = new mongoose.Schema(
  {
    venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    image: { type: String, required: true },
    amount: { type: Number, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: Number, required: true, enum: [0, 1] }, // 0 newCustomer, 1 oldCustomer
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("debtor", debtorSchema);
module.exports = data;
