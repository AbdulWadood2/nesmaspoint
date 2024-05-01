/* model */
const shareStore_model = require("../Model/shareStore_model");
/* statuscode */
const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require("http-status-codes");

/* app errors */
const AppError = require("../utils/appError");

/* utility functions */
const { successMessage } = require("../functions/utility.functions");

/* joi validation */
const {} = require("../utils/joi_validator_util");

// API Route: POST /api/v1/shareStore
// Description: api when share link
// Permission (only vender can do this)
const storeShare = async (req, res, next) => {
  try {
    const { category, link } = req.body;
    const shareStore = await shareStore_model.create({
      venderId: req.user.id,
      category,
      link,
    });
    return successMessage(
      StatusCodes.OK,
      res,
      "share date fecthed by db success",
      shareStore
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = { storeShare };
