const invoice_model = require("../Model/invoice_model");
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
  imageExistInAWSbucket,
  extractImgUrlSingleRecordAWSflexible,
  extractImgUrlAllRecordAWSflexible,
  isAwsS3Url,
  getFileNameFromUrl,
  deleteFile,
  checkDuplicateAwsImgInRecords,
} = require("../functions/utility.functions");
/* joi */
const { invoiceJoi, editInvoiceJoi } = require("../utils/joi_validator_util");
/* fs */
const fs = require("fs");

// route /api/v1/invoice/
// method POST
// @privacy only vender can do this
const addInvoice = async (req, res, next) => {
  try {
    req.body.venderId = req.user.id;
    const result = invoiceJoi(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message),
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const imgExist = await imageExistInAWSbucket(result.value.companylogo);
    if (!imgExist) {
      return next(
        new AppError(
          `no image exists with this name {${req.body.companylogo}} in bucket`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const resultIs = await checkDuplicateAwsImgInRecords(
      result.value.companylogo,
      "companylogo"
    );

    if (!resultIs.success) {
      return next(new AppError(resultIs.error, StatusCodes.BAD_REQUEST));
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
    let invoice = await invoice_model.create({
      ...result.value,
      storePreferredCurrency: store.storePreferredCurrency,
    });
    invoice = await extractImgUrlSingleRecordAWSflexible(
      invoice,
      "companylogo"
    );
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "invoice created successfully",
      invoice
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/invoice/
// method GET
// @privacy only vender can do this
const getAllInvoices = async (req, res, next) => {
  try {
    const venderId = req.user.id;
    if (!isValidObjectId(venderId)) {
      return next(
        new AppError("you not have a valid objectId", StatusCodes.BAD_REQUEST)
      );
    }

    // Pagination
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortOptions = { createdAt: -1 }; // Sort by dateCreated in descending order (new to old)

    let invoices = await invoice_model
      .find({ venderId })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Applying additional logic (e.g., extracting image URLs)
    invoices = await extractImgUrlAllRecordAWSflexible(invoices, "companylogo");

    // Pagination information
    const totalCount = await invoice_model.countDocuments({ venderId });
    const totalPages = Math.ceil(totalCount / limit);

    const paginationInfo = {
      totalItems: totalCount,
      totalPages: totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
    return successMessage(StatusCodes.ACCEPTED, res, paginationInfo, invoices);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// route /api/v1/invoice/
// method PUT
// @privacy only vender can do this
const editInvoice = async (req, res, next) => {
  try {
    const result = editInvoiceJoi(req.body);

    if (result.error) {
      // Validation failed
      return next(
        new AppError(
          result.error.details.map((error) => error.message),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    const invoiceIs = await invoice_model.findById(req.query.invoiceId);
    if (!invoiceIs) {
      return next(
        new AppError(
          `No invoice exists with this invoiceId`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!(invoiceIs.venderId == req.user.id)) { 
      return next(
        new AppError(
          `You are not authorized to edit this invoice`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    let companylogo;
    const isAwsImg = isAwsS3Url(result.value.companylogo);
    if (isAwsImg) {
      companylogo = getFileNameFromUrl(result.value.companylogo);
      result.value.companylogo = companylogo;
    } else {
      companylogo = result.value.companylogo;
    }
    // the following block if you have an image existence check
    const imgExist = await imageExistInAWSbucket(companylogo);

    if (!imgExist) {
      return next(
        new AppError(
          `No image exists with the name ${companylogo} in the bucket`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // here i handle image security
    const resultIs = await checkDuplicateAwsImgInRecords(
      companylogo,
      "companylogo"
    );

    if (!resultIs.success) {
      if (!(invoiceIs.companylogo == companylogo)) {
        return next(new AppError(resultIs.error, StatusCodes.BAD_REQUEST));
      }
    }
    const venderInvoice = await invoice_model.findById(req.query.invoiceId);

    const invoiceId = req.query.invoiceId;
    let updatedInvoice = await invoice_model.findOneAndUpdate(
      { _id: invoiceId, venderId: req.user.id },
      {
        $set: {
          ...result.value,
        },
      },
      { new: true }
    );

    if (!updatedInvoice) {
      return next(
        new AppError(
          "Invoice not found or you are not authorized to edit it",
          StatusCodes.NOT_FOUND
        )
      );
    }
    if (!(companylogo == venderInvoice.companylogo)) {
      await deleteFile(venderInvoice.companylogo, process.env.AWS_BUCKET_NAME);
    }

    updatedInvoice = await extractImgUrlSingleRecordAWSflexible(
      updatedInvoice,
      "companylogo"
    );
    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Invoice successfully updated",
      updatedInvoice
    );
  } catch (error) {
    // Handle unexpected errors
    return next(new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// route /api/v1/invoice/
// method DELETE
// @privacy only vender can do this
const deleteInvoice = async (req, res, next) => {
  try {
    const invoiceId = req.query.invoiceId; // Using req.query for invoiceId
    const invoice = await invoice_model.findById(invoiceId);
    if (!invoice) {
      return next(
        new AppError("not invoice with this id", StatusCodes.NOT_FOUND)
      );
    }
    if (!(invoice.venderId == req.user.id)) {
      return next(
        new AppError("this is not your invoice", StatusCodes.BAD_REQUEST)
      );
    }
    const deletedInvoice = await invoice_model.findOneAndDelete({
      _id: invoiceId,
      venderId: req.user.id,
    });

    if (!deletedInvoice) {
      return next(
        new AppError(
          "Invoice not found or you are not authorized to delete it",
          StatusCodes.NOT_FOUND
        )
      );
    }
    await deleteFile(deletedInvoice.companylogo, process.env.AWS_BUCKET_NAME);
    // Optionally, delete associated files or perform any cleanup here

    successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Invoice successfully deleted",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = { addInvoice, getAllInvoices, editInvoice, deleteInvoice };
