const mongoose = require("mongoose");

// Define the TermAndConditions model schema
const TermAndConditionsSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create the TermAndConditions model using the schema
const TermAndConditionsModel = mongoose.model(
  "TermAndConditions",
  TermAndConditionsSchema
);

// Export the TermAndConditions model
module.exports = TermAndConditionsModel;
