const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  refreshToken: [{ type: String, default: null }],
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, default: null },
  forgetPassword: { type: String, default: null },
  venderProfileImage: { type: String, default: null },
  language: { type: String, default: null },
  paystack_cust: { type: String, default: null },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  fcm_key: [{ type: String }],
});
const data = mongoose.model("vender", userSchema);
// data.dropIndex("companyName_1");
module.exports = data;
