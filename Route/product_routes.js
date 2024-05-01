const express = require("express");
const {
  addProduct,
  getAllProducts,
  editProduct,
  deleteProduct,
  deleteProductImage,
  addProductImage,
  getSingleProduct,
  getProducts,
  searchProduct,
  searchProductForSpecificStore,
  addInventoryProduct,
  getAllInventoryProducts,
  editInventoryProduct,
  deleteInventoryProduct,
} = require("../controllers/product_controller");
const { verifyVender } = require("../utils/verifyToken_util");
const ROUTE = express.Router();

// API Route: POST /api/v1/product/
// Permission (only vender can do this)
ROUTE.route("/").post(verifyVender, addProduct);
// API Route: GET /api/v1/product/singleProduct
// Permission (all can can do this)
ROUTE.route("/singleProduct").get(getSingleProduct);
// API Route: GET /api/v1/product/
// Permission (only vender can do this)
ROUTE.route("/").get(verifyVender, getAllProducts);
// API Route: GET /api/v1/product/forPublic
// Permission (all can do this)
ROUTE.route("/forPublic").get(getProducts);
// API Route: PUT /api/v1/product/
// Permission (only vender can do this)
ROUTE.route("/").put(verifyVender, editProduct);
// API Route: DELETE /api/v1/product/
// Permission (only vender can do this)
ROUTE.route("/").delete(verifyVender, deleteProduct);
// API Route: DELETE /api/v1/product/productImage
// Permission (only vender can do this)
ROUTE.route("/productImage").post(verifyVender, addProductImage);
// API Route: DELETE /api/v1/product/productImage
// Permission (only vender can do this)
ROUTE.route("/productImage").delete(verifyVender, deleteProductImage);
// API Route: GET /api/v1/product/searchProductVender
// Permission (only vender can search his product with token)
ROUTE.route("/searchProductVender").get(verifyVender, searchProduct);
// API Route: GET /api/v1/product/searchProductForSpecificStore
// Permission (all can do this)
ROUTE.route("/searchProductForSpecificStore").get(
  searchProductForSpecificStore
);
// method post
// route /api/v1/product/inventory
// add inventory product
// only vender can add inventory product
ROUTE.route("/inventory").post(verifyVender, addInventoryProduct);

// method get
// route /api/v1/product/inventory
// get all inventory products
// only vender can get inventory products
ROUTE.route("/inventory").get(verifyVender, getAllInventoryProducts);

// method put
// route /api/v1/product/inventory
// edit inventory product
// only vender can edit inventory product
ROUTE.route("/inventory").put(verifyVender, editInventoryProduct);

// method delete
// route /api/v1/product/inventory
// delete inventory product
// only vender can delete inventory product
ROUTE.route("/inventory").delete(verifyVender, deleteInventoryProduct);

module.exports = ROUTE;
