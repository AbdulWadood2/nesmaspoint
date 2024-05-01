const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productName: { type: String, required: true },
  productCostPrice: { type: Number, required: true },
  productSellingPrice: { type: Number, required: true },
  productQuantity: { type: Number, required: true },
  productDescription: { type: String, required: true },
  productImage: [{ type: String, required: true }],
  productDeleted: { type: Boolean, default: false },
  storePreferredCurrency: { type: String, required: true },
  published: { type: Boolean, required: true, enum: [true, false] },
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, default: null },
});
const data = mongoose.model("product", userSchema);
module.exports = data;
