const mongoose = require("mongoose");
const inventoryProductSchema = new mongoose.Schema(
  {
    venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true },
    productCostPrice: { type: Number, required: true },
    productSellingPrice: { type: Number, required: true },
    productQuantity: { type: Number, required: true },
    productDescription: { type: String, required: true },
    productImage: [{ type: String, required: true }],
    storePreferredCurrency: { type: String, required: true },
    unit: { type: String, enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, // 0=Pc 1=Kg 2=G 3=Carton 4=Pack 5=Box 6=Yard 7=Plate 8=Bottle 9=Can 10=Pair 11=Bag
    productsSoldQuantity: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("inventoryProduct", inventoryProductSchema);
module.exports = data;
