const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  cart: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, required: true },
      orderQuantity: { type: Number, required: true },
      productImage: [{ type: String, required: true }],
      productName: { type: String, required: true },
      productPrice: { type: Number, required: true },
    },
  ],
  orderSubTotal: { type: Number, required: true },
  orderDisCount: { type: Number, default: null },
  orderFixedShippingFee: { type: Number, default: null },
  orderCustomerPickUp: { type: Boolean, default: false, enum: [true, false] },
  totalAmount: { type: Number, required: true },
  clientContactDetails: {
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhoneNumber: { type: String, required: true },
    clientAddress: { type: String, required: true },
  },
  clientNote: { type: String, required: true },
  paymentReceiptImg: { type: String, required: true },
  orderStatus: {
    type: String,
    required: true,
    enum: ["Pending", "Shipped", "Completed", "Cancelled"],
    default: "Pending",
  },
  paid: { type: Boolean, enum: [true, false], default: true },
  storePreferredCurrency: { type: String, required: true },
  orderCreated: { type: String, default: Date.now() },
  orderModified: { type: String, default: null },
});
// Middleware to check enum validity during update
userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const newOrderStatus = update.orderStatus;

  if (
    newOrderStatus &&
    !userSchema.path("orderStatus").enumValues.includes(newOrderStatus)
  ) {
    return next(new Error("Invalid orderStatus value for update."));
  }

  next();
});

const data = mongoose.model("order", userSchema);
module.exports = data;
