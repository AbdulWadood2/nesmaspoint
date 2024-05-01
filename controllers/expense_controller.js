const expense_model = require("../Model/expense_model");
const store_model = require("../Model/store_model");
const vender_model = require("../Model/vender_model");
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
  isValidObjectId,
} = require("../functions/utility.functions");
/* joi */
const { expenseJoi, editExpenseJoi } = require("../utils/joi_validator_util");
/* fs */
const fs = require("fs");
// route /api/v1/expense/
// method POST
// privacy only verder do this
const addExpense = async (req, res, next) => {
  try {
    const { expenseTitle, expenseDate, expenseAmount, expenseDescription } =
      req.body;
    req.body.venderId = req.user.id;
    const result = expenseJoi(req.body);
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
    if (!store) {
      return next(new AppError("plz make store first", StatusCodes.NOT_FOUND));
    }
    if (!store.storePreferredCurrency) {
      return next(
        new AppError(
          "plz provide store prefered currency in store for make expense",
          StatusCodes.NOT_FOUND
        )
      );
    }
    let expense = await expense_model.create({
      venderId: req.user.id,
      expenseTitle,
      expenseDate,
      expenseAmount,
      expenseDescription,
      dateCreated: Date.now(),
      storePreferredCurrency: store.storePreferredCurrency,
    });
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "expense is created",
      expense
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/expense/
// method GET
// privacy only verder do this
const getAllExpences = async (req, res, next) => {
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

    const totalCount = await expense_model.countDocuments({ venderId });
    const totalPages = Math.ceil(totalCount / limit);

    let allExpenses = await expense_model
      .find({ venderId })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

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
      allExpenses
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// route /api/v1/expense/
// method PUT
// privacy only vendor can do this
const editExpense = async (req, res, next) => {
  try {
    const { expenseTitle, expenseDate, expenseAmount, expenseDescription } =
      req.body;
    const expenseId = req.query.expenseId; // Using req.query for expenseId

    const result = editExpenseJoi(req.body);

    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    const expense = await expense_model.findOneAndUpdate(
      { _id: expenseId, venderId: req.user.id },
      {
        $set: {
          expenseTitle,
          expenseDate,
          expenseAmount,
          expenseDescription,
          dateModified: Date.now(),
        },
      },
      { new: true }
    );

    if (!expense) {
      return next(
        new AppError(
          "Expense not found or you are not authorized to edit it",
          StatusCodes.NOT_FOUND
        )
      );
    }

    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Expense successfully updated",
      expense
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/expense/
// method DELETE
// privacy only vendor can do this
const deleteExpense = async (req, res, next) => {
  try {
    const expenseId = req.query.expenseId; // Using req.query for expenseId

    const deletedExpense = await expense_model.findOneAndDelete({
      _id: expenseId,
      venderId: req.user.id,
    });

    if (!deletedExpense) {
      return next(
        new AppError(
          "Expense not found or you are not authorized to delete it",
          StatusCodes.NOT_FOUND
        )
      );
    }

    // Optionally, delete associated files or perform any cleanup here

    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Expense successfully deleted",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = { addExpense, getAllExpences, editExpense, deleteExpense };
