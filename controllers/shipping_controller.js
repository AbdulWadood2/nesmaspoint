const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/appError");
const successMessage = require("../functions/utility.functions").successMessage;

const Shipping = require("../Model/shippingMethod_Model");
const store_model = require("../Model/store_model");

// API Route: GET /api/v1/shipping/
// Permission (only vender can do this)
const getShippingMethod = async (req, res, next) => {
  try {
    let [shippingMethod, store] = await Promise.all([
      Shipping.findOne({ venderId: req.user.id }),
      store_model.findOne({ venderId: req.user.id }),
    ]);
    if (!shippingMethod) {
      return next(
        new AppError("Shipping method not found", StatusCodes.NOT_FOUND)
      );
    }
    if (!store) {
      return next(new AppError("store not exists", StatusCodes.NOT_FOUND));
    }
    if (!store.storePreferredCurrency) {
      return next(
        new AppError(
          "plz add store preffered currency in store",
          StatusCodes.NOT_FOUND
        )
      );
    }
    shippingMethod = JSON.parse(JSON.stringify(shippingMethod));
    shippingMethod = {
      ...shippingMethod,
      storePreferredCurrency: store.storePreferredCurrency,
    };
    return successMessage(
      StatusCodes.OK,
      res,
      "Shipping method retrieved successfully",
      shippingMethod
    );
  } catch (error) {
    return next(new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: PUT /api/v1/shipping/
// Permission (only vender can do this)
const updateShippingMethod = async (req, res, next) => {
  try {
    const shipping = await Shipping.findOne({ venderId: req.user.id });
    const {
      fixedShippingFee,
      fixedShippingDescription,
      freeShippingDescription,
    } = req.body;

    const updatedShippingMethod = await Shipping.findByIdAndUpdate(
      shipping.id,
      {
        fixedShippingFee,
        fixedShippingDescription,
        freeShippingDescription,
      },
      { new: true, runValidators: true }
    );

    if (!updatedShippingMethod) {
      return next(
        new AppError("Shipping method not found", StatusCodes.NOT_FOUND)
      );
    }

    return successMessage(
      StatusCodes.OK,
      res,
      "Shipping method updated successfully",
      updatedShippingMethod
    );
  } catch (error) {
    return next(new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/shipping/forBuyer
// Permission (only buyer can do this)
const shippingForBuyer = async (req, res, next) => {
  try {
    const { venderId } = req.query;
    if (!venderId) {
      return next(
        new AppError("plz give venderId in req", StatusCodes.BAD_REQUEST)
      );
    }
    let [shipping, store] = await Promise.all([
      Shipping.findOne({ venderId }).select(
        "-fixedShippingDescription -freeShippingDescription"
      ),
      store_model.findOne({ venderId }),
    ]);
    if (!shipping) {
      return next(
        new AppError("not shipping with this vender", StatusCodes.BAD_REQUEST)
      );
    }
    if (!store) {
      return next(
        new AppError("not store with this vender", StatusCodes.NOT_FOUND)
      );
    }
    shipping = JSON.parse(JSON.stringify(shipping));
    shipping = {
      ...shipping,
      storePreferredCurrency: store.storePreferredCurrency,
    };
    return successMessage(StatusCodes.ACCEPTED, res, null, shipping);
  } catch (error) {
    return next(new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  getShippingMethod,
  updateShippingMethod,
  shippingForBuyer,
};
