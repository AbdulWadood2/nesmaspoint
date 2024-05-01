/* emails for sent */
const { Email } = require("../utils/emails");
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
/* file System */
const fs = require("fs");
/* models */
const buyer_model = require("../Model/buyer_model");
const customer_model = require("../Model/customer_model");
const vender_model = require("../Model/vender_model");
/* for hashing */
const CryptoJS = require("crypto-js");
/* verification component */
const { signToken, signRefreshToken } = require("../utils/verifyToken_util");
/* utilities functions */
const {
  generateRandomString,
  validateEmailAndPassword,
  successMessage,
  validatePassword,
  deleteFile,
  imageExistInAWSbucket,
  checkDuplicateAwsImgInRecords,
  extractImgUrlSingleRecordAWSflexible,
} = require("../functions/utility.functions");
const {
  validateBuyerSignUp,
  validateBuyerEdit,
} = require("../utils/joi_validator_util");

// route /api/v1/buyer/signup
// method POST
// @privacy only buyer can do this
const register = async (req, res, next) => {
  try {
    let { firstName, lastName, email, password } = req.body;
    const errors = [];
    const result = validateBuyerSignUp(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        next(
          new AppError(
            result.error.details.map((error) => error.message + " in req.body"),
            StatusCodes.BAD_REQUEST
          )
        )
      );
    }
    if (errors.length > 0) {
      return next(
        new AppError(
          `${errors.join(" and ")} are required in request`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Check if the user already exists
    const isBuyerExist = await buyer_model.findOne({ email });
    if (isBuyerExist) {
      return next(
        new AppError("User is already exist", StatusCodes.BAD_REQUEST)
      );
    } else {
      // Password encryption (you might want to improve the encryption method)
      let encryptPassword = CryptoJS.AES.encrypt(
        req.body.password,
        process.env.CRYPTO_SEC
      ).toString();
      const newBuyer = await buyer_model.create({
        firstName,
        lastName,
        email,
        password: encryptPassword,
        dateCreated: Date.now(),
      });
      await newBuyer.save();
      const { password, refreshToken, ...others } = newBuyer._doc;
      // Send Verification Email (implement email sending logic here)
      return successMessage(
        StatusCodes.ACCEPTED,
        res,
        "buyer register successfully",
        { ...others }
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// route /api/v1/buyer/login
// method POST
// @privacy only buyer can do this
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const buyerId = await buyer_model.findOne({ email });
    if (!buyerId) {
      return next(new AppError("buyer not found", StatusCodes.BAD_REQUEST));
    }
    const check = validateEmailAndPassword(email, password);
    if (check.length > 0) {
      return next(new AppError(check, StatusCodes.BAD_REQUEST));
    }
    let buyer = await buyer_model.findOne({ email });
    // Check if buyer exist or not
    if (!buyer) {
      // return res
      //   .status(StatusCodes.NOT_FOUND)
      //   .json({ success: false, error: "User not found", data: null });
      return next(new AppError("buyer not found", StatusCodes.NOT_FOUND));
    } else {
      // Decrypt the password which is stored in Encryption form in database
      const hashedPassword = CryptoJS.AES.decrypt(
        buyer.password,
        process.env.CRYPTO_SEC
      );
      const realPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
      if (realPassword !== password) {
        return next(
          new AppError("password is incorrect", StatusCodes.BAD_REQUEST)
        );
      } else {
        const randomString = generateRandomString(40);
        // Create refresh Token
        const refreshTokenIs = signRefreshToken(randomString);
        // ectually it is access token
        const accessToken = signToken(buyer._id, randomString);
        let buyerIs = await buyer_model.findByIdAndUpdate(buyer._id);
        buyerIs.refreshToken.push(refreshTokenIs);
        await buyerIs.save();
        let { password, refreshToken, ...others } = buyerIs._doc;
        if (others.profileImage) {
          others = await extractImgUrlSingleRecordAWSflexible(
            others,
            "profileImage"
          );
        }
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
        return successMessage(StatusCodes.ACCEPTED, res, "login successfully", {
          ...others,
          // accessToken,
          // refreshToken: refreshTokenIs,
        });
      }
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/buyer/getProfile
// method get
// @privacy only buyer can do this
const getProfile = async (req, res, next) => {
  try {
    let buyer = await buyer_model
      .findById(req.user.id)
      .select("-refreshToken -password");
    if (buyer.profileImage) {
      buyer = await extractImgUrlSingleRecordAWSflexible(buyer, "profileImage");
    }
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "this is buyer profile",
      buyer
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// route /api/v1/buyer/logout
// method POST
// @privacy only buyer can do this
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
    const buyer = await buyer_model.findOne({ refreshToken });
    if (!buyer) {
      return next(
        new AppError("this refreshToken not exist", StatusCodes.BAD_REQUEST)
      );
    }

    await buyer_model.updateOne(
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
// route /api/v1/buyer/forgetPassword
// method GET
// @privacy only buyer can do this
const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await buyer_model.findOne({ email });
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
        new AppError("no user with this email", StatusCodes.NOT_FOUND)
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// route /api/v1/buyer/setPassword
// method GET
// @privacy only buyer can do this
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
    const user = await buyer_model.findOne({ email });

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }
    if (!user.forgetPassword) {
      return next(
        new AppError(
          "Unable to change password without OTP.",
          StatusCodes.NOT_FOUND
        )
      );
    }
    if (encryptOpts !== user.forgetPassword) {
      return next(
        new AppError(
          "Generate OTP first before resetting the password.",
          StatusCodes.NOT_FOUND
        )
      );
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
// API Route: PUT /api/v1/buyer/profile
// Permission (only buyer can do this)
const updateBuyerProfile = async (req, res, next) => {
  try {
    // Assuming you have the buyer ID from the token
    const buyerId = req.user.id;

    // Validate the request body against the schema
    const validationResult = validateBuyerEdit(req.body);

    // If validation fails, return an error response
    if (validationResult.error) {
      return next(
        new AppError(
          validationResult.error.details.map(
            (error) => error.message + " in req.body"
          ),
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Fetch the buyer from the database
    let buyer = await buyer_model.findById(buyerId);

    if (!buyer) {
      return next(new AppError("Buyer not found.", StatusCodes.NOT_FOUND));
    }

    // Update buyer data based on the request body
    const { firstName, lastName, password } = req.body;

    // Validate and update the fields you want to allow updating
    if (firstName) buyer.firstName = firstName;
    if (lastName) buyer.lastName = lastName;
    if (password) {
      const passwordValidation = validatePassword(password);

      if (passwordValidation.length > 0) {
        return next(new AppError(passwordValidation, StatusCodes.BAD_REQUEST));
      }

      // Encrypt and update the password
      buyer.password = CryptoJS.AES.encrypt(
        password,
        process.env.CRYPTO_SEC
      ).toString();
    }

    if (buyer.profileImage) {
      if (req.body.profileImage === null) {
        await deleteFile(buyer.profileImage, process.env.AWS_BUCKET_NAME);
        buyer.profileImage = null;
      }
    }
    if (req.body.profileImage) {
      if (buyer.profileImage == req.body.profileImage) {
        buyer.profileImage = req.body.profileImage;
      } else if (buyer.profileImage) {
        const awsimage = await imageExistInAWSbucket(req.body.profileImage);
        if (!awsimage) {
          return next(
            new AppError(
              "this image not exists in aws bucket.",
              StatusCodes.BAD_REQUEST
            )
          );
        }
        const result = await checkDuplicateAwsImgInRecords(
          req.body.profileImage,
          "profileImage"
        );

        if (!result.success) {
          return next(new AppError(result.error, StatusCodes.BAD_REQUEST));
        }
        await deleteFile(buyer.profileImage, process.env.AWS_BUCKET_NAME);
        buyer.profileImage = req.body.profileImage;
      } else {
        const awsimage = await imageExistInAWSbucket(req.body.profileImage);
        if (!awsimage) {
          return next(
            new AppError(
              "this image not exists in aws bucket.",
              StatusCodes.BAD_REQUEST
            )
          );
        }
        const result = await checkDuplicateAwsImgInRecords(
          req.body.profileImage,
          "profileImage"
        );

        if (!result.success) {
          return next(new AppError(result.error, StatusCodes.BAD_REQUEST));
        }
        buyer.profileImage = req.body.profileImage;
      }
    }
    buyer.dateModified = Date.now();
    // Save the updated buyer data
    await buyer.save();

    // Omit sensitive information like password
    let { password: _, refreshToken, ...updatedBuyerProfile } = buyer._doc;
    updatedBuyerProfile = await extractImgUrlSingleRecordAWSflexible(
      updatedBuyerProfile,
      "profileImage"
    );
    return successMessage(
      StatusCodes.OK,
      res,
      "Buyer profile updated successfully",
      updatedBuyerProfile
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
  forgetPassword,
  otpCheaker,
  updateBuyerProfile,
};
