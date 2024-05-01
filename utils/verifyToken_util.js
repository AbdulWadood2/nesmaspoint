/* status codes */
const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require("http-status-codes");
const JWT = require("jsonwebtoken");
/* error */

const CryptoJS = require("crypto-js");

const AppError = require("./appError");
/* models */
const admin_model = require("../Model/admin_model");
const vender_model = require("../Model/vender_model");
const buyer_model = require("../Model/buyer_model");
const {
  successMessage,
  extractImgUrlSingleRecordAWSflexible,
  generateRandomString,
} = require("../functions/utility.functions");

const signRefreshToken = (uniqueId) => {
  return JWT.sign({ uniqueId }, process.env.JWT_SEC);
};

const signToken = (id, uniqueId) => {
  return JWT.sign({ id, uniqueId }, process.env.JWT_SEC, {
    expiresIn: process.env.expirydateJwt,
  });
};
// Verify token and admin
const verifyTokenAndAdmin = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    if (!token) {
      return next(new AppError("you are not login", StatusCodes.BAD_REQUEST));
    }
    const payload = JWT.verify(token, process.env.JWT_SEC);
    let user = await admin_model.findById(payload.id);
    if (!user) {
      return next(
        new AppError(
          "Access Denied! only do this by admin",
          StatusCodes.UNAUTHORIZED
        )
      );
    }
    // const payloadunique = [];
    // for (let item of user.refreshToken) {
    //   const token = JWT.verify(item, process.env.JWT_SEC);
    //   payloadunique.push(token.uniqueId);
    // }
    // if (!payloadunique.includes(payload.uniqueId)) {
    //   return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    // }
    try {
      const verified = JWT.verify(token, process.env.JWT_SEC);
      let user = await admin_model.findById(verified.id);
      req.user = user;
      next();
    } catch (error) {
      return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.UNAUTHORIZED));
  }
};
// verify vender
const verifyVender = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    if (!token) {
      return next(new AppError("you are not login", StatusCodes.BAD_REQUEST));
    }
    token = token.split(" ");
    token = token[1];
    const payload = JWT.verify(token, process.env.JWT_SEC);
    let user = await vender_model.findById(payload.id);
    if (!user) {
      return next(new AppError("you are not login", StatusCodes.BAD_REQUEST));
    }
    if (user.isDeleted) {
      return next(
        new AppError("your account deleted", StatusCodes.BAD_REQUEST)
      );
    }
    if (!user.isActive) {
      return next(
        new AppError(
          "you are now unactivate user plz say nesmaspoint admin for active you",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!user) {
      return next(
        new AppError(
          "Access Denied! only do this by vender",
          StatusCodes.UNAUTHORIZED
        )
      );
    }
    // const payloadunique = [];
    // for (let item of user.refreshToken) {
    //   const token = JWT.verify(item, process.env.JWT_SEC);
    //   payloadunique.push(token.uniqueId);
    // }
    // if (!payloadunique.includes(payload.uniqueId)) {
    //   return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    // }
    try {
      const verified = JWT.verify(token, process.env.JWT_SEC);
      const user = await vender_model.findById(verified.id);
      req.user = user;
      next();
    } catch (error) {
      return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.UNAUTHORIZED));
  }
};
// verify buyer
const verifyBuyer = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    if (!token) {
      return next(new AppError("you are not login", StatusCodes.BAD_REQUEST));
    }
    const payload = JWT.verify(token, process.env.JWT_SEC);
    console.log(payload);
    let user = await buyer_model.findById(payload.id);
    if (!user) {
      return next(
        new AppError(
          "Access Denied! only do this by buyer",
          StatusCodes.UNAUTHORIZED
        )
      );
    }
    // const payloadunique = [];
    // for (let item of user.refreshToken) {
    //   const token = JWT.verify(item, process.env.JWT_SEC);
    //   payloadunique.push(token.uniqueId);
    // }
    // if (!payloadunique.includes(payload.uniqueId)) {
    //   return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    // }
    try {
      const verified = JWT.verify(token, process.env.JWT_SEC);
      const user = await buyer_model.findById(verified.id);
      req.user = user;
      next();
    } catch (error) {
      return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.UNAUTHORIZED));
  }
};
// admin and vender and user both use this middleware
const verifyAll = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    if (!token) {
      token = req.header("Authorization");
      token = token.split(" ");
      token = token[1];
    }
    if (!token) {
      return next(new AppError("you are not login", StatusCodes.BAD_REQUEST));
    }
    const payload = JWT.verify(token, process.env.JWT_SEC);
    let admin = await admin_model.findById(payload.id);
    let vender = await vender_model.findById(payload.id);
    let buyer = await buyer_model.findById(payload.id);
    user = admin ? admin : vender ? vender : buyer ? buyer : false;
    if (!user) {
      return next(
        new AppError(
          "Access Denied! this is not a valid token",
          StatusCodes.UNAUTHORIZED
        )
      );
    }
    // const payloadunique = [];
    // for (let item of user.refreshToken) {
    //   const token = JWT.verify(item, process.env.JWT_SEC);
    //   payloadunique.push(token.uniqueId);
    // }
    // if (!payloadunique.includes(payload.uniqueId)) {
    //   return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    // }
    try {
      const verified = JWT.verify(token, process.env.JWT_SEC);
      if (verified) {
        req.user = user;
      }
      next();
    } catch (error) {
      return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.UNAUTHORIZED));
  }
};

