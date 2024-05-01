const mongoose = require("mongoose");
const shareStore = new mongoose.Schema({
  venderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  category: {
    type: String,
    enum: ["store", "product"],
    default: "store",
  },
  link: {
    type: String,
    required: true,
  },
  dateCreated: { type: String, default: Date.now() },
});
const data = mongoose.model("shareStore", shareStore);
module.exports = data;
