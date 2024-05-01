const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fixedShippingFee: { type: Number, default: 0 },
  fixedShippingDescription: { type: String, default: null },
  freeShippingDescription: { type: String, default: null },
});
const data = mongoose.model("shipping", userSchema);
module.exports = data;