/* refreshToken for vender only*/
const refreshToken = async (req, res, next) => {
  try {
    let refreshToken = req.header("Authorization");
    if (!refreshToken) {
      return next(
        new AppError("refreshToken in req is required", StatusCodes.BAD_REQUEST)
      );
    }
    refreshToken = refreshToken.split(" ");
    refreshToken = refreshToken[1];

    // Retrieve the user from the database based on the refresh token
    let vender = await vender_model.findOne({ refreshToken });
    let user = vender ? vender : null;
    if (!user) {
      throw new Error("User not found or invalid refresh token.");
    }
    let payload;
    let flag = false;
    try {
      payload = JWT.verify(refreshToken, process.env.JWT_SEC);
    } catch (error) {
      // return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
      vender = await vender_model.findById(buyer.id).lean();
      vender = await vender_model.updateOne(
        { _id: vender._id },
        { $pull: { refreshToken: refreshToken } }
      );
      const randomString = generateRandomString(40);
      // Create refresh Token
      refreshToken = signRefreshToken(randomString);
      flag = true;
    }
    // Issue a new access token
    const newAccessToken = signToken(user.id, payload.uniqueId);
    return successMessage(StatusCodes.ACCEPTED, res, null, {
      accessToken: newAccessToken,
      refreshToken: flag ? refreshToken : undefined,
    });
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
const refreshTokenForBuyer = async (req, res, next) => {
  try {
    console.log(req.cookies.refreshToken);
    let refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(
        new AppError("refreshToken in req is required", StatusCodes.BAD_REQUEST)
      );
    }

    let buyer = await buyer_model
      .findOne({ refreshToken })
      .select("-password -refreshToken");
    let user = buyer ? buyer : null;
    if (!user) {
      throw new Error("User not found or invalid refresh token.");
    }
    let payload;
    try {
      payload = JWT.verify(refreshToken, process.env.JWT_SEC);
    } catch (error) {
      // return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
      buyer = await buyer_model.findById(buyer.id).lean();
      buyer = await buyer_model.updateOne(
        { _id: buyer._id },
        { $pull: { refreshToken: refreshToken } }
      );
      const randomString = generateRandomString(40);
      // Create refresh Token
      refreshToken = signRefreshToken(randomString);
    }
    // Issue a new access token
    const newAccessToken = signToken(user.id, payload.uniqueId);
    if (buyer.profileImage) {
      buyer = await extractImgUrlSingleRecordAWSflexible(buyer, "profileImage");
    }
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "accessToken set successfully",
      buyer
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
const refreshTokenForAdmin = async (req, res, next) => {
  try {
    let refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(
        new AppError("refreshToken in req is required", StatusCodes.BAD_REQUEST)
      );
    }

    // Retrieve the user from the database based on the refresh token
    let admin = await admin_model
      .findOne({ refreshToken })
      .select("-password -refreshToken");
    let user = admin ? admin : null;
    if (!user) {
      throw new Error("User not found or invalid refresh token.");
    }
    let payload;
    try {
      payload = JWT.verify(refreshToken, process.env.JWT_SEC);
    } catch (error) {
      // return next(new AppError("Invalid Token", StatusCodes.UNAUTHORIZED));
      admin = await admin_model.findById(admin.id).lean();
      admin = await admin_model.updateOne(
        { _id: admin._id },
        { $pull: { refreshToken: refreshToken } }
      );
      const randomString = generateRandomString(40);
      // Create refresh Token
      refreshToken = signRefreshToken(randomString);
    }
    // Issue a new access token
    const newAccessToken = signToken(user.id, payload.uniqueId);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    // Check and extract the image URL if it exists
    if (admin.profileImg) {
      admin = await extractImgUrlSingleRecordAWSflexible(admin, "profileImg");
    }
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "accessToken set successfully",
      admin
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
const otpValidation = async (req, res, next) => {
  try {
    const { otp, encryptOpts } = req.query;
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
    // Check if the OTP has expired
    const currentTime = new Date().getTime();
    if (currentTime > expirationTime) {
      return next(
        new AppError("Verification code has expired.", StatusCodes.BAD_REQUEST)
      );
    }

    if (code != otp) {
      return next(
        new AppError("Invalid verification code.", StatusCodes.BAD_REQUEST)
      );
    }

    return successMessage(StatusCodes.ACCEPTED, res, "Correct OTP", null);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = {
  signToken,
  signRefreshToken,
  verifyTokenAndAdmin,
  verifyVender,
  verifyBuyer,
  verifyAll,
  refreshToken,
  refreshTokenForBuyer,
  otpValidation,
  refreshTokenForAdmin,
};
