const mongoose = require("mongoose");
const subscription = new mongoose.Schema({
  venderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  currentPackage: {
    planName: { type: String },
    planPrice: { type: String },
    duration: { type: String },
    expirationDate: { type: Number },
    subscriptionDate: { type: String },
    expirationAlert: { type: Boolean, default: false },
  },
  subscriptionHistory: [
    {
      planName: { type: String },
      planPrice: { type: String },
      duration: { type: String },
      expirationDate: { type: Number },
      subscriptionDate: { type: String },
      expirationAlert: { type: Boolean },
      subscriptionEnd: { type: String, required: true },
      resonEnd: { type: String, required: true },
    },
  ],
});
const data = mongoose.model("subscription", subscription);
module.exports = data;
