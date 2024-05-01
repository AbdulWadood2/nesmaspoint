/* errors */
const AppError = require("../utils/appError");
/* utility functions */
const {
  deleteFile,
  isValidObjectId,
  successMessage,
} = require("../functions/utility.functions");
/* statusCodes */
const { StatusCodes } = require("http-status-codes");
/* JOI */
const { incomeJoi, editIncomeJoi } = require("../utils/joi_validator_util");
/* models */
const income_model = require("../Model/income_model");
const store_model = require("../Model/store_model");
/* api controllers */
// route /api/v1/incomes/
// method POST
// @privacy only vender can do this
const incomeAdd = async (req, res, next) => {
  try {
    const { incomeTitle, incomeDate, incomeAmount, incomeDescription } =
      req.body;
    const result = incomeJoi(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const store = await store_model.findOne({ venderId: req.user.id });
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
    let income = await income_model.create({
      incomeTitle,
      incomeDate,
      incomeAmount,
      incomeDescription,
      venderId: req.user.id,
      storePreferredCurrency: store.storePreferredCurrency,
    });
    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "income succesfully created",
      income
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/incomes/
// method GET
// @privacy only vender can do this
const allIncome = async (req, res, next) => {
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

    let allIncomes = await income_model
      .find({ venderId })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Pagination information
    const totalCount = await income_model.countDocuments({ venderId });
    const totalPages = Math.ceil(totalCount / limit);

    const paginationInfo = {
      totalItems: totalCount,
      totalPages: totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      paginationInfo,
      allIncomes
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// route /api/v1/incomes/
// method PUT
// @privacy only vender can do this
const editIncome = async (req, res, next) => {
  try {
    const { incomeTitle, incomeDate, incomeAmount, incomeDescription } =
      req.body;
    const result = editIncomeJoi(req.body);

    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    const { incomeId } = req.query;

    let income = await income_model.findOneAndUpdate(
      { _id: incomeId, venderId: req.user.id },
      {
        $set: {
          incomeTitle,
          incomeDate,
          incomeAmount,
          incomeDescription,
          dateModified: Date.now(),
        },
      },
      { new: true }
    );

    if (!income) {
      return next(
        new AppError(
          "Income not found or you are not authorized to edit it",
          StatusCodes.NOT_FOUND
        )
      );
    }
    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Income successfully updated",
      income
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/incomes/
// method DELETE
// @privacy only vender can do this
const deleteIncome = async (req, res, next) => {
  try {
    const { incomeId } = req.query;

    const deletedIncome = await income_model.findOneAndDelete({
      _id: incomeId,
      venderId: req.user.id,
    });

    if (!deletedIncome) {
      return next(
        new AppError(
          "Income not found or you are not authorized to delete it",
          StatusCodes.NOT_FOUND
        )
      );
    }

    // Optionally, delete associated files or perform any cleanup here

    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Income successfully deleted",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = { incomeAdd, allIncome, editIncome, deleteIncome };
