const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  venderId: { type: mongoose.Schema.Types.ObjectId, unique: true },
  storeCompanyName: { type: String, required: true },
  storeName: {
    type: String,
    required: true,
    unique: true,
  },
  storePreferredCurrency: {
    type: String,
    default: "Nigerian Naira",
    enum: ["Nigerian Naira"],
  },
  storeAbout: { type: String, default: null },
  storeAddressDetails: { type: String, default: null },
  storeCity: { type: String, default: null },
  storeState: { type: String, default: null },
  storeZipCode: { type: Number, default: null },
  storeCountry: { type: String, default: null },
  storeStreet: { type: String, default: null },
});

const data = mongoose.model("store", storeSchema);

module.exports = data;
