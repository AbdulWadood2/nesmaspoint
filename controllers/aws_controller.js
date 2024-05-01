/* functions */
const { successMessage, s3bucket } = require("../functions/utility.functions");
/* error */
const AppError = require("../utils/appError");
/* status codes */
const { StatusCodes } = require("http-status-codes");
/* file system */
const fs = require("fs");
/* env */
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
/* aws */
const s3 = s3bucket();

/* upload product imgs */
// route /api/v1/aws/uploadImg for vender and admin
// route /api/v1/aws/uploadImgBuyer for buyer
// method POST
const uploadProductImg = (req, res, next) => {
  try {
    const files = req.files["file"];
    if (!files || files.length === 0) {
      return next(new AppError("No files provided", StatusCodes.BAD_REQUEST));
    }

    // Create an array to store promises for each S3 upload
    const uploadPromises = files.map((file) => {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${file.fieldname}_${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.key);
          }
        });
      });
    });

    // Wait for all S3 uploads to complete
    Promise.all(uploadPromises)
      .then((s3Keys) => {
        return successMessage(202, res, "Files uploaded successfully", s3Keys);
      })
      .catch((err) => {
        return next(new AppError(err, StatusCodes.INTERNAL_SERVER_ERROR));
      });
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

module.exports = { uploadProductImg };
