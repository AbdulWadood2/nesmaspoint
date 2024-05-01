/* model */
const subscriptions_model = require("../Model/subscriptions_model");
const vender_model = require("../Model/vender_model");
/* emails for sent */
const { forSubscriptionCreatedEmailSend } = require("../utils/emails");

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
const {
  successMessage,
  getMillisecAfterMonths,
} = require("../functions/utility.functions");

/* joi validation */
const { validatePlanSchema } = require("../utils/joi_validator_util");

// API Route: POST /api/v1/subscription/
// Description: Add Subscription
// Permission (only vender can do this)
const createSubscription = async (req, res, next) => {
  try {
    const body = req.body;
    // Validate order data using Joi
    const result = validatePlanSchema(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    const subscription = await subscriptions_model.findOne({
      venderId: req.user.id,
    });
    if (!subscription) {
      const subscription = await subscriptions_model.create({
        venderId: req.user.id,
        currentPackage: {
          ...body,
          expirationAlert: false,
          expirationDate: getMillisecAfterMonths(
            new Date(body.subscriptionDate),
            body.duration
          ),
        },
      });
      const vender = await vender_model.findById(req.user.id);
      await new forSubscriptionCreatedEmailSend({
        email: vender.email,
        ...body,
      }).sendSubscriptionCreatedMessage();
      return successMessage(
        StatusCodes.OK,
        res,
        "subscription is done",
        subscription
      );
    }
    subscription.subscriptionHistory.push({
      ...subscription.currentPackage,
      resonEnd: "the user change subscription",
      subscriptionEnd: Date.now(),
    });
    subscription.currentPackage = {
      ...body,
      expirationAlert: false,
      expirationDate: getMillisecAfterMonths(
        new Date(body.subscriptionDate),
        body.duration
      ),
    };
    await subscription.save();
    const vender = await vender_model.findById(req.user.id);

    await new forSubscriptionCreatedEmailSend({
      email: vender.email,
      ...body,
      subscriptionDate: body.subscriptionDate,
    }).sendSubscriptionCreatedMessage();
    return successMessage(
      StatusCodes.OK,
      res,
      "subscription is done",
      subscription
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: DELETE /api/v1/subscription/
// Description: remove Subscription
// Permission (only vender can do this)
const removeSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptions_model.findOne({
      venderId: req.user.id,
    });
    if (!subscription) {
      return next(
        new AppError("you have not subscription added", StatusCodes.BAD_REQUEST)
      );
    }
    if (!subscription.currentPackage) {
      return next(
        new AppError("you already no subscribed", StatusCodes.BAD_REQUEST)
      );
    }
    subscription.subscriptionHistory.push({
      ...subscription.currentPackage,
      subscriptionEnd: Date.now(),
      resonEnd: "vender remove his subscription",
    });
    subscription.currentPackage = null;
    await subscription.save();
    return successMessage(
      StatusCodes.OK,
      res,
      "remove subscription successfully",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: GET /api/v1/subscription/
// Description: get the current
// Permission (only vender can do this)
const getCurrentSubscription = async (req, res, next) => {
  try {
    let currentSubscription = await subscriptions_model
      .findOne({
        venderId: req.user.id,
      })
      .select("-venderId -_id -subscriptionHistory -__v")
      .lean();

    if (currentSubscription && currentSubscription.currentPackage) {
      const date = new Date(
        currentSubscription.currentPackage.subscriptionDate
      );
      date.setMonth(
        date.getMonth() + Number(currentSubscription.currentPackage.duration)
      );
      const millisecondsAfterSpecificMonths = date.getTime();
      if (Date.now() > millisecondsAfterSpecificMonths) {
        const subscription = await subscriptions_model.findOne({
          venderId: req.user.id,
        });
        subscription.subscriptionHistory.push(subscription.currentPackage);
        subscription.currentPackage = null;
        await subscription.save();
        currentSubscription = null;
      }
    } else {
      currentSubscription = null;
    }

    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "this is current subscription",
      currentSubscription ? { ...currentSubscription.currentPackage } : null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
module.exports = {
  createSubscription,
  removeSubscription,
  getCurrentSubscription,
};
