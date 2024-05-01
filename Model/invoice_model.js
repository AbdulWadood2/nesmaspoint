const mongoose = require("mongoose");
const invoiceSchema = new mongoose.Schema({
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  companylogo: { type: String, required: true },
  invoiceDate: { type: String, required: true },
  invoiceDueDate: { type: String, required: true },
  contactDetails: {
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  recipientDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  companyBankDetails: {
    bankName: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    accountName: { type: String, required: true },
  },
  products: [
    {
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      productPrice: { type: Number, required: true },
      tax: { type: Number, required: true },
      discount: { type: Number, required: true },
      shippingFee: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
    },
  ],
  storePreferredCurrency: { type: String, required: true },
}, {
  timestamps: true
});
const data = mongoose.model("invoice", invoiceSchema);
module.exports = data;
