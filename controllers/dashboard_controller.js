/* model */
const subscriptions_model = require("../Model/subscriptions_model");
const vender_model = require("../Model/vender_model");
const admin_model = require("../Model/admin_model");
const shareStore_model = require("../Model/shareStore_model");
const order_model = require("../Model/order_model");

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
  extractImgUrlAllRecordsArrayAWSflexible,
  extractImgUrlAllRecordAWSflexible,
  subscribedUnsubscribedVenders,
} = require("../functions/utility.functions");

/* joi validation */
const {} = require("../utils/joi_validator_util");
// API Route: GET /api/v1/dashboard/
// Description: get dashbourd info
// Permission (only admin can do this)
const getDashboardInfo = async (req, res, next) => {
  try {
    const subscribedPromise = subscriptions_model
      .find({
        currentPackage: { $ne: null },
      })
      .countDocuments();

    const venderPromise = vender_model.find().countDocuments();

    // Calculate the date one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newVenderPromise = vender_model
      .find({ dateCreated: { $gte: oneWeekAgo } })
      .countDocuments();
    const shareStore = shareStore_model.countDocuments();
    const plansAre = await subscriptions_model.find();
    const currentYear = new Date().getFullYear();

    const planss = subscriptions_model.find({
      $or: [
        {
          "currentPackage.subscriptionDate": {
            $regex: `^${currentYear}-\\d{2}`,
          },
        },
        {
          "subscriptionHistory.subscriptionDate": {
            $regex: `^${currentYear}-\\d{2}`,
          },
        },
      ],
    });
    // Execute all promises concurrently
    const [subscribed, allVenders, newVenders, share, plans, plansss] =
      await Promise.all([
        subscribedPromise,
        venderPromise,
        newVenderPromise,
        shareStore,
        plansAre,
        planss,
      ]);

    let total = 0;

    plans.forEach((plan) => {
      // Adding currentPackage planPrice to total
      if (plan.currentPackage && plan.currentPackage.planPrice) {
        total += Number(plan.currentPackage.planPrice);
      }

      // Adding subscriptionHistory planPrice to total
      if (plan.subscriptionHistory && plan.subscriptionHistory.length > 0) {
        plan.subscriptionHistory.forEach((item) => {
          if (item && item.planPrice) {
            total += Number(item.planPrice);
          }
        });
      }
    });
    const monthsOfYear = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dataForCurrentYear = monthsOfYear.map((month) => ({
      month,
      amount: 0,
    }));

    plansss.forEach((plan) => {
      if (plan.currentPackage && plan.currentPackage.planPrice) {
        const month = new Date(
          plan.currentPackage.subscriptionDate
        ).toLocaleString("en-US", { month: "long" });
        const monthIndex = monthsOfYear.indexOf(month);
        if (monthIndex !== -1) {
          dataForCurrentYear[monthIndex].amount += Number(
            plan.currentPackage.planPrice
          );
        }
      }

      if (plan.subscriptionHistory && plan.subscriptionHistory.length > 0) {
        plan.subscriptionHistory.forEach((item) => {
          if (item && item.planPrice) {
            const month = new Date(item.subscriptionDate).toLocaleString(
              "en-US",
              {
                month: "long",
              }
            );
            const monthIndex = monthsOfYear.indexOf(month);
            if (monthIndex !== -1) {
              dataForCurrentYear[monthIndex].amount += Number(item.planPrice);
            }
          }
        });
      }
    });
    const topVendors = await order_model.aggregate([
      {
        $group: {
          _id: "$venderId",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 50,
      },
    ]);

    // Extract vendor IDs
    const vendorIds = topVendors.map((vendor) => vendor._id);

    // Fetch vendor details
    let vendorsDetails = await vender_model
      .find({ _id: { $in: vendorIds } })
      .select("-refreshToken -password");
    const admin = await admin_model.findById(req.user.id);
    vendorsDetails = await extractImgUrlAllRecordAWSflexible(
      vendorsDetails,
      "venderProfileImage"
    );
    // add isSubscribe field
    vendorsDetails = await subscribedUnsubscribedVenders(
      vendorsDetails,
      subscriptions_model
    );
    return successMessage(StatusCodes.OK, res, "this is dashboard info", {
      subscribedVender: subscribed,
      unSubscribedVenders: allVenders - subscribed,
      sumOfFunds: total,
      share,
      allVenders,
      newVenders,
      fundsGraph: dataForCurrentYear,
      top50Venders: vendorsDetails,
    });
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/dashboard/getVenders
// Description: get allVenders with advanced filters
// Permission (only admin can do this)
const getUsers = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Filter parameters
    const { year, month, quarter } = req.query;
    const filter = {};
    // Apply year filter
    if (year) {
      const startDate = new Date(`${year}-01-01T00:00:00Z`).getTime(); // Convert to milliseconds
      const endDate = new Date(`${year}-12-31T23:59:59Z`).getTime(); // Convert to milliseconds
      filter.dateCreated = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Apply month filter
    if (month) {
      const startDate = new Date(
        `${year}-${months.indexOf(month.toLowerCase()) + 1}-01`
      ).getTime();
      let endDate = new Date(
        year,
        months.indexOf(month.toLowerCase()) + 1,
        0,
        28,
        59,
        59
      ).getTime(); // End of the month (last day, last second);
      filter.dateCreated = { $gte: startDate, $lt: endDate };
    }

    // Apply quarter filter
    if (quarter) {
      const quarterMonths = getQuarterMonths(year, quarter);
      const startDate = new Date(
        year,
        months.indexOf(quarterMonths[0]),
        0,
        28,
        59,
        59
      ).getTime();
      const endDate = new Date(
        year,
        months.indexOf(quarterMonths[2]) + 1,
        0,
        28,
        59,
        59
      ).getTime();
      filter.dateCreated = { $gte: startDate, $lt: endDate };
    }
    // Get total count of vendors (for pagination metadata)
    const totalCount = await vender_model.countDocuments({
      $and: [
        filter, // Include existing filter
        { isDeleted: { $ne: true } }, // Exclude vendors with isDeleted:true
      ],
    });
    // Fetch vendors with pagination and filtering
    const vendors = await vender_model
      .find({
        $and: [
          filter, // Include existing filter
          { isDeleted: { $ne: true } }, // Exclude vendors with isDeleted:true
        ],
      })
      .lean()
      .select("-refreshToken -password")
      .skip(skip)
      .limit(limit ? limit : totalCount);
    // add isSubscribe field
    let vendorsWithSubscription = await subscribedUnsubscribedVenders(
      vendors,
      subscriptions_model
    );
    const admin = await admin_model.findById(req.user.id);
    vendorsWithSubscription = await extractImgUrlAllRecordAWSflexible(
      vendorsWithSubscription,
      "venderProfileImage"
    );
    // Return response with pagination metadata
    return successMessage(StatusCodes.OK, res, "These are vendors", {
      venders: vendorsWithSubscription,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / (limit ? limit : totalCount)),
        currentPage: page,
        perPage: limit ? limit : totalCount,
      },
    });
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// Helper function to get months of a quarter
function getQuarterMonths(year, quarter) {
  const quarterMonths = {
    q1: ["jan", "feb", "mar"],
    q2: ["apr", "may", "jun"],
    q3: ["jul", "aug", "sep"],
    q4: ["oct", "nov", "dec"],
  };
  return quarterMonths[quarter];
}

// Months Enum
const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

// API Route: POST /api/v1/dashboard/venderDelete
// Description: 1) vender delete
// Description: 2) vender unDelete
// Permission (only admin can do this)
const deleteVender = async (req, res, next) => {
  try {
    const { venderId } = req.query;
    if (!venderId) {
      return next(
        new AppError("plz give venderId in query", StatusCodes.BAD_REQUEST)
      );
    }
    const vender = await vender_model.findById(venderId);
    if (vender.isDeleted == true) {
      return successMessage(
        StatusCodes.OK,
        res,
        "vender is already deleted",
        null
      );
    }
    if (!vender) {
      return next(
        new AppError("no vender with this id", StatusCodes.BAD_REQUEST)
      );
    }
    vender.isDeleted = true;
    await vender.save();
    const subscription = await subscriptions_model.findOne({
      venderId: vender.id,
    });
    subscription.subscriptionHistory.push({
      ...subscription.currentPackage,
      subscriptionEnd: Date.now(),
      resonEnd: "admin delete his account",
    });
    subscription.currentPackage = null;
    await subscription.save();
    if (vender.isDeleted == true) {
      return successMessage(
        StatusCodes.OK,
        res,
        "vender deleted successfully",
        null
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: POST /api/v1/dashboard/venderActivate
// Description: 1) vender activate
// Description: 2) vender de activate
// Permission (only admin can do this)
const inActiiveVender = async (req, res, next) => {
  try {
    const { venderId } = req.query;
    if (!venderId) {
      return next(
        new AppError("plz give venderId in query", StatusCodes.BAD_REQUEST)
      );
    }
    const vender = await vender_model.findById(venderId);
    if (!vender) {
      return next(
        new AppError("no vender with this id", StatusCodes.BAD_REQUEST)
      );
    }
    vender.isActive = !vender.isActive;
    await vender.save();
    if (vender.isActive == true) {
      return successMessage(
        StatusCodes.OK,
        res,
        "vender is now activated",
        null
      );
    }
    if (vender.isActive == false) {
      return successMessage(
        StatusCodes.OK,
        res,
        "vender is now de Activated",
        null
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: Post /api/v1/dashboard/searchVenders
// Description: search venders
// Permission (only admin can do this)
const searchVenders = async (req, res, next) => {
  const { searchTerm } = req.body; // Assuming searchTerm is the new input

  try {
    let query = {};

    if (searchTerm) {
      query.$or = [
        { email: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex search on email
        { name: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex search on name
      ];
    }
    let users = await vender_model
      .find(query)
      .select("-refreshToken -password");
    const admin = await admin_model.findById(req.user.id);
    users = await extractImgUrlAllRecordAWSflexible(
      users,
      "venderProfileImage"
    );
    // add isSubscribe field
    users = await subscribedUnsubscribedVenders(users, subscriptions_model);
    return successMessage(202, res, "These are the required venders", users);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: Post /api/v1/dashboard/topVenders
// Description: get Top Venders
// Permission (only admin can do this)
const topVenders = async (req, res, next) => {
  try {
    const topVendors = await order_model.aggregate([
      {
        $group: {
          _id: "$venderId",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 50,
      },
    ]);

    // Extract vendor IDs
    const vendorIds = topVendors.map((vendor) => vendor._id);

    // Fetch vendor details
    let vendorsDetails = await vender_model
      .find({ _id: { $in: vendorIds } })
      .select("-refreshToken -password");
    const admin = await admin_model.findById(req.user.id);
    vendorsDetails = await extractImgUrlAllRecordAWSflexible(
      vendorsDetails,
      "venderProfileImage"
    );
    // add isSubscribe field
    vendorsDetails = await subscribedUnsubscribedVenders(
      vendorsDetails,
      subscriptions_model
    );
    return successMessage(
      202,
      res,
      "Top 50 vendors by total orders retrieved successfully",
      vendorsDetails
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  getDashboardInfo,
  getUsers,
  deleteVender,
  inActiiveVender,
  searchVenders,
  topVenders,
};
