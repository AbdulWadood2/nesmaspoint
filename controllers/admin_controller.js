/* emails for sent */
const { Email } = require("../utils/emails");
/* status codes */
const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require("http-status-codes");
/* custom error */
/* models */
const admin_model = require("../Model/admin_model");
const LoanPackage = require("../Model/loanPackage_model");
const loanApplication_model = require("../Model/loanApplication_model");
const termAndConditions_model = require("../Model/termAndConditions_model");
const help_model = require("../Model/help_model");
/* for hashing */
const CryptoJS = require("crypto-js");
/* verification component */
const { signToken, signRefreshToken } = require("../utils/verifyToken_util");
/* error handling */
const AppError = require("../utils/appError");
/* catchAsync */
const catchAsync = require("../utils/catchAsync");
/* utility functions */
const {
  validateEmail,
  validatePassword,
  validateEmailAndPassword,
  successMessage,
  generateSignedUrl,
  deleteFile,
  extractImgUrlSingleRecordAWSflexible,
  imageExistInAWSbucket,
  checkDuplicateAwsImgInRecords,
  isAwsS3Url,
  getFileNameFromUrl,
} = require("../functions/utility.functions");
const {
  loanPackageSchema,
  editLoanApplicationSchema,
  helpSchema,
} = require("../utils/joi_validator_util");
// method POST
// route /api/v1/admin/login
// privacy only admin can do this
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const check = validateEmailAndPassword(email, password);
    if (check.length > 0) {
      return next(new AppError(check, StatusCodes.BAD_REQUEST));
    }
    const admin = await admin_model.findOne({ email });
    // Check if admin exist or not
    if (!admin) {
      return next(new AppError("admin not found", StatusCodes.BAD_REQUEST));
    } else {
      // Decrypt the password which is stored in Encryption form in database
      const hashedPassword = CryptoJS.AES.decrypt(
        admin.password,
        process.env.CRYPTO_SEC
      );
      const realPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
      if (realPassword !== password) {
        return next(
          new AppError("password is incorrect", StatusCodes.BAD_REQUEST)
        );
      } else {
        function generateRandomString(length) {
          const characters =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let randomString = "";

          for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomIndex);
          }

          return randomString;
        }
        const randomString = generateRandomString(40);
        // Create refresh Token
        const refreshTokenIs = signRefreshToken(randomString);
        // ectually it is access token
        const accessToken = signToken(admin._id, randomString);
        let adminIs = await admin_model.findByIdAndUpdate(
          admin._id,
          { $push: { refreshToken: refreshTokenIs } },
          { new: true, select: "-password -refreshToken" }
        );

        // Check and extract the image URL if it exists
        if (adminIs.profileImg) {
          adminIs = await extractImgUrlSingleRecordAWSflexible(
            adminIs,
            "profileImg"
          );
        }
        adminIs = JSON.stringify(adminIs);
        adminIs = JSON.parse(adminIs);
        const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000; // milliseconds in one year
        const maxAge = 1000 * oneYearInMilliseconds; // 1000 years in milliseconds

        res.cookie("accessToken", accessToken, {
          maxAge: maxAge,
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
        });

        res.cookie("refreshToken", refreshTokenIs, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: maxAge,
          path: "/",
        });
        return successMessage(StatusCodes.ACCEPTED, res, "login success", {
          ...adminIs,
        });
      }
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// method POST
// route /api/v1/admin/logout
// privacy only specific admin can do this
const logout = async (req, res, next) => {
  try {
    let refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(
        new AppError(
          "refreshToken in cookies is required",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const buyer = await admin_model.findOne({ refreshToken });
    if (!buyer) {
      return next(
        new AppError("this refreshToken not exist", StatusCodes.BAD_REQUEST)
      );
    }

    await admin_model.updateOne(
      { refreshToken: refreshToken },
      { $pull: { refreshToken: refreshToken } }
    );

    // Clear both refreshToken and accessToken cookies
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

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
// method GET
// route /api/v1/admin/forgetPassword
// privacy only admin can do this
// @details generate send otp
const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await admin_model.findOne({ email });
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
      user.forgetPassword = encodeURIComponent(otp);
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
// method POST
// route /api/v1/admin/setPassword
// privacy only admin can do this
// @details check otp then change password
const otpCheaker = async (req, res, next) => {
  try {
    const { email, encryptOpts, otp, newPassword } = req.body;
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
        new AppError("Invalid verification code.", StatusCodes.BAD_REQUEST)
      );
    }

    // Check if the OTP has expired
    const currentTime = new Date().getTime();
    if (currentTime > expirationTime) {
      return next(
        new AppError("Verification code has expired.", StatusCodes.BAD_REQUEST)
      );
    }
    // Find the user by email
    const user = await admin_model.findOne({ email });

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }
    if (!user.forgetPassword) {
      return next(
        new AppError(
          "Unable to change password without OTP",
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

/* profile section */
// method GET
// route /api/v1/admin/userProfile
// @privacy only admin can do this
// @detail get profile
const getUserProfile = async (req, res, next) => {
  try {
    // Assuming you have the user ID from the token
    const userId = req.user.id;
    user = await admin_model.findById(userId).select("-password -refreshToken");

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }
    if (user.profileImg) {
      user = await extractImgUrlSingleRecordAWSflexible(user, "profileImg");
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
// method PUT
// route /api/v1/admin/userProfile
// @privacy only admin can do this
// @detail edit profile
const updateUserProfile = async (req, res, next) => {
  try {
    // Assuming you have the user ID from the token
    const userId = req.user.id;

    // Fetch the user from the database
    let user = await admin_model.findById(userId);

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }

    // Update user data based on the request body
    let { name, password, profileImg } = req.body;

    // Validate and update the fields you want to allow updating
    if (name) user.name = name;
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
    if (user.profileImg) {
      if (profileImg === null) {
        await deleteFile(user.profileImg, process.env.AWS_BUCKET_NAME);
        user.profileImg = null;
      }
    }
    if (profileImg) {
      if (isAwsS3Url(profileImg)) {
        profileImg = getFileNameFromUrl(profileImg);
      }
      if (user.profileImg == profileImg) {
        user.profileImg = profileImg;
      } else if (user.profileImg) {
        let awsimage;
        if (isAwsS3Url(profileImg)) {
          awsimage = getFileNameFromUrl(profileImg);
          awsimage = await imageExistInAWSbucket(awsimage);
        } else {
          awsimage = await imageExistInAWSbucket(profileImg);
        }
        if (!awsimage) {
          return next(
            new AppError(
              "this image not exists in aws bucket.",
              StatusCodes.BAD_REQUEST
            )
          );
        }
        const result = await checkDuplicateAwsImgInRecords(
          profileImg,
          "profileImg"
        );

        if (!result.success) {
          return next(new AppError(result.error, StatusCodes.BAD_REQUEST));
        }
        await deleteFile(user.profileImg, process.env.AWS_BUCKET_NAME);
        user.profileImg = profileImg;
      } else {
        const awsimage = await imageExistInAWSbucket(profileImg);
        if (!awsimage) {
          return next(
            new AppError(
              "this image not exists in aws bucket.",
              StatusCodes.BAD_REQUEST
            )
          );
        }
        user.profileImg = profileImg;
      }
    }
    user.dateModified = Date.now();
    // Save the updated user data
    await user.save();

    // Omit sensitive information like password and refresh token
    let { password: _, refreshToken, ...updatedUserProfile } = user._doc;
    if (updatedUserProfile.profileImg) {
      const awsimage = await imageExistInAWSbucket(
        updatedUserProfile.profileImg
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
          updatedUserProfile.profileImg
        );
        return {
          ...updatedUserProfile,
          profileImg: signedUrl,
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
// function isValidMilliseconds(value) {
//   const milliseconds = parseInt(value, 10); // Parse value as an integer

//   // Check if milliseconds is a valid number and falls within a reasonable range
//   return (
//     !isNaN(milliseconds) && milliseconds >= 0 && milliseconds <= Date.now()
//   );
// }
// function dateStringToMilliseconds(dateString) {
//   if (isValidMilliseconds(dateString)) {
//     return dateString; // Not a number
//   }
//   return Date.parse(dateString);
// }
// const model = require("../Model/sales_model");
// const edit = async (req, res, next) => {
//   const items = await model.find();
//   const records = [];
//   for (let item of items) {
//     const record = await model.findOne({ _id: item._id });
//     if (record.dateCreated) {
//       record.dateCreated = dateStringToMilliseconds(record.dateCreated);
//     }
//     if (record.dateModified) {
//       record.dateModified = dateStringToMilliseconds(record.dateModified);
//     }
//     await record.save();
//     records.push(record);
//     console.log(record);
//   }
//   console.log(records);
// };
// // edit();

// method POST
// route /api/v1/admin/loanPackage
// privacy only admin can do this
const makeLoanPackage = catchAsync(async (req, res, next) => {
  const { error, value } = loanPackageSchema.validate(req.body);
  // If validation fails, return an error response
  if (error) {
    return next(
      new AppError(
        error.details.map((error) => error.message),
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const newLoanPackage = await LoanPackage.create(value);
  return successMessage(
    201,
    res,
    "Loan package created successfully",
    newLoanPackage
  );
});

// method GET
// route /api/v1/admin/loanPackage
// privacy all can do this
const getLoanPackages = catchAsync(async (req, res, next) => {
  let loanPackages = await LoanPackage.find({ isDeleted: false }).sort(
    {createdAt: -1}
  );
  return successMessage(
    StatusCodes.OK,
    res,
    "Loan packages retrieved successfully",
    loanPackages
  );
});

// method delete
// route /api/v1/admin/loanPackage
// privacy only admin can do this
const deleteLoanPackage = catchAsync(async (req, res, next) => {
  const { loanPackageId } = req.query;
  if (!loanPackageId) {
    return next(new AppError("Please provide loan package ID", 400));
  }
  const loanPackage = await LoanPackage.findById(loanPackageId);
  if (!loanPackage) {
    return next(new AppError("Loan package not found", 400));
  }
  const deletedLoanPackage = await LoanPackage.findByIdAndUpdate(
    loanPackageId,
    { isDeleted: true },
    { new: true }
  );
  return successMessage(202, res, "Loan package deleted successfully", null);
});

// method put
// route /api/v1/admin/loanPackage
// privacy only admin can do this
const editLoanPackage = catchAsync(async (req, res, next) => {
  const { loanPackageId } = req.query;
  if (!loanPackageId) {
    return next(new AppError("Please provide loan package ID", 400));
  }
  const loanPackage = await LoanPackage.findById(loanPackageId);
  if (!loanPackage) {
    return next(new AppError("Loan package not found", 400));
  }
  const { error, value } = loanPackageSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(
        error.details.map((error) => error.message),
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const updatedLoanPackage = await LoanPackage.findByIdAndUpdate(
    loanPackageId,
    value,
    { new: true }
  );
  return successMessage(
    202,
    res,
    "Loan package updated successfully",
    updatedLoanPackage
  );
});

// method GET
// route /api/v1/admin/loanApplications
// privacy admin can do this only
const getLoanApplications = catchAsync(async (req, res, next) => {
  const loanApplications = await loanApplication_model.find({
    isDeleted: false,
  });
  return successMessage(
    202,
    res,
    "all loanApplications fetched",
    loanApplications
  );
});

// method PUT
// route /api/v1/admin/loanApplication
// privacy admin can do this only
const editLoanApplication = catchAsync(async (req, res, next) => {
  const { loanApplicationId } = req.query;
  if (!loanApplicationId) {
    return next(new AppError("Please provide loan application ID", 400));
  }
  const loanApplication = await loanApplication_model.findById(
    loanApplicationId
  );
  if (!loanApplication) {
    return next(new AppError("Loan application not found", 400));
  }
  const { error, value } = editLoanApplicationSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(
        error.details.map((error) => error.message),
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const updatedLoanApplication = await loanApplication_model.findByIdAndUpdate(
    loanApplicationId,
    value,
    { new: true }
  );
  return successMessage(
    202,
    res,
    "Loan application updated successfully",
    updatedLoanApplication
  );
});

// method post
// route /api/v1/admin/termsAndConditions
// privacy only admin can do this
const createUpdateTermAndConditions = async (req, res, next) => {
  const { content } = req.body;
  if (!content) {
    return next(new AppError("Content is required", StatusCodes.BAD_REQUEST));
  }
  const termAndConditions = await termAndConditions_model.findOne();
  if (termAndConditions) {
    termAndConditions.content = content;
    await termAndConditions.save();
    return successMessage(
      StatusCodes.OK,
      res,
      "Term and conditions updated successfully",
      termAndConditions
    );
  } else {
    const newTermAndConditions = await termAndConditions_model.create({
      content,
    });
    return successMessage(
      StatusCodes.CREATED,
      res,
      "Term and conditions created successfully",
      newTermAndConditions
    );
  }
};

// method GET
// route /api/v1/admin/termsAndConditions
// privacy all can do this
const getTermAndConditions = async (req, res, next) => {
  const termAndConditions = await termAndConditions_model.findOne();
  if (!termAndConditions) {
    return next(new AppError("No term and conditions found", 404));
  }
  return successMessage(
    StatusCodes.OK,
    res,
    "Term and conditions retrieved successfully",
    termAndConditions
  );
};

// method POST
// route /api/v1/admin/help
// privacy admin can do this only
// description create or update help
const createUpdateHelp = catchAsync(async (req, res, next) => {
  const { error, value } = helpSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(
        error.details.map((error) => error.message),
        400
      )
    );
  }
  const help = await help_model.findOne();
  if (help) {
    help.callPhoneNumber = value.callPhoneNumber;
    help.chatWhatsAppPhoneNumber = value.chatWhatsAppPhoneNumber;
    help.contactEmail = value.contactEmail;
    await help.save();
    return successMessage(202, res, "Help updated successfully", help);
  } else {
    const newHelp = await help_model.create(value);
    return successMessage(202, res, "Help created successfully", newHelp);
  }
});

// method GET
// route /api/v1/admin/help
// privacy all can do this
// description get help
const getHelp = catchAsync(async (req, res, next) => {
  const help = await help_model.findOne();
  if (!help) {
    return next(new AppError("No help found", 404));
  }
  return successMessage(202, res, "Help retrieved successfully", help);
});

module.exports = {
  login,
  logout,
  forgetPassword,
  otpCheaker,
  getUserProfile,
  updateUserProfile,
  makeLoanPackage,
  getLoanPackages,
  deleteLoanPackage,
  editLoanPackage,
  getLoanApplications,
  editLoanApplication,
  createUpdateTermAndConditions,
  getTermAndConditions,
  createUpdateHelp,
  getHelp,
};
