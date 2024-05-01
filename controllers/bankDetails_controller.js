// bankDetails_controller.js

const BankDetail = require("../Model/bankDetails_model");
const {
  successMessage,
  errorMessage,
} = require("../functions/utility.functions");
const { isValidObjectId } = require("../functions/utility.functions");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/appError");
const { validateBankDetails } = require("../utils/joi_validator_util");

// API Method: POST
// API Route: /api/v1/bankDetail
// Description: Create or update bank details for the authenticated vendor
// Permission: Vender only
const createOrUpdateBankDetails = async (req, res, next) => {
  try {
    // Get the vender ID from the authenticated user
    const venderId = req.user.id;
    // Check if the vender ID is a valid ObjectId
    if (!isValidObjectId(venderId)) {
      return next(
        new AppError(
          "You do not have a valid objectId for the vender",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // joi validation
    const validationResult = validateBankDetails(req.body);

    if (validationResult.error) {
      // Handle validation errors
      return next(
        new AppError(validationResult.error, StatusCodes.BAD_REQUEST)
      );
    } else {
      // Check if bank details already exist for the vender
      let bankDetail = await BankDetail.findOne({ venderId });

      // If bank details don't exist, create a new record
      if (!bankDetail) {
        const newBankDetail = {
          ...validationResult.value,
          venderId,
          dateCreated: Date.now(),
        };

        bankDetail = await BankDetail.create(newBankDetail);

        // Respond with success message and the created bank detail
        return successMessage(
          StatusCodes.CREATED,
          res,
          "Bank details created successfully",
          bankDetail
        );
      }

      // If bank details exist, update the existing record
      bankDetail.set({
        ...validationResult.value,
        dateModified: Date.now(),
      });

      const updatedBankDetail = await bankDetail.save();

      // Respond with success message and the updated bank detail
      return successMessage(
        StatusCodes.ACCEPTED,
        res,
        "Bank details updated successfully",
        updatedBankDetail
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: PUT /api/v1/bankDetail
// Description: update bank details for the authenticated vendor
// Permission: Vender only
const editBankDetails = async (req, res, next) => {
  try {
    // Get the vendor ID from the authenticated user
    const venderId = req.user.id;

    // Check if the vendor ID is a valid ObjectId
    if (!isValidObjectId(venderId)) {
      return next(
        new AppError(
          "You do not have a valid objectId for the vendor",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Validate the incoming bank details
    const validationResult = validateBankDetails(req.body);

    if (validationResult.error) {
      // Handle validation errors
      return next(
        new AppError(validationResult.error, StatusCodes.BAD_REQUEST)
      );
    }

    // Check if bank details already exist for the vendor
    let bankDetail = await BankDetail.findOne({ venderId });

    if (!bankDetail) {
      // If bank details don't exist, create a new record
      const newBankDetail = {
        ...validationResult.value,
        venderId,
        dateModified: Date.now(),
      };

      bankDetail = await BankDetail.create(newBankDetail);

      // Respond with success message and the created bank detail
      return successMessage(
        StatusCodes.CREATED,
        res,
        "Bank details created successfully",
        bankDetail
      );
    }

    // If bank details exist, update the existing record
    bankDetail.set({
      ...validationResult.value,
      dateModified: Date.now(),
    });

    const updatedBankDetail = await bankDetail.save();

    // Respond with success message and the updated bank detail
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Bank details updated successfully",
      updatedBankDetail
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Method: POST
// API Route: /api/v1/bankDetail
// Description: get bank detail only by vender
// Permission: Vender only
const getBankDetailsByVender = async (req, res, next) => {
  try {
    const venderId = req.user.id;
    const bankDetails = await BankDetail.findOne({ venderId });
    if (!bankDetails) {
      return successMessage(
        StatusCodes.ACCEPTED,
        res,
        "plz enter your bank account details",
        null
      );
    }
    return successMessage(StatusCodes.ACCEPTED, res, null, bankDetails);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Method: GET
// API Route: /api/v1/bankDetail
// Description: Get bank details for all vendors
// Permission: all
const getVendersBankDetails = async (req, res, next) => {
  try {
    const { venderId } = req.query;
    if (!venderId) {
      return next(new AppError("venderId is missing", StatusCodes.BAD_REQUEST));
    }
    // Retrieve all bank details for all vendors
    const bankDetails = await BankDetail.findOne({ venderId });
    if (!bankDetails) {
      return next(
        new AppError(
          "this vender not added the bank details",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!bankDetails.bankName) {
      return next(
        new AppError(
          "this vender not added the bankName",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!bankDetails.accountName) {
      return next(
        new AppError(
          "this vender not added the accountName",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!bankDetails.accountNumber) {
      return next(
        new AppError(
          "this vender not added the accountNumber",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Respond with success and the list of bank details
    return successMessage(StatusCodes.ACCEPTED, res, null, bankDetails);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  createOrUpdateBankDetails,
  editBankDetails,
  getVendersBankDetails,
  getBankDetailsByVender,
};
