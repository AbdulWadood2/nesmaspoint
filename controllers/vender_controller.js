/* emails for sent */
const { Email, WelcomeVender, debtRemainderEmail } = require("../utils/emails");
//others
const mongoose = require("mongoose");
/* status codes */
const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require("http-status-codes");
/* jwt */
const JWT = require("jsonwebtoken");
/* custom error */
const AppError = require("../utils/appError");
// catch async
const catchAsync = require("../utils/catchAsync");
/* file System */
const fs = require("fs");
/* models */
const vender_model = require("../Model/vender_model");
const shippingMethod_model = require("../Model/shippingMethod_Model");
const store_model = require("../Model/store_model");
const income_model = require("../Model/income_model");
const expense_model = require("../Model/expense_model");
const invoice_model = require("../Model/invoice_model");
const sales_model = require("../Model/sales_model");
const subscriptions_model = require("../Model/subscriptions_model");
const loanApplication_model = require("../Model/loanApplication_model");
const loanPackage_model = require("../Model/loanPackage_model");
const wallet_model = require("../Model/wallet_model");
const transaction_model = require("../Model/transaction_model");
const debtor_model = require("../Model/debtor_model");
const debtRemainder_model = require("../Model/debtorRemainder_model");
/* for hashing */
const CryptoJS = require("crypto-js");
/* verification component */
const { signToken, signRefreshToken } = require("../utils/verifyToken_util");
/* utilities function */
const {
  generateRandomString,
  successMessage,
  validatePassword,
  deleteFile,
  generateSignedUrl,
  s3bucket,
  extractImgUrlSingleRecordAWSflexible,
  checkImagesExistInAWS,
  imageExistInAWSbucket,
  checkDuplicateAwsImgInRecords,
  getMillisecAfterMonths,
  isValidObjectId,
  extractImgUrlAllRecordAWSflexible,
  getFileNameFromUrl,
} = require("../functions/utility.functions");
const {
  validateVenderSignUp,
  validateVenderEdit,
  loanApplicationSchema,
  transactionSchema,
  debtorValidationSchema,
  debtorEditValidationSchema,
  debtNotificationSchema,
} = require("../utils/joi_validator_util");
// API Route: POST /api/v1/vender/signup
// Permission (only vender can do this)
const register = async (req, res, next) => {
  try {
    let { name, email, companyName, phoneNumber, password } = req.body;
    const result = validateVenderSignUp(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Check if the email is a valid email address
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    if (!emailRegex.test(email)) {
      return next(
        new AppError("Invalid email address", StatusCodes.BAD_REQUEST)
      );
    }
    // Check if the user already exists
    const isVenderExist = await vender_model.findOne({ email });
    if (isVenderExist) {
      if (isVenderExist.isDeleted) {
        // Password encryption (you might want to improve the encryption method)
        let encryptPassword = CryptoJS.AES.encrypt(
          password,
          process.env.CRYPTO_SEC
        ).toString();
        // create vender
        let oldVender = await vender_model.findOneAndUpdate(
          { email },
          {
            name,
            phoneNumber,
            password: encryptPassword,
            dateCreated: Date.now(),
            dateModified: null,
            isDeleted: false,
          }
        );
        await store_model.findOneAndUpdate(
          { venderId: oldVender.id },
          {
            storeCompanyName: companyName,
            storeName: companyName,
          }
        );
        const randomString = generateRandomString(40);
        // Create refresh Token
        let refreshTokenIs = signRefreshToken(randomString);
        // ectually it is access token
        const accessToken = signToken(oldVender.id, randomString);
        oldVender.refreshToken.push(refreshTokenIs);
        await oldVender.save();
        oldVender = oldVender.toObject();
        delete oldVender.password;
        delete oldVender.refreshToken;
        await new WelcomeVender({ email, name: "" }).sendWelcome();
        await subscriptions_model.findOneAndUpdate(
          {
            venderId: oldVender._id,
          },
          {
            currentPackage: {
              planName: "freemium",
              planPrice: "0",
              duration: "2",
              expirationDate: getMillisecAfterMonths(null, 2),
              subscriptionDate: `${new Date(Date.now()).toISOString()}`,
            },
          }
        );
        // Send Verification Email (implement email sending logic here)
        return successMessage(
          StatusCodes.ACCEPTED,
          res,
          "signup successfully",
          {
            ...oldVender,
            accessToken,
            refreshToken: refreshTokenIs,
          }
        );
      }
      return next(
        new AppError("vender is already exist", StatusCodes.BAD_REQUEST)
      );
    }
    const store = await store_model.findOne({ storeName: companyName });
    if (store) {
      return next(
        new AppError(
          "Already the store exists with this companyName",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Password encryption (you might want to improve the encryption method)
    let encryptPassword = CryptoJS.AES.encrypt(
      password,
      process.env.CRYPTO_SEC
    ).toString();
    // create vender
    let newVender = await vender_model.create({
      name,
      email,
      phoneNumber,
      password: encryptPassword,
      dateCreated: Date.now(),
    });
    // create store
    await store_model.create({
      venderId: newVender.id,
      storeCompanyName: companyName,
      storeName: companyName,
    });
    const randomString = generateRandomString(40);
    // Create refresh Token
    let refreshTokenIs = signRefreshToken(randomString);
    // ectually it is access token
    const accessToken = signToken(newVender._id, randomString);
    newVender.refreshToken.push(refreshTokenIs);
    await newVender.save();
    newVender = newVender.toObject();
    delete newVender.password;
    delete newVender.refreshToken;
    await shippingMethod_model.create({
      venderId: newVender._id,
    });
    await new WelcomeVender({ email, name: "" }).sendWelcome();
    await subscriptions_model.create({
      venderId: newVender._id,
      currentPackage: {
        planName: "freemium",
        planPrice: "0",
        duration: "2",
        expirationDate: getMillisecAfterMonths(null, 2),
        subscriptionDate: `${new Date(Date.now()).toISOString()}`,
      },
    });
    // Send Verification Email (implement email sending logic here)
    return successMessage(StatusCodes.ACCEPTED, res, "signup successfully", {
      ...newVender,
      accessToken,
      refreshToken: refreshTokenIs,
    });
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: POST /api/v1/vender/login
// Permission (only vender can do this)
const login = async (req, res, next) => {
  try {
    // const { fcm_key } = req.body;
    // if (!fcm_key) return next(new AppError("fcm_key is required in body", 400));
    const vender = await vender_model.findOne({ email: req.body.email });
    if (!vender) {
      return next(
        new AppError("user not found with this email", StatusCodes.BAD_REQUEST)
      );
    }
    if (vender.isDeleted) {
      return next(
        new AppError(
          "Login failed - Account does not exist",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Check if vender exist or not
    if (!vender) {
      // return res
      //   .status(StatusCodes.NOT_FOUND)
      //   .json({ success: false, error: "User not found", data: null });
      return next(new AppError("vender not found", StatusCodes.NOT_FOUND));
    } else {
      if (req.body.fcm_Key) {
        vender.fcm_key.push(fcm_key);
      }
      await vender.save();
      // Decrypt the password which is stored in Encryption form in database
      const hashedPassword = CryptoJS.AES.decrypt(
        vender.password,
        process.env.CRYPTO_SEC
      );
      const realPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
      if (realPassword !== req.body.password) {
        return next(
          new AppError("password is incorrect", StatusCodes.BAD_REQUEST)
        );
      } else {
        const randomString = generateRandomString(40);
        // Create refresh Token
        const refreshTokenIs = signRefreshToken(randomString);
        // ectually it is access token
        const accessToken = signToken(vender._id, randomString);
        // Use select to fetch only necessary fields from the database
        let venderIs = await vender_model.findByIdAndUpdate(
          vender._id,
          { $push: { refreshToken: refreshTokenIs } },
          { new: true, select: "-password -refreshToken" }
        );

        // Check and extract the image URL if it exists
        if (venderIs.venderProfileImage) {
          venderIs = await extractImgUrlSingleRecordAWSflexible(
            venderIs.toObject(),
            "venderProfileImage"
          );
        }
        venderIs = JSON.stringify(venderIs);
        venderIs = JSON.parse(venderIs);
        const currentSubscription = await subscriptions_model
          .findOne({
            venderId: venderIs._id,
          })
          .select("-subscriptionHistory -venderId -__v -_id")
          .lean();
        return successMessage(StatusCodes.ACCEPTED, res, "login successful", {
          ...venderIs,
          ...currentSubscription,
          accessToken,
          refreshToken: refreshTokenIs,
        });
      }
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: POST /api/v1/vender/logout
// Permission (only vender can do this)
const logout = async (req, res, next) => {
  try {
    let { refreshToken } = req.query;
    if (!refreshToken) {
      return next(
        new AppError(
          "refreshToken in params is required",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    refreshToken = refreshToken.split(" ");
    refreshToken = refreshToken[1];
    console.log(refreshToken);
    const vender = await vender_model.findOne({ refreshToken });
    console.log(vender);
    if (!vender) {
      return next(
        new AppError("this refreshToken not exist", StatusCodes.BAD_REQUEST)
      );
    }
    await vender_model.updateOne(
      { _id: req.user._id },
      { $pull: { refreshToken: refreshToken } }
    );
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "logout successfully",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/vender/forgetPassword
// Permission (only vender can do this)
const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await vender_model.findOne({ email });
    if (user.isDeleted) {
      return next(
        new AppError("you are deleted by admin", StatusCodes.BAD_REQUEST)
      );
    }
    if (user) {
      function generateSixDigitNumber() {
        const min = 100000; // Smallest 6-digit number
        const max = 999999; // Largest 6-digit number
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      const sixDigitNumber = generateSixDigitNumber();
      const expirationTime = new Date().getTime() + 5 * 60 * 1000; // 5 minutes expiration
      await new Email(
        { email, name: "" },
        sixDigitNumber
      ).sendVerificationCode();
      let otp = CryptoJS.AES.encrypt(
        JSON.stringify({
          code: sixDigitNumber,
          expirationTime: expirationTime,
        }),
        process.env.CRYPTO_SEC
      ).toString();
      user.forgetPassword = otp;
      await user.save();
      return successMessage(StatusCodes.ACCEPTED, res, null, {
        email,
        otp: encodeURIComponent(otp),
      });
    } else {
      return next(
        new AppError("not user with this email", StatusCodes.NOT_FOUND)
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: POST /api/v1/vender/setPassword
// Permission (only vender can do this)
const otpCheaker = async (req, res, next) => {
  try {
    const { email, encryptOpts, otp, newPassword } = req.body;
    const userIS = await vender_model.findOne({ email });
    if (userIS.isDeleted) {
      return next(
        new AppError("you are deleted by admin", StatusCodes.BAD_REQUEST)
      );
    }
    const check = validatePassword(newPassword);
    if (check.length > 0) {
      return next(new AppError(check, StatusCodes.BAD_REQUEST));
    }
    const errors = [];

    if (!email) {
      errors.push("Email is required.");
    }

    if (!otp) {
      errors.push("Verification code is required.");
    }

    if (errors.length > 0) {
      return next(new AppError(errors, StatusCodes.BAD_REQUEST));
    }

    // Decrypt the encrypted options and compare with the user-entered code
    const decrypted = CryptoJS.AES.decrypt(
      decodeURIComponent(encryptOpts),
      process.env.CRYPTO_SEC
    ).toString(CryptoJS.enc.Utf8);

    let otpData;
    try {
      otpData = JSON.parse(decrypted);
    } catch (error) {
      return next(
        new AppError(
          "Invalid encrypted options format.",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const { code, expirationTime } = otpData;

    if (code != otp) {
      return next(
        new AppError("Invalid verification code.", StatusCodes.UNAUTHORIZED)
      );
    }

    // Check if the OTP has expired
    const currentTime = new Date().getTime();
    if (currentTime > expirationTime) {
      return next(
        new AppError("Verification code has expired.", StatusCodes.UNAUTHORIZED)
      );
    }

    // Find the user by email
    const user = await vender_model.findOne({ email });

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }
    if (!user.forgetPassword) {
      return next(
        new AppError(
          "you are not able to change password because of not otp",
          StatusCodes.NOT_FOUND
        )
      );
    }
    if (encryptOpts != user.forgetPassword) {
      new AppError("generate otp first", StatusCodes.NOT_FOUND);
    }
    // Update the user's password
    user.password = CryptoJS.AES.encrypt(
      newPassword,
      process.env.CRYPTO_SEC
    ).toString();
    user.forgetPassword = null;
    await user.save();
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Password reset successfully.",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// profile section

// API Route: GET /api/v1/vender/profile
// Permission (only vender can do this)
const getUserProfile = async (req, res, next) => {
  try {
    // Assuming you have the user ID from the token
    const userId = req.user.id;
    let user = await vender_model
      .findById(userId)
      .select("-password -refreshToken");

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }

    if (user.venderProfileImage) {
      user = await extractImgUrlSingleRecordAWSflexible(
        user,
        "venderProfileImage"
      );
    }
    return successMessage(
      StatusCodes.OK,
      res,
      "User profile retrieved successfully",
      user
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: PUT /api/v1/vender/profile
// Permission (only vender can do this)
const updateUserProfile = async (req, res, next) => {
  try {
    // Assuming you have the user ID from the token
    const userId = req.user.id;
    const result = validateVenderEdit(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Fetch the user from the database
    let user = await vender_model.findById(userId);

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }

    // Update user data based on the request body
    const { name, phoneNumber, password, venderProfileImage, language } =
      req.body;

    // Validate and update the fields you want to allow updating
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (password) {
      const check = validatePassword(password);
      if (check.length > 0) {
        return next(new AppError(check, StatusCodes.BAD_REQUEST));
      }
      // Encrypt and update the password
      user.password = CryptoJS.AES.encrypt(
        password,
        process.env.CRYPTO_SEC
      ).toString();
    }
    if (user.venderProfileImage) {
      if (venderProfileImage === null) {
        await deleteFile(user.venderProfileImage, process.env.AWS_BUCKET_NAME);
        user.venderProfileImage = null;
      }
    }
    if (venderProfileImage) {
      if (user.venderProfileImage == venderProfileImage) {
        user.venderProfileImage = venderProfileImage;
      } else if (user.venderProfileImage) {
        const awsimage = await imageExistInAWSbucket(venderProfileImage);
        if (!awsimage) {
          return next(
            new AppError(
              "this image not exists in aws bucket.",
              StatusCodes.BAD_REQUEST
            )
          );
        }
        const result = await checkDuplicateAwsImgInRecords(
          venderProfileImage,
          "venderProfileImage"
        );

        if (!result.success) {
          return next(new AppError(result.error, StatusCodes.BAD_REQUEST));
        }
        await deleteFile(user.venderProfileImage, process.env.AWS_BUCKET_NAME);
        user.venderProfileImage = venderProfileImage;
      } else {
        const awsimage = await imageExistInAWSbucket(venderProfileImage);
        if (!awsimage) {
          return next(
            new AppError(
              "this image not exists in aws bucket.",
              StatusCodes.BAD_REQUEST
            )
          );
        }
        user.venderProfileImage = venderProfileImage;
      }
    }
    if (language) user.language = language;
    user.dateModified = Date.now();
    // Save the updated user data
    await user.save();

    // Omit sensitive information like password and refresh token
    let { password: _, refreshToken, ...updatedUserProfile } = user._doc;
    if (updatedUserProfile.venderProfileImage) {
      const awsimage = await imageExistInAWSbucket(
        updatedUserProfile.venderProfileImage
      );

      if (!awsimage) {
        return next(
          new AppError(
            "this image not exists in aws bucket.",
            StatusCodes.BAD_REQUEST
          )
        );
      }
      // Generate signed URLs for each product image
      async function getSignUrlAWS() {
        const signedUrl = await generateSignedUrl(
          updatedUserProfile.venderProfileImage
        );
        return {
          ...updatedUserProfile,
          venderProfileImage: signedUrl,
        };
      }
      updatedUserProfile = await getSignUrlAWS();
    }

    return successMessage(
      StatusCodes.OK,
      res,
      "User profile updated successfully",
      updatedUserProfile
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: POST /api/v1/vender/makePaystack_custVender
// Permission (only vender can do this)
const makePaystack_custVender = async (req, res, next) => {
  try {
    const { paystack_cust } = req.query;
    if (!paystack_cust) {
      return next(
        new AppError(
          "paystack_cust in req.query is missing",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const updatedVender = await vender_model.findByIdAndUpdate(
      req.user.id,
      {
        paystack_cust,
      },
      {
        select: "-refreshToken -password",
        new: true, // to return the updated document
      }
    );
    return successMessage(
      StatusCodes.OK,
      res,
      "paystack_cust is added successsfully",
      updatedVender
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

const analytics = async (req, res, next) => {
  try {
    const incomePipeline = [
      {
        $match: { venderId: new mongoose.Types.ObjectId(req.user.id) },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$incomeAmount" },
        },
      },
    ];

    const expensePipeline = [
      {
        $match: { venderId: new mongoose.Types.ObjectId(req.user.id) },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$expenseAmount" },
        },
      },
    ];

    const invoicePipeline = [
      {
        $match: { venderId: new mongoose.Types.ObjectId(req.user.id) },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ];

    const salesPipeline = [
      {
        $match: { venderId: new mongoose.Types.ObjectId(req.user.id) },
      },
      {
        $group: {
          _id: null,
          totalShippingFee: { $sum: "$shippingFee" },
          totalDiscount: { $sum: "$discount" },
          totalProductPrice: { $sum: "$productPrice" },
        },
      },
    ];

    // Execute all aggregation queries concurrently using Promise.all
    const [totalIncome, totalExpense, totalInvoice, totalSales] =
      await Promise.all([
        income_model.aggregate(incomePipeline),
        expense_model.aggregate(expensePipeline),
        invoice_model.aggregate(invoicePipeline),
        sales_model.aggregate(salesPipeline),
      ]);

    return successMessage(StatusCodes.OK, res, "this is analytics", [
      {
        title: "Total Income",
        totalAmount: totalIncome.length > 0 ? totalIncome[0].totalAmount : 0,
        percentage: 90,
      },
      {
        title: "Total Expense",
        totalAmount: totalExpense.length > 0 ? totalExpense[0].totalAmount : 0,
        percentage: 10,
      },
      {
        title: "Total Invoice",
        totalAmount: totalInvoice.length > 0 ? totalInvoice[0].totalAmount : 0,
        percentage: 100,
      },
      {
        title: "Total Sales",
        totalAmount:
          (totalSales.length > 0 ? totalSales[0].totalShippingFee : 0) +
          (totalSales.length > 0 ? totalSales[0].totalDiscount : 0) +
          (totalSales.length > 0 ? totalSales[0].totalProductPrice : 0),
        percentage: 80,
      },
    ]);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// method delete
// API Route: POST /api/v1/vender/deleteAccount
// Permission (only vender can do this) with token
const deleteVender = async (req, res, next) => {
  try {
    const vender = await vender_model.findById(req.user.id);
    if (vender.isDeleted) {
      return next(new AppError("you are deleted", StatusCodes.BAD_REQUEST));
    }
    vender.isDeleted = true;
    await vender.save();
    const subscription = await subscriptions_model.findOne({
      venderId: vender.id,
    });
    if (subscription.currentPackage) {
      subscription.subscriptionHistory.push({
        ...subscription.currentPackage,
        subscriptionEnd: Date.now(),
        resonEnd: "user delete his account",
      });
      subscription.currentPackage = null;
      await subscription.save();
    }
    return successMessage(
      202,
      res,
      "Your account is deleted successfully",
      null
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// method post
// API Route: GET /api/v1/vender/loanApplication
// Permission (only vender can do this) with token
const loanApplication = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const { error, value } = loanApplicationSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(error.details[0].message, StatusCodes.BAD_REQUEST)
    );
  }
  const loanPackage = await loanPackage_model.findOne({
    _id: value.loanPackageId,
  });
  if (!loanPackage) {
    return next(
      new AppError("loan package not found", StatusCodes.BAD_REQUEST)
    );
  }
  const loanApplication = await loanApplication_model.create({
    venderId: venderId,
    ...value,
    loanAmount: loanPackage.amount,
  });
  return successMessage(
    StatusCodes.CREATED,
    res,
    "Loan application submitted successfully",
    loanApplication
  );
});

// method put
// API Route: GET /api/v1/vender/cancelLoanApplication
// Permission (only vender can do this) with token
// desc cancel loan application
const cancelLoanApplication = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const { loanApplicationId } = req.query;
  if (!loanApplicationId) {
    return next(new AppError("loanApplicationId is required", 400));
  }
  if (!isValidObjectId(loanApplicationId)) {
    return next(new AppError("loanApplicationId is not valid", 400));
  }
  const loanApplication = await loanApplication_model.findOne({
    _id: loanApplicationId,
    venderId,
  });
  if (!loanApplication) {
    return next(new AppError("this is not your loan application", 400));
  }
  if (loanApplication.status !== 0) {
    return next(
      new AppError(
        "You can only cancel a pending loan application",
        StatusCodes.BAD_REQUEST
      )
    );
  }
  loanApplication.isDeleted = true;
  await loanApplication.save();
  return successMessage(
    StatusCodes.OK,
    res,
    "Loan application cancelled successfully",
    null
  );
});

// method get
// API Route: GET /api/v1/vender/loanApplications
// Permissi/vender/wallet
// Permission (only vender can doon (only vender can do this) with token
// desc get all loan application
const getLoanApplications = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const loanApplications = await loanApplication_model
    .find({
      venderId,
      isDeleted: false,
    })
    .sort({ createdAt: -1 });
  successMessage(202, res, "all loan Application fetched", loanApplications);
});

// method get
// API Route: GET /api/v1/vender/wallet
// desc get wallet
const getWallet = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  let wallet = await wallet_model.findOne({ venderId });
  if (!wallet) {
    wallet = await wallet_model.create({ venderId, totalAmount: 0 });
  }
  return successMessage(StatusCodes.OK, res, "Wallet fetched", wallet);
});

// method post
// API Route: POST /api/v1/vender/transaction
// Permission (only vender can do this) with token
const transaction = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const { error, value } = transactionSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(error.details[0].message, StatusCodes.BAD_REQUEST)
    );
  }
  const wallet = await wallet_model.findOne({ venderId });
  if (!wallet) {
    await wallet_model.create({
      venderId,
      totalAmount: 0,
    });
  }
  let transaction;
  if (value.transactionType === 0) {
    const wallet = await wallet_model.findOne({ venderId });
    wallet.totalAmount += value.amount;
    await wallet.save();
    transaction = await transaction_model.create({
      venderId,
      ...value,
    });
  } else if (value.transactionType === 1) {
    const wallet = await wallet_model.findOne({ venderId });

    if (wallet.totalAmount < value.amount) {
      return next(new AppError("Insufficient funds in your wallet", 400));
    }
    wallet.totalAmount -= value.amount;
    await wallet.save();
    transaction = await transaction_model.create({
      venderId,
      ...value,
    });
  }
  return successMessage(
    StatusCodes.CREATED,
    res,
    "Transaction submitted successfully",
    transaction
  );
});

// method get
// API Route: GET /api/v1/vender/transactions
// Permission (only vender can do this) with token
const getTransactions = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const transactions = await transaction_model
    .find({
      venderId,
    })
    .sort({ createdAt: -1 });
  successMessage(202, res, "all transactions fetched", transactions);
});

// method post
// API Route: POST /api/v1/vender/debtor
// Permission (only vender can do this) with token
const createDebtor = catchAsync(async (req, res, next) => {
  const { error, value } = debtorValidationSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(error.details[0].message, StatusCodes.BAD_REQUEST)
    );
  }
  const imageExists = await imageExistInAWSbucket(value.image);
  if (!imageExists) {
    return next(
      new AppError("This image does not exist in the AWS bucket", 400)
    );
  }
  const checkImageInRecords = await checkDuplicateAwsImgInRecords(
    value.image,
    "image"
  );
  if (!checkImageInRecords.success) {
    return next(new AppError(checkImageInRecords.error, 400));
  }
  const debtor = await debtor_model.create({ venderId: req.user.id, ...value });
  debtor.image = await generateSignedUrl(debtor.image);
  return successMessage(202, res, "Debtor created", debtor);
});

// method get
// API Route: GET /api/v1/vender/debtor
// Permission (only vender can do this) with token
// get all debtors
const getDebtors = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  let debtors = await debtor_model.find({ venderId });
  debtors = await extractImgUrlAllRecordAWSflexible(debtors, "image");
  return successMessage(202, res, "All debtors fetched", debtors);
});
// method put
// API Route: PUT /api/v1/vender/debtor
// Permission (only vender can do this) with token
// update debtor
const updateDebtor = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const debtorId = req.query.debtorId;
  if (!debtorId) {
    return next(new AppError("debtorId is required", 400));
  }
  if (!isValidObjectId(debtorId)) {
    return next(new AppError("debtorId is not valid", 400));
  }
  const { error, value } = debtorEditValidationSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(error.details[0].message, StatusCodes.BAD_REQUEST)
    );
  }
  const debtor = await debtor_model.findOne({
    _id: req.query.debtorId,
    venderId,
  });
  if (!debtor) {
    return next(new AppError("debtor not found", 400));
  }
  if (value.image) {
    value.image = getFileNameFromUrl(value.image);
    if (debtor.image !== value.image) {
      console.log(value.image);
      const imageExists = await imageExistInAWSbucket(value.image);
      if (!imageExists) {
        return next(
          new AppError("This image does not exist in the AWS bucket", 400)
        );
      }
      const checkImageInRecords = await checkDuplicateAwsImgInRecords(
        value.image,
        "image"
      );
      if (!checkImageInRecords.success) {
        return next(new AppError(checkImageInRecords.error, 400));
      }
      await deleteFile(debtor.image, process.env.AWS_BUCKET_NAME);
    }
  }
  const debtorUpdated = await debtor_model.findOneAndUpdate(
    { _id: req.query.debtorId, venderId },
    value,
    { new: true }
  );
  debtorUpdated.image = await generateSignedUrl(debtorUpdated.image);
  return successMessage(202, res, "Debtor updated", debtorUpdated);
});
// method delete
// API Route: DELETE /api/v1/vender/debtor
// Permission (only vender can do this) with token
// delete debtor
const deleteDebtor = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const debtorId = req.query.debtorId;
  if (!debtorId) {
    return next(new AppError("debtorId is required", 400));
  }
  if (!isValidObjectId(debtorId)) {
    return next(new AppError("debtorId is not valid", 400));
  }
  const debtor = await debtor_model.findByIdAndDelete({
    _id: debtorId,
    venderId,
  });
  if (!debtor) {
    return next(new AppError("debtor not found", 400));
  }
  await deleteFile(debtor.image, process.env.AWS_BUCKET_NAME);
  return successMessage(202, res, "Debtor deleted", null);
});

// method post
// API Route: POST /api/v1/vender/debtor/loanRemainderEmail
// Permission (only vender can do this) with token
// send loan remainder email
const sendLoanRemainderEmail = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const { error, value } = debtNotificationSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(error.details[0].message, StatusCodes.BAD_REQUEST)
    );
  }
  await new debtRemainderEmail({
    ...value,
    email: value.debtorEmail,
  }).send();
  const debtRemainder = await debtRemainder_model.create({
    venderId,
    ...value,
  });
  return successMessage(
    StatusCodes.CREATED,
    res,
    "Debt notification created",
    debtRemainder
  );
});

// method get
// Api Route  GET /api/v1/vender/expenseAndIncomes
// only vender can do this
const getSalesAndExpense = catchAsync(async (req, res, next) => {
  let expense = await expense_model.find({ venderId: req.user.id }).lean();
  let expenseAmount = 0;
  if (expense.length > 0) {
    expense = expense.map((item) => {
      expenseAmount += item.expenseAmount;
      return { ...item, type: "expense" };
    });
  }

  let income = await income_model.find({ venderId: req.user.id }).lean();
  let incomeAmount = 0;
  if (income.length > 0) {
    income = income.map((item) => {
      incomeAmount += item.incomeAmount;
      return { ...item, type: "income" };
    });
  }

  // Concatenate expense and income arrays into a single array
  const incomeAndExpense = [...expense, ...income];

  // Sort the combined array based on the dateCreated field in descending order
  incomeAndExpense.sort((a, b) => b.dateCreated - a.dateCreated);

  return successMessage(202, res, "fetched", {
    incomeAndExpense,
    expenseAmount,
    incomeAmount,
  });
});

module.exports = {
  register,
  login,
  logout,
  forgetPassword,
  otpCheaker,
  getUserProfile,
  updateUserProfile,
  makePaystack_custVender,
  analytics,
  deleteVender,
  loanApplication,
  cancelLoanApplication,
  getLoanApplications,
  getWallet,
  transaction,
  getTransactions,
  createDebtor,
  getDebtors,
  updateDebtor,
  deleteDebtor,
  sendLoanRemainderEmail,
  getSalesAndExpense,
};
