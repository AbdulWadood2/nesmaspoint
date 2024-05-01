const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema(
  {
    venderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    loanPackageId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nin: { type: String, required: true },
    businessName: { type: String, required: true },
    businessRegistrationNumber: { type: String, default: null },
    businessAddress: { type: String, required: true },
    businessSector: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    loanAmount: { type: Number, required: true },
    status: { type: Number, default: 0, enum: [0, 1, 2, 3] },
    // 0 pendind, 1 approved, 2 rejected 3 credited
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const LoanApplication = mongoose.model(
  "LoanApplication",
  loanApplicationSchema
);

module.exports = LoanApplication;
