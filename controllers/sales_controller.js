const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const {
  successMessage,
  isValidObjectId,
} = require("../functions/utility.functions");
const { StatusCodes } = require("http-status-codes");
const { saleJoi, editSaleJoi } = require("../utils/joi_validator_util");
const sales_model = require("../Model/sales_model");
const store_model = require("../Model/store_model");
// API Route: POST /api/v1/sales/
// Permission (only vendor can do this)
const addSales = async (req, res, next) => {
  try {
    const {
      productName,
      customerName,
      productPrice,
      shippingFee,
      discount,
      quantity,
      soldDate,
      payType,
    } = req.body;
    req.body.venderId = req.user.id;
    const result = saleJoi(req.body);
    const store = await store_model.findOne({ venderId: req.user.id });
    if (!store) {
      return next(
        new AppError(
          "store not found something went wroung",
          StatusCodes.EXPECTATION_FAILED
        )
      );
    }
    if (!store.storePreferredCurrency) {
      return next(
        new AppError(
          "plz provide the preferred currency in store for this action",
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    let sales = await sales_model.create({
      venderId: req.user.id,
      productName,
      customerName,
      soldDate,
      productPrice,
      shippingFee,
      discount,
      quantity,
      payType,
      storePreferredCurrency: store.storePreferredCurrency,
    });

    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Sales successfully created",
      sales
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/sales/
// Permission (only vendor can do this)
const getAllSales = async (req, res, next) => {
  try {
    const venderId = req.user.id;
    if (!isValidObjectId(venderId)) {
      return next(
        new AppError(
          `venderId is not a valid ObjectId`,
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Pagination
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortOptions = { dateCreated: -1 }; // Sort by dateCreated in descending order (new to old)

    let allSales = await sales_model
      .find({ venderId })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Pagination information
    const totalCount = await sales_model.countDocuments({ venderId });
    const totalPages = Math.ceil(totalCount / limit);

    const paginationInfo = {
      totalItems: totalCount,
      totalPages: totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
    return successMessage(StatusCodes.ACCEPTED, res, paginationInfo, allSales);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: PUT /api/v1/sales/
// Permission (only vender can do this)
const editSales = async (req, res, next) => {
  try {
    const { id } = req.query;
    const {
      productName,
      customerName,
      soldDate,
      productPrice,
      shippingFee,
      discount,
      quantity,
      payType,
    } = req.body;

    const result = editSaleJoi(req.body);

    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Find and update the sales record
    let updatedSales = await sales_model.findByIdAndUpdate(
      id,
      {
        productName,
        customerName,
        soldDate,
        productPrice,
        shippingFee,
        discount,
        quantity,
        payType,
        dateModified: Date.now(),
      },
      { new: true, runValidators: true }
    );

    // Check if the sales record exists
    if (!updatedSales) {
      return next(
        new AppError("Sales record not found", StatusCodes.NOT_FOUND)
      );
    }
    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Sales record successfully updated",
      updatedSales
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: DELETE /api/v1/sales/
// Permission (only vendor can do this)
const deleteSales = async (req, res, next) => {
  try {
    const { id } = req.query;

    const sales = await sales_model.findByIdAndDelete(id);

    // Check if the sales record exists
    if (!sales) {
      return next(
        new AppError("Sales record not found", StatusCodes.NOT_FOUND)
      );
    }

    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Sales record successfully deleted",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  addSales,
  getAllSales,
  editSales,
  deleteSales,
};
