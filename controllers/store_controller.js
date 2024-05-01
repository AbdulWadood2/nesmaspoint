/* joi */
const { storeJoi } = require("../utils/joi_validator_util");
/* models */
const product_model = require("../Model/product_model");
const order_model = require("../Model/order_model");
const vender_model = require("../Model/vender_model");
const store_model = require("../Model/store_model");
const shipping_model = require("../Model/shippingMethod_Model");
const bankDetails_model = require("../Model/bankDetails_model");
/* statusCodes */
const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require("http-status-codes");
/* error */
const AppError = require("../utils/appError");
/* utility functions */
const {
  successMessage,
  s3bucket,
  extractImgUrlAllRecordAWS,
  generateSignedUrl,
} = require("../functions/utility.functions");
/* env */
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
// API Route: POST /api/v1/store/
// Permission all can do this
const getStore = async (req, res, next) => {
  try {
    const { storeName } = req.query;
    let store = await store_model.findOne({ storeName }).lean();
    if (store) {
      const vender = await vender_model.findById(store.venderId).lean();
      if (vender.isDeleted) {
        return next(
          new AppError(
            "this vender is deleted by admin",
            StatusCodes.BAD_REQUEST
          )
        );
      }
      if (!vender.isActive) {
        return next(
          new AppError(
            "this vender now unactivated by admin",
            StatusCodes.BAD_REQUEST
          )
        );
      }
      const venderProfileImage = await generateSignedUrl(
        vender.venderProfileImage
      );
      store = { ...store, venderProfileImage };
      const shippingMethod = await shipping_model.findOne({
        venderId: store.venderId,
      });
      const bankDetail = await bankDetails_model.findOne({
        venderId: vender._id,
      });
      return successMessage(StatusCodes.ACCEPTED, res, null, {
        store,
        shippingMethod: shippingMethod ? shippingMethod : null,
        bankDetail
      });
    } else {
      return next(
        new AppError("no store with this name", StatusCodes.BAD_REQUEST)
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: POST /api/v1/store/getMyStore
// Permission (only vender can do this)
const getMyStore = async (req, res, next) => {
  try {
    const myStore = await store_model.findOne({ venderId: req.user.id });
    if (myStore) {
      return successMessage(StatusCodes.ACCEPTED, res, null, {
        store: myStore,
      });
    } else {
      return next(
        new AppError("no store with this name", StatusCodes.BAD_REQUEST)
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: PUT /api/v1/store/
// Permission (only vender can do this)
const editStore = async (req, res, next) => {
  try {
    const {
      storeCompanyName,
      storeName,
      storePreferredCurrency,
      storeAbout,
      storeAddressDetails,
      storeCity,
      storeState,
      storeZipCode,
      storeCountry,
      storeStreet,
    } = req.body;

    const result = storeJoi(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    const store = await store_model.findOne({ venderId: req.user.id });

    // Check if the store with the provided storeName already exists
    if (storeName) {
      const existingStore = await store_model.findOne({
        storeName,
        _id: { $ne: store.id }, // Exclude the current store from the check
      });

      if (existingStore) {
        return next(
          new AppError(
            `Store with this storeName already exists`,
            StatusCodes.BAD_REQUEST
          )
        );
      }
    }

    const updatedStore = await store_model.findByIdAndUpdate(
      store.id,
      {
        $set: {
          storeCompanyName,
          storeName,
          storePreferredCurrency,
          storeAbout,
          storeAddressDetails,
          storeCity,
          storeState,
          storeZipCode,
          storeCountry,
          storeStreet,
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedStore) {
      return next(
        new AppError(`Error updating store`, StatusCodes.EXPECTATION_FAILED)
      );
    }

    successMessage(StatusCodes.OK, res, `Store updated successfully`, {
      updatedStore,
    });
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = { getStore, getMyStore, editStore };
