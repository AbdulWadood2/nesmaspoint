const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshToken: [{ type: String, default: null }],
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, default: null },
  forgetPassword: { type: String, default: null },
  profileImage: { type: String, default: null },
  clientTimezone: { type: String, default: null },
});
const data = mongoose.model("buyer", userSchema);
module.exports = data;
