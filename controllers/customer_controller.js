/* error handling */
const AppError = require("../utils/appError");
/* models */
const customer_model = require("../Model/customer_model");
const createdCustomer_model = require("../Model/createdCustomer_model");
const createdCustomerNotification_model = require("../Model/customerNotification_model");
const vender_model = require("../Model/vender_model");
const store_model = require("../Model/store_model")
/* statuscodes */
const { StatusCodes } = require("http-status-codes");
/* success */
const {
  successMessage,
  imageExistInAWSbucket,
  checkDuplicateAwsImgInRecords,
  deleteFile,
  extractImgUrlSingleRecordAWSflexible,
  getFileNameFromUrl,
  extractImgUrlAllRecordAWSflexible,
} = require("../functions/utility.functions");
// catchAsync
const catchAsync = require("../utils/catchAsync");
const {
  customerCreateSchema,
  editCustomerCreateSchema,
} = require("../utils/joi_validator_util");
const { createdCustomerEmail } = require("../utils/emails");
/* api Controllers */
// route /api/v1/customers/
// method GET
// @privacy only vender can do this
const allCustomer = async (req, res, next) => {
  try {
    const allCustomers = await customer_model.find({ venderId: req.user.id });
    if (allCustomer.length < 1) {
      return next(
        new AppError("not product with this vender", StatusCodes.BAD_REQUEST)
      );
    }
    return successMessage(StatusCodes.ACCEPTED, res, null, allCustomers);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/customers/
// method POSt
// @privacy only buyer can do this
const addCustomer = async (req, res, next) => {
  try {
    const { venderId } = req.body;
    if (!venderId) {
      return next(
        new AppError(
          "venderId in req.body is required",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const customer = await customer_model.findOne({
      buyerId: req.user.id,
      venderId,
    });
    if (customer) {
      return successMessage(
        StatusCodes.ACCEPTED,
        res,
        "you are already customer",
        customer
      );
    }

    const newCustomer = await customer_model.create({
      buyerId: req.user.id,
      venderId,
    });
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "you are customer now",
      newCustomer
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// route /api/v1/customers/makeByVender
// method POST
// @privacy only vender can do this
const makeCustomerByVender = catchAsync(async (req, res, next) => {
  const { error, value } = customerCreateSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(
        error.details.map((error) => error.message),
        400
      )
    );
  }
  const imgExist = await imageExistInAWSbucket(value.customerImage);
  if (!imgExist) {
    return next(
      new AppError(
        `no image exists with this name {${value.customerImage}} in bucket`,
        400
      )
    );
  }
  const resultIs = await checkDuplicateAwsImgInRecords(
    value.customerImage,
    "customerImage"
  );
  if (!resultIs.success) {
    return next(new AppError(resultIs.error, 400));
  }
  let createdCustomer = await createdCustomer_model.create({
    ...value,
    venderId: req.user.id,
  });
  createdCustomer = await extractImgUrlSingleRecordAWSflexible(
    createdCustomer,
    "customerImage"
  );
  return successMessage(
    202,
    res,
    "customer created successfully",
    createdCustomer
  );
});

// route /api/v1/customers/makeByVender
// method PUT
// @privacy only vender can do this
const updateCustomerByVender = catchAsync(async (req, res, next) => {
  const { createdCustomerId } = req.query;
  const { error, value } = editCustomerCreateSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(
        error.details.map((error) => error.message),
        400
      )
    );
  }
  const createdCustomer = await createdCustomer_model.findOne({
    _id: createdCustomerId,
  });
  if (!createdCustomer) {
    return next(new AppError("no customer with this id", 400));
  }
  if (value.customerImage) {
    if (
      getFileNameFromUrl(value.customerImage) !== createdCustomer.customerImage
    ) {
      const imgExist = await imageExistInAWSbucket(value.customerImage);
      if (!imgExist) {
        return next(
          new AppError(
            `no image exists with this name {${value.customerImage}} in bucket`,
            400
          )
        );
      }
      const resultIs = await checkDuplicateAwsImgInRecords(
        value.customerImage,
        "customerImage"
      );
      if (!resultIs.success) {
        return next(new AppError(resultIs.error, 400));
      }
      await deleteFile(
        getFileNameFromUrl(createdCustomer.customerImage),
        process.env.AWS_BUCKET_NAME
      );
    }
    value.customerImage = getFileNameFromUrl(value.customerImage);
  }
  let updatedCustomer = await createdCustomer_model.findOneAndUpdate(
    { _id: createdCustomerId },
    { ...value },
    { new: true }
  );
  updatedCustomer = await extractImgUrlSingleRecordAWSflexible(
    updatedCustomer,
    "customerImage"
  );
  return successMessage(
    202,
    res,
    "customer updated successfully",
    updatedCustomer
  );
});

// route /api/v1/customers/makeByVender
// method DELETE
// @privacy only vender can do this
const deleteCustomerByVender = catchAsync(async (req, res, next) => {
  const { createdCustomerId } = req.query;
  const createdCustomer = await createdCustomer_model.findOne({
    _id: createdCustomerId,
  });
  if (!createdCustomer) {
    return next(new AppError("no customer with this id", 400));
  }
  await createdCustomer_model.deleteOne({ _id: createdCustomerId });

  await deleteFile(createdCustomer.customerImage, process.env.AWS_BUCKET_NAME);
  return successMessage(202, res, "customer deleted successfully", null);
});

// route /api/v1/customers/makeByVender
// method GET
// @privacy only vender can do this
// all createdCustomers of vender
const allCreatedCustomerByVender = catchAsync(async (req, res, next) => {
  let createdCustomers = await createdCustomer_model
    .find({
      venderId: req.user.id,
    })
    .sort({ createdAt: -1 });
  createdCustomers = await extractImgUrlAllRecordAWSflexible(
    createdCustomers,
    "customerImage"
  );
  return successMessage(200, res, null, createdCustomers);
});

// route /api/v1/customers/makeByVender/notification
// method Post
// @privacy only vender can do this
// send notification to all customers
const sendNotificationToAllCustomers = catchAsync(async (req, res, next) => {
  const { message } = req.body;
  if (!message) {
    return next(new AppError("message is required", 400));
  }
  const vender = await vender_model.findById(req.user.id);
  const store = await store_model.findOne({ venderId: req.user.id });
  const customers = await createdCustomer_model.find({ venderId: req.user.id });
  if (customers.length < 1) {
    return next(new AppError("no customers found", 400));
  }

  //by promise
  const promises = customers.map(async (customer) => {
    await createdCustomerNotification_model.create({
      venderId: req.user.id,
      createdCustomerId: customer._id,
      message,
    });
    await new createdCustomerEmail({
      senderName: vender.name,
      storeName: store
        ? store.storeName
          ? store.storeName
          : "Nesmaspoint store"
        : "Nesmaspoint store",
      email: customer.email,
      message,
    }).sendMessage();
  });
  await Promise.all(promises);
  return successMessage(202, res, "notification sent successfully", null);
});

module.exports = {
  allCustomer,
  addCustomer,
  makeCustomerByVender,
  updateCustomerByVender,
  deleteCustomerByVender,
  allCreatedCustomerByVender,
  sendNotificationToAllCustomers,
};
