const mongoose = require("mongoose");
const saleSchema = new mongoose.Schema({
  venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  expenseTitle: { type: String, required: true },
  expenseDate: { type: String, required: true },
  expenseAmount: { type: Number, required: true },
  expenseDescription: { type: String, required: true },
  dateCreated: { type: String, default: Date.now() },
  dateModified: { type: String, default: null },
  storePreferredCurrency: { type: String, required: true },
});
const data = mongoose.model("expense", saleSchema);
module.exports = data;
