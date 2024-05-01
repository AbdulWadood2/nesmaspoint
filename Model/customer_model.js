const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, default: null },
});
const data = mongoose.model("customer", userSchema);
module.exports = data;
