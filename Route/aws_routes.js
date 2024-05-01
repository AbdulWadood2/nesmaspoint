const express = require("express");
const { uploadProductImg } = require("../controllers/aws_controller");
const ROUTE = express.Router();
const multer = require("multer");
const {
  verifyBuyer,
  verifyVender,
  verifyTokenAndAdmin,
} = require("../utils/verifyToken_util");
const multerStorageUser = multer.memoryStorage();
const upload = multer({
  storage: multerStorageUser,
});

/* products */
// route /api/v1/aws/uploadImg
// method POST
// @privacy vender can do this but with their valid token
ROUTE.route("/uploadImg").post(
  verifyVender,
  upload.fields([{ name: "file", maxCount: 100 }]),
  uploadProductImg
);

// route /api/v1/aws/uploadImgBuyer
// method POST
// @privacy buyer do this but with their valid token
ROUTE.route("/uploadImgBuyer").post(
  verifyBuyer,
  upload.fields([{ name: "file", maxCount: 100 }]),
  uploadProductImg
);
// route /api/v1/aws/uploadImgAdmin
// method POST
// @privacy Admin do this but with their valid token
ROUTE.route("/uploadImgAdmin").post(
  verifyTokenAndAdmin,
  upload.fields([{ name: "file", maxCount: 100 }]),
  uploadProductImg
);
module.exports = ROUTE;
