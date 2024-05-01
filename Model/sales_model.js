const mongoose = require("mongoose");
const saleSchema = new mongoose.Schema({
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productName: { type: String, required: true },
  customerName: { type: String, required: true },
  soldDate: { type: String, required: true },
  productPrice: { type: Number, required: true },
  shippingFee: { type: Number, required: true },
  discount: { type: Number, required: true },
  quantity: { type: Number, required: true },
  storePreferredCurrency: { type: String, required: true },
  payType: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Credit Card"],
  },
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, default: null },
});
const data = mongoose.model("sale", saleSchema);
module.exports = data;
