const mongoose = require("mongoose");

const loanPackageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    intrustRate: { type: Number, required: true },
    amount: { type: Number, required: true },
    duration: { type: Number, required: true },
    durationType: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const LoanPackage = mongoose.model("LoanPackage", loanPackageSchema);

module.exports = LoanPackage;
