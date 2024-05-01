const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    customerImage: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    status: { type: Number, required: true, enum: [0, 1] }, // 0 newCustomer, 1 oldCustomer
    email: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("customerCreated", userSchema);
module.exports = data;
