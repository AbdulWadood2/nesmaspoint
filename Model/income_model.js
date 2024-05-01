const mongoose = require("mongoose");
const saleSchema = new mongoose.Schema({
  incomeTitle: { type: String, required: true },
  incomeDate: { type: String, required: true },
  incomeAmount: { type: Number, required: true },
  incomeDescription: { type: String, required: true },
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  storePreferredCurrency: { type: String, required: true },
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, deafult: null },
});
const data = mongoose.model("income", saleSchema);
module.exports = data;
