const fs = require("fs");
/* env */
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
/* model */
const admin_model = require("../Model/admin_model");
const vender_model = require("../Model/vender_model");
const invoice_model = require("../Model/invoice_model");
const order_model = require("../Model/order_model");
const product_model = require("../Model/product_model");
const inventoryProduct_model = require("../Model/inventoryProduct_model");
const createdCustomer_model = require("../Model/createdCustomer_model");
const debtor_model = require("../Model/debtor_model");
/* aws */
const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.accesskeyid,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.AWS_BUCKET_REGION, // Add this line
});
const s3 = new AWS.S3();
function validateEmail(email) {
  // Regular expression for a basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function validatePassword(password) {
  // Password should be at least 8 characters long and contain at least one digit and one special character
  const passwordRegex = /^(?=.*\d)(?=.*\W)(?=.*[a-zA-Z]).{8,}$/;
  return passwordRegex.test(password);
}

let getExtensionOfFile = (fileName) => {
  let lastDotIndex = fileName.lastIndexOf(".");

  // Split the string into two parts based on the last dot
  let firstPart = fileName.substring(0, lastDotIndex);
  let secondPart = fileName.substring(lastDotIndex + 1);

  // Create an array with the two parts
  return secondPart;
};
let deleteFile = async (filename, Bucket) => {
  if (!filename) {
    return null;
  }
  const params = {
    Bucket,
    Key: filename,
  };

  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.log({
        error: "Error deleting file from S3 bucket",
        err: err.stack,
      });
    } else {
      console.log({ message: "File deleted successfully" });
    }
  });
  // return new Promise((resolve) => {
  //   fs.unlink("./posts" + path, (err) => {
  //     if (err) {
  //       console.log(`no file exist with ${path} location`);
  //     }
  //     resolve(); // Resolve the promise after unlink completes
  //   });
  // });
};
let isValidObjectId = (str) => {
  /* mongoose */
  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(str)) {
    return false;
  }
  return true;
};
let generateRandomString = (length) => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`!@#$%^&*()_-+=";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};
let validateEmailAndPassword = (email, password) => {
  const error = [];
  if (!email) {
    error.push("email");
  } else if (!validateEmail(email)) {
    error.push("this is not a valid email address");
  }
  if (!password) {
    error.push("password");
  } else if (!validatePassword(password)) {
    error.push("Password: 8+ chars, 1 digit, 1 special char.");
  }
  return error;
};
let validatePasswordIs = (password) => {
  const error = [];
  if (!password) {
    error.push("password should not be empty");
  } else if (!validatePassword(password)) {
    error.push("Password: 8+ chars, 1 digit, 1 special char.");
  }
  return error;
};
let successMessage = (statusCode, res, message, data) => {
  return res.status(statusCode).json({
    status: "success",
    data,
    message,
  });
};
// from aws
let generateSignedUrl = async (filename) => {
  if (!filename) {
    return null;
  }
  // Set the region globally in the AWS SDK configuration
  AWS.config.update({
    region: process.env.AWS_BUCKET_REGION,
  });
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
  };

  const url = s3.getSignedUrl("getObject", params);

  return url;
};
// s3
let s3bucket = () => {
  return s3;
};
// is this image exists in bucket ?
let imageExistInAWSbucket = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    s3.headObject(params, (err, data) => {
      if (err) {
        if (err.code === "NotFound") {
          resolve(false); // Image does not exist
        } else {
          console.log("Error checking image existence:", err);
          resolve(false);
        }
      } else {
        resolve(true); // Image exists
      }
    });
  });
};
let checkImagesExistInAWS = async function (productImages) {
  try {
    // Map the array of images to an array of promises
    const imagePromises = productImages.map(async (image) => {
      // Assuming imageExistInAWSbucket returns a Promise
      return {
        image,
        exists: await imageExistInAWSbucket(image),
      };
    });

    // Wait for all promises to resolve using Promise.all
    const results = await Promise.all(imagePromises);

    // Check if any image does not exist in AWS
    const nonExistingImages = results.filter((result) => !result.exists);

    if (nonExistingImages.length > 0) {
      const errorMessages = nonExistingImages.map(
        (image) => `Image '${image.image}' does not exist in AWS`
      );
      return { success: false, error: errorMessages.join("\n") };
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking images in AWS:", error.message);
  }
};
let checkMongoDbRecordImageExistence = async function (array, db, field) {
  try {
    // Map the array of images to an array of promises
    const imagePromises = array.map(async (item) => {
      // Assuming imageExistInAWSbucket returns a Promise
      return {
        item,
        exists: (await db.findOne({ [`${field}`]: item })) ? false : true,
      };
    });

    // Wait for all promises to resolve using Promise.all
    const results = await Promise.all(imagePromises);

    // Check if any image does not exist in AWS
    const nonExistingImages = results.filter((result) => !result.exists);
    if (nonExistingImages.length > 0) {
      const errorMessages = nonExistingImages.map(
        (item) => `${field} '${item.item}' are already used`
      );
      return { success: false, error: errorMessages.join("\n") };
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking images in AWS:", error.message);
  }
};
let checkMongoDbRecordSingleImageExistence = async function (db, field) {
  try {
    const imagePromises = {
      item,
      exists: (await db.findOne({ [`${field}`]: item })) ? false : true,
    };

    // Wait for all promises to resolve using Promise.all
    const results = await Promise.all(imagePromises);

    // Check if any image does not exist in AWS
    const nonExistingImages = results.filter((result) => !result.exists);
    if (nonExistingImages.length > 0) {
      const errorMessages = nonExistingImages.map(
        (item) => `${field} '${item.item}' are already used`
      );
      return { success: false, error: errorMessages.join("\n") };
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking images in AWS:", error.message);
  }
};
let extractImgUrlSingleRecordAWS = async (product) => {
  let array = [];
  await Promise.all(
    product.productImage.map(async (item) => {
      const signedUrl = await generateSignedUrl(item); // Use "this" to refer to the current object
      array.push(signedUrl);
    })
  );
  return { ...product.toObject(), productImage: array };
};
let extractImgUrlSingleRecordAWSflexible = async (record, value) => {
  if (record[`${value}`]) {
    const signedUrl = await generateSignedUrl(record[`${value}`]); // Use "this" to refer to the current object
    record = JSON.stringify(record);
    record = JSON.parse(record);
    return { ...record, [`${value}`]: signedUrl };
  } else {
    return record;
  }
};
let extractImgUrlAllRecordAWS = async (allProducts) => {
  const products = await Promise.all(
    allProducts.map(async (product) => {
      return await extractImgUrlSingleRecordAWS(product);
    })
  );
  return products;
};
let extractImgUrlAllRecordAWSflexible = async (allrecords, value) => {
  const records = await Promise.all(
    allrecords.map(async (product) => {
      // Ensure that product[value] exists and is not undefined
      if (product) {
        return await extractImgUrlSingleRecordAWSflexible(product, value);
      } else {
        console.log("Skipped undefined or missing value in product");
        return null; // or handle the case when the value is undefined
      }
    })
  );
  return records;
};
let extractImgUrlAllRecordsArrayAWSflexible = async (allrecords, value) => {
  const records = await Promise.all(
    allrecords.map(async (product) => {
      // Ensure that product[value] exists and is not undefined
      if (product && product[value]) {
        return await extractImgUrlRecordsArrayAWSflexible(product, value);
      } else {
        console.log("Skipped undefined or missing value in product");
        return null; // or handle the case when the value is undefined
      }
    })
  );
  return records;
};

let extractImgUrlRecordsArrayAWSflexible = async (product, value) => {
  let array = [];
  await Promise.all(
    product[value].map(async (item) => {
      const signedUrl = await generateSignedUrl(item); // Use "this" to refer to the current object
      array.push(signedUrl);
    })
  );

  return { ...JSON.parse(JSON.stringify(product)), productImage: array };
};

let isAwsS3Url = (url) => {
  // Check if the URL contains "amazonaws.com"
  return /amazonaws\.com/i.test(url);
};

let getFileNameFromUrl = (url) => {
  // is it valid aws url?
  if (!isAwsS3Url(url)) {
    url = encodeURIComponent(url);
  }
  // Split the URL by '/' and get the last part
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];

  // Split the last part by '?' (if any) and get the first part
  const fileNameWithParams = lastPart.split("?")[0];

  // Decode the URL-encoded characters to get the actual filename
  const fileName = decodeURIComponent(fileNameWithParams);

  return fileName;
};

const checkDuplicateAwsImgInRecords = async (fileName, fieldName) => {
  try {
    const [
      admin,
      vender,
      invoice,
      order,
      product,
      inventoryProduct,
      createdCustomer,
      debtor,
    ] = await Promise.all([
      admin_model.findOne({ profileImg: fileName }),
      vender_model.findOne({ venderProfileImage: fileName }),
      invoice_model.findOne({ companylogo: fileName }),
      order_model.findOne({ paymentReceiptImg: fileName }),
      product_model.findOne({ productImage: fileName }),
      inventoryProduct_model.findOne({ productImage: fileName }),
      createdCustomer_model.findOne({ customerImage: fileName }),
      debtor_model.findOne({ image: fileName }),
    ]);

    if (
      admin ||
      vender ||
      invoice ||
      order ||
      product ||
      inventoryProduct ||
      createdCustomer ||
      debtor
    ) {
      return {
        error: `This ${fieldName} is already used`,
        success: false,
      };
    }

    // If none of the promises find a match, return some success message or proceed with other logic.
    return {
      message: `${fieldName} is unique and can be used.`,
      success: true,
    };
  } catch (error) {
    console.error("Error checking images in AWS:", error.message);
    return {
      error: `An error occurred while checking ${fieldName}`,
      success: false,
    };
  }
};
const checkDuplicateAwsImgsInRecords = async (fileNames, fieldName) => {
  try {
    const promises = fileNames.map(async (fileName) => {
      const [
        admin,
        vender,
        invoice,
        order,
        product,
        inventoryProduct,
        customerCreated,
        debtor,
      ] = await Promise.all([
        admin_model.findOne({ profileImg: fileName }),
        vender_model.findOne({ venderProfileImage: fileName }),
        invoice_model.findOne({ companylogo: fileName }),
        order_model.findOne({ paymentReceiptImg: fileName }),
        product_model.findOne({ productImage: fileName }),
        inventoryProduct_model.findOne({ productImage: fileName }),
        createdCustomer_model.findOne({ customerImage: fileName }),
        debtor_model.findOne({ image: fileName }),
      ]);

      if (
        admin ||
        vender ||
        invoice ||
        order ||
        product ||
        inventoryProduct ||
        customerCreated ||
        debtor
      ) {
        return fileName;
      }
    });

    const results = await Promise.all(promises);

    const duplicates = results.filter((fileName) => fileName);

    if (duplicates.length > 0) {
      return {
        error: `These ${fieldName} are already used: ${duplicates.join(", ")}`,
        success: false,
      };
    }

    // If none of the promises find a match, return some success message or proceed with other logic.
    return {
      message: `${fieldName} is unique and can be used.`,
      success: true,
    };
  } catch (error) {
    console.log(error.message);
    return {
      error: `An error occurred while checking ${fieldName}`,
      success: false,
    };
  }
};
function isFieldEqual(array, field) {
  if (array.length === 0) {
    return true; // If the array is empty, all fields are technically equal
  }

  const firstValue = array[0][field].toString(); // Get the field value from the first object
  console.log(firstValue);
  for (let i = 1; i < array.length; i++) {
    if (array[i][field].toString() !== firstValue) {
      return false; // If any value is not equal to the first one, return false
    }
  }

  return true; // All values are equal
}

// get millisecond after some months
function getMillisecAfterMonths(date, month) {
  // Get the current date if date parameter is not provided
  if (!date) {
    date = new Date();
  }
  date.setMonth(date.getMonth() + Number(month));
  // Return the milliseconds
  return Date.parse(date);
}
// get subscribed unsubscribed vender's
const subscribedUnsubscribedVenders = async (records, subscriptions_model) => {
  const promises = records.map(async (vendor) => {
    const subscribe = await subscriptions_model
      .findOne({ venderId: vendor._id })
      .lean();
    vendor.isSubscribe = subscribe ? !!subscribe.currentPackage : false;
    return vendor;
  });
  // Wait for all promises to resolve
  let vendorsWithSubscription = await Promise.all(promises);
  return vendorsWithSubscription;
};
// set notification by fcm firebase
async function sendFCMNotification(data, fcmServerKey) {
  try {
    const axios = require("axios");
    axios
      .post("https://fcm.googleapis.com/fcm/send", data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fcmServerKey}`,
        },
      })
      .then((response) => {
        console.log("Successfully sent message:", response.data);
      })
      .catch((error) => {
        console.error("Error sending message:", error.response);
      });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

module.exports = {
  getExtensionOfFile,
  deleteFile,
  isValidObjectId,
  generateRandomString,
  validateEmailAndPassword,
  validatePassword: validatePasswordIs,
  successMessage,
  generateSignedUrl,
  s3bucket,
  imageExistInAWSbucket,
  checkImagesExistInAWS,
  checkMongoDbRecordImageExistence,
  extractImgUrlSingleRecordAWS,
  extractImgUrlSingleRecordAWSflexible,
  extractImgUrlAllRecordAWS,
  extractImgUrlAllRecordAWSflexible,
  extractImgUrlRecordsArrayAWSflexible,
  getFileNameFromUrl,
  isAwsS3Url,
  checkDuplicateAwsImgInRecords,
  checkDuplicateAwsImgsInRecords,
  extractImgUrlAllRecordsArrayAWSflexible,
  isFieldEqual,
  getMillisecAfterMonths,
  subscribedUnsubscribedVenders,
  sendFCMNotification,
};
