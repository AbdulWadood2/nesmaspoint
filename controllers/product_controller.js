/* models */
const product_model = require("../Model/product_model");
const inventoryProduct_model = require("../Model/inventoryProduct_model");
const order_model = require("../Model/order_model");
const store_model = require("../Model/store_model");
const vender_model = require("../Model/vender_model");
/* errors */
const AppError = require("../utils/appError");
/* catchAsync */
const catchAsync = require("../utils/catchAsync");
/* utility functions */
const {
  deleteFile,
  isValidObjectId,
  successMessage,
  s3bucket,
  imageExistInAWSbucket,
  extractImgUrlSingleRecordAWS,
  extractImgUrlAllRecordAWS,
  checkImagesExistInAWS,
  checkMongoDbRecordImageExistence,
  checkDuplicateAwsImgInRecords,
  checkDuplicateAwsImgsInRecords,
  extractImgUrlAllRecordAWSflexible,
  extractImgUrlAllRecordsArrayAWSflexible,
  getFileNameFromUrl,
} = require("../functions/utility.functions");
/* aws */
const s3 = s3bucket();
/* statusCodes */
const { StatusCodes } = require("http-status-codes");
const {
  validateProduct,
  validateEditProduct,
  productSortedSchema,
  inventoryProductSchema,
  editInventoryProductSchema,
} = require("../utils/joi_validator_util");
/* env */
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
const path = require("path");
/* controller */
// API Route: POST /api/v1/product/
// Permission (only vender can do this)
const addProduct = async (req, res, next) => {
  try {
    const {
      productName,
      productCostPrice,
      productSellingPrice,
      productQuantity,
      productDescription,
      productImage,
      published,
    } = req.body;
    const result = validateProduct(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const imgsExistInAwsCheck = await checkImagesExistInAWS(productImage);
    if (!imgsExistInAwsCheck.success) {
      return next(
        new AppError(imgsExistInAwsCheck.error, StatusCodes.BAD_REQUEST)
      );
    }
    const imageInMongoDb = await checkDuplicateAwsImgsInRecords(
      productImage,
      "productImage"
    );
    if (!imageInMongoDb.success) {
      return next(new AppError(imageInMongoDb.error, StatusCodes.BAD_REQUEST));
    }
    const store = await store_model.findOne({ venderId: req.user.id });
    if (!store) {
      return next(new AppError("store not exists", StatusCodes.NOT_FOUND));
    }
    if (!store.storePreferredCurrency) {
      return next(
        new AppError(
          "plz add store preffered currency in store",
          StatusCodes.NOT_FOUND
        )
      );
    }
    let newProduct = await product_model.create({
      venderId: req.user.id,
      productName,
      productCostPrice,
      productSellingPrice,
      productQuantity,
      productDescription,
      productImage,
      published,
      storePreferredCurrency: store.storePreferredCurrency,
    });
    newProduct = await extractImgUrlSingleRecordAWS(newProduct);
    if (newProduct) {
      return successMessage(
        StatusCodes.OK,
        res,
        "new product is added",
        newProduct
      );
    }
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: GET /api/v1/product/singleProduct
// Permission (all can can do this)
const getSingleProduct = async (req, res, next) => {
  try {
    const { productId } = req.query;
    let product = await product_model.findById(productId);
    if (!product) {
      return next(
        new AppError(
          "not product found with this productId",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    product = await extractImgUrlAllRecordsArrayAWSflexible(
      [product],
      "productImage"
    );
    const vender = await vender_model.findById(product[0].venderId).lean();
    if (vender.isDeleted) {
      return next(
        new AppError("this vender is deleted by admin", StatusCodes.BAD_REQUEST)
      );
    }
    if (!vender.isActive) {
      return next(
        new AppError(
          "this vender now unactivated by admin",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    return successMessage(StatusCodes.ACCEPTED, res, null, product[0]);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: GET /api/v1/product/
// Permission (only vender can do this)
const getAllProducts = async (req, res, next) => {
  try {
    const venderId = req.user.id;
    // Check if the vendor ID is a valid ObjectId
    if (!isValidObjectId(venderId)) {
      return next(
        new AppError(
          "You do not have a valid objectId",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Pagination
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortField = "dateCreated";
    const sortOptions = { [sortField]: -1 };

    // Find products based on the provided criteria
    const allProductsQuery = {
      venderId: venderId,
      productDeleted: false,
    };

    const allProducts = await product_model
      .find(allProductsQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    const totalCount = await product_model.countDocuments(allProductsQuery);

    // Find orders for revenue calculation
    const ordersQuery = {
      venderId: venderId,
      orderStatus: { $ne: "Cancelled" },
    };

    const orders = await order_model.find(ordersQuery);

    // Calculate revenue, total product price, and generate signed URLs for product images
    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const allProductPrice = allProducts.reduce(
      (sum, product) => sum + product.productSellingPrice,
      0
    );
    let productsWithSignedUrls = await extractImgUrlAllRecordAWS(allProducts);

    // Respond with success, pagination info, and the list of products
    const paginationInfo = {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      itemsPerPage: limit,
    };
    return successMessage(StatusCodes.OK, res, paginationInfo, {
      products: productsWithSignedUrls,
      revenue,
      quantity: productsWithSignedUrls.length,
      allProductPrice,
    });
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: GET /api/v1/product/forPublic
// Permission (all can do this)
const getProducts = async (req, res, next) => {
  try {
    const { storeName, page = 1, limit = 10, sort = -1 } = req.query;

    // Validate storeName
    if (!storeName) {
      return next(
        new AppError("Store name is required", StatusCodes.BAD_REQUEST)
      );
    }

    // Validate page and limit
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(limitNumber) ||
      limitNumber < 1
    ) {
      return next(
        new AppError("Invalid page or limit parameter", StatusCodes.BAD_REQUEST)
      );
    }

    const store = await store_model.findOne({ storeName });

    // Check if the store exists
    if (!store) {
      return next(new AppError("Store not found", StatusCodes.NOT_FOUND));
    }
    const vender = await vender_model.findById(store.venderId).lean();
    if (vender.isDeleted) {
      return next(
        new AppError("this vender is deleted by admin", StatusCodes.BAD_REQUEST)
      );
    }
    if (!vender.isActive) {
      return next(
        new AppError(
          "this vender now unactivated by admin",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Fetch products, sort by dateCreated in descending order, and apply pagination
    const totalCount = await product_model.countDocuments({
      venderId: store.venderId,
      productDeleted: false,
      published: true,
    });

    const totalPages = Math.ceil(totalCount / limitNumber);

    const products = await product_model
      .find({
        venderId: store.venderId,
        productDeleted: false,
        published: true,
      })
      .sort({ dateCreated: sort })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
    let productsWithSignedUrls = await extractImgUrlAllRecordsArrayAWSflexible(
      products,
      "productImage"
    );
    const pagination = {
      total: totalCount,
      totalPages,
      page: pageNumber,
      limit: limitNumber,
    };
    return successMessage(
      StatusCodes.OK,
      res,
      pagination,
      productsWithSignedUrls
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: PUT /api/v1/product/
// Permission (only vender can do this)
const editProduct = async (req, res, next) => {
  try {
    const { productId } = req.query;

    if (!isValidObjectId(productId)) {
      // Validation failed
      return next(
        new AppError(
          `productId in params "${productId}" is not a valid ObjectId`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const {
      productName,
      productCostPrice,
      productSellingPrice,
      productQuantity,
      productDescription,
      published,
    } = req.body;
    const result = validateEditProduct(req.body);
    // If validation fails, return an error response
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message + " in req.body"),
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const productToUpdate = await product_model.findById(productId);

    if (!productToUpdate) {
      return next(new AppError("Product not found", StatusCodes.NOT_FOUND));
    }

    if (!(productToUpdate.venderId == req.user.id)) {
      return next(
        new AppError("this is not your product", StatusCodes.NOT_FOUND)
      );
    }

    // Update product
    let editedProduct = await product_model.findByIdAndUpdate(
      productId,
      {
        productName,
        productCostPrice,
        productSellingPrice,
        productQuantity,
        productDescription,
        published,
        dateModified: Date.now(),
      },
      { new: true } // To return the updated document
    );

    editedProduct = await extractImgUrlSingleRecordAWS(editedProduct);

    return successMessage(
      StatusCodes.OK,
      res,
      "Product edited successfully",
      editedProduct
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: DELETE /api/v1/product/
// Permission (only vender can do this)
const deleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!isValidObjectId(productId)) {
      // Validation failed
      return next(
        new AppError(
          `productId in params "${productId}" is not a valid ObjectId`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const Product = await product_model.findOne({
      _id: productId,
    });
    if (!Product) {
      return next(
        new AppError(
          `not product with this id ${productId}`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (Product.productDeleted) {
      return next(
        new AppError("this product is already deleted", StatusCodes.BAD_REQUEST)
      );
    }
    if (!(Product.venderId == req.user.id)) {
      return next(
        new AppError("this is not your product", StatusCodes.BAD_REQUEST)
      );
    }
    let deletedProduct = await product_model.findById(productId);
    deletedProduct.productDeleted = true;
    await deletedProduct.save();
    if (!deletedProduct) {
      return next(
        new AppError("error deleting product", StatusCodes.NOT_FOUND)
      );
    }
    deletedProduct = await extractImgUrlSingleRecordAWS(deletedProduct);
    return successMessage(
      StatusCodes.OK,
      res,
      "product deleted successfully",
      deletedProduct
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: DELETE /api/v1/product/productImage
// Permission (only vender can do this)
const addProductImage = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const { productImage } = req.query;
    if (!productImage) {
      return next(
        new AppError("the productImage is missing", StatusCodes.BAD_REQUEST)
      );
    }
    const imgExist = await imageExistInAWSbucket(productImage);
    if (!imgExist) {
      return next(
        new AppError(
          "no image exists with this name in bucket",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const productImageIs = await checkDuplicateAwsImgInRecords(
      productImage,
      "productImage"
    );
    if (!productImageIs.success) {
      return next(new AppError(productImageIs.error, StatusCodes.BAD_REQUEST));
    }
    if (!productId) {
      return next(
        new AppError("the productId is missing", StatusCodes.BAD_REQUEST)
      );
    }
    let product = await product_model.findById(productId);
    if (product.productImage.includes(productImage)) {
      return next(
        new AppError(
          "this image is already added in this bucket",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!(product.venderId == req.user.id)) {
      return next(
        new AppError(
          "this is not your product",
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
    if (!product) {
      return next(
        new AppError("the product is missing", StatusCodes.BAD_REQUEST)
      );
    }
    product.productImage.pull(product.productImage[0]);
    product.productImage.push(productImage);
    await product.save();
    product = await extractImgUrlSingleRecordAWS(product);
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "product img is added",
      product
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: DELETE /api/v1/product/deleteProductImage
// Permission (only vender can do this)
const deleteProductImage = async (req, res, next) => {
  try {
    const { productId } = req.query;
    let { productImage } = req.query;
    productImage = path.basename(new URL(productImage).pathname);
    if (!productImage) {
      return next(
        new AppError("the productImage is missing", StatusCodes.BAD_REQUEST)
      );
    }
    const imgExist = await imageExistInAWSbucket(productImage);
    if (!imgExist) {
      return next(
        new AppError(
          "no image exists with this name in bucket",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!productId) {
      return next(
        new AppError("the productId is missing", StatusCodes.BAD_REQUEST)
      );
    }
    let product = await product_model.findById(productId);
    if (!product) {
      return next(
        new AppError("the product is missing", StatusCodes.BAD_REQUEST)
      );
    }
    if (!product.productImage.includes(productImage)) {
      return next(
        new AppError(
          "this image is not this product image",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!(product.venderId == req.user.id)) {
      return next(
        new AppError(
          "this is not your product",
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
    product.productImage.pull(productImage);
    await product.save();
    await deleteFile(productImage, process.env.AWS_BUCKET_NAME);
    product = await extractImgUrlSingleRecordAWS(product);
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "product img is deleted",
      product
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// API Route: GET /api/v1/product/searchProductVender
// Permission (only vender can search his product with token)
const searchProduct = async (req, res, next) => {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return next(
        new AppError("Search term is required", StatusCodes.BAD_REQUEST)
      );
    }

    let products;

    if (isValidObjectId(searchTerm)) {
      // If the searchTerm is a valid ObjectId, search by ID
      products = await product_model.find({
        _id: searchTerm,
        venderId: req.user.id,
        productDeleted: false,
      });
    } else {
      // If the searchTerm is not a valid ObjectId, search by name
      products = await product_model.find({
        productName: { $regex: searchTerm, $options: "i" },
        venderId: req.user.id,
        productDeleted: false,
      });
    }

    if (products.length === 0) {
      return successMessage(StatusCodes.OK, res, null, products);
    }

    let productsWithSignedUrls = await extractImgUrlAllRecordsArrayAWSflexible(
      products,
      "productImage"
    );
    return successMessage(StatusCodes.OK, res, null, productsWithSignedUrls);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/product/searchProductForSpecificStore
// Permission (all can do this)
const searchProductForSpecificStore = async (req, res, next) => {
  try {
    const { searchTerm, venderId } = req.query;
    const vender = await vender_model.findById(venderId).lean();
    if (vender.isDeleted) {
      return next(
        new AppError("this vender is deleted by admin", StatusCodes.BAD_REQUEST)
      );
    }
    if (!vender.isActive) {
      return next(
        new AppError(
          "this vender now unactivated by admin",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!searchTerm) {
      return next(
        new AppError("searchTerm is required", StatusCodes.BAD_REQUEST)
      );
    }
    if (!venderId) {
      return next(
        new AppError("venderId is required", StatusCodes.BAD_REQUEST)
      );
    }

    let products;

    if (isValidObjectId(searchTerm)) {
      // If the searchTerm is a valid ObjectId, search by ID
      products = await product_model.find({
        _id: searchTerm,
        venderId,
        productDeleted: false,
        published: true,
      });
    } else {
      // If the searchTerm is not a valid ObjectId, search by name
      products = await product_model.find({
        productName: { $regex: searchTerm, $options: "i" },
        venderId,
        productDeleted: false,
        published: true,
      });
    }

    if (products.length === 0) {
      return successMessage(StatusCodes.OK, res, null, products);
    }

    let productsWithSignedUrls = await extractImgUrlAllRecordsArrayAWSflexible(
      products,
      "productImage"
    );
    return successMessage(StatusCodes.OK, res, null, productsWithSignedUrls);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// method post
// route /api/v1/product/inventory
// add inventory product
// only vender can add inventory product
const addInventoryProduct = catchAsync(async (req, res, next) => {
  const { error, value } = inventoryProductSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(error.details[0].message, StatusCodes.BAD_REQUEST)
    );
  }
  const store = await store_model.findOne({ venderId: req.user.id });
  if (!store) {
    return next(new AppError("store not exists", StatusCodes.NOT_FOUND));
  }
  if (!store.storePreferredCurrency) {
    return next(
      new AppError(
        "plz add store preffered currency in store",
        StatusCodes.NOT_FOUND
      )
    );
  }
  const imgsExistInAwsCheck = await checkImagesExistInAWS(value.productImage);
  if (!imgsExistInAwsCheck.success) {
    return next(new AppError(imgsExistInAwsCheck.error, 400));
  }
  const imageInMongoDb = await checkDuplicateAwsImgsInRecords(
    value.productImage,
    "productImage"
  );
  if (!imageInMongoDb.success) {
    return next(new AppError(imageInMongoDb.error, 400));
  }
  let newProduct = await inventoryProduct_model.create({
    venderId: req.user.id,
    storePreferredCurrency: store.storePreferredCurrency,
    ...value,
  });
  newProduct = await extractImgUrlSingleRecordAWS(newProduct);
  return successMessage(202, res, "new product is added", newProduct);
});

// method get
// route /api/v1/product/inventory
// get all inventory products
// only vender can get inventory products
const getAllInventoryProducts = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const allProducts = await inventoryProduct_model
    .find({ venderId })
    .sort({ createdAt: -1 });
  const productsWithSignedUrls = await extractImgUrlAllRecordAWS(allProducts);
  return successMessage(202, res, productsWithSignedUrls);
});

// method put
// route /api/v1/product/inventory
// edit inventory product
// only vender can edit inventory product
const editInventoryProduct = catchAsync(async (req, res, next) => {
  const venderId = req.user.id;
  const { error, value } = editInventoryProductSchema.validate(req.body);
  if (error) {
    return next(
      new AppError(error.details[0].message, StatusCodes.BAD_REQUEST)
    );
  }
  const { productId } = req.query;
  if (!isValidObjectId(productId)) {
    return next(
      new AppError("You do not have a valid objectId", StatusCodes.BAD_REQUEST)
    );
  }
  const productToUpdate = await inventoryProduct_model.findById(productId);
  if (!productToUpdate) {
    return next(new AppError("Product not found", StatusCodes.NOT_FOUND));
  }
  if (!(productToUpdate.venderId == venderId)) {
    return next(
      new AppError("this is not your product", StatusCodes.NOT_FOUND)
    );
  }
  if (value.productImage.length > 0) {
    value.productImage = value.productImage.map((img) =>
      getFileNameFromUrl(img)
    );
    const promise = value.productImage.map(async (img) => {
      if (!productToUpdate.productImage.includes(img)) {
        const imgExist = await imageExistInAWSbucket(img);
        if (!imgExist) {
          return next(
            new AppError("no image exists with this name in bucket", 400)
          );
        }
        const productImageIs = await checkDuplicateAwsImgInRecords(
          img,
          "productImage"
        );
        if (!productImageIs.success) {
          return next(new AppError(productImageIs.error, 400));
        }
      }
    });
    await Promise.all(promise);
  }
  let editedProduct = await inventoryProduct_model.findByIdAndUpdate(
    productId,
    {
      ...value,
    },
    { new: true }
  );
  // make function that get elements that are not in newIs now
  const diff = productToUpdate.productImage.filter(
    (x) => !editedProduct.productImage.includes(x)
  );
  if (diff.length !== 0) {
    const promise = diff.map(async (img) => {
      await deleteFile(img, process.env.AWS_BUCKET_NAME);
    });
    await Promise.all(promise);
  }
  editedProduct = await extractImgUrlSingleRecordAWS(editedProduct);
  return successMessage(
    StatusCodes.OK,
    res,
    "Product edited successfully",
    editedProduct
  );
});

// method delete
// route /api/v1/product/inventory
// delete inventory product
// only vender can delete inventory product
const deleteInventoryProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.query;
  const venderId = req.user.id;
  if (!isValidObjectId(productId)) {
    return next(
      new AppError("You do not have a valid objectId", StatusCodes.BAD_REQUEST)
    );
  }
  const product = await inventoryProduct_model.findOne({ _id: productId });
  if (!product) {
    return next(new AppError("Product not found", StatusCodes.NOT_FOUND));
  }
  if (!(product.venderId == venderId)) {
    return next(
      new AppError("this is not your product", StatusCodes.NOT_FOUND)
    );
  }
  const deletedProduct = await inventoryProduct_model.findByIdAndDelete(
    productId
  );
  const promise = deletedProduct.productImage.map(async (img) => {
    await deleteFile(img, process.env.AWS_BUCKET_NAME);
  });
  await Promise.all(promise);
  return successMessage(StatusCodes.OK, res, "Product deleted successfully");
});

module.exports = {
  addProduct,
  getSingleProduct,
  getAllProducts,
  getProducts,
  editProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  searchProduct,
  searchProductForSpecificStore,
  addInventoryProduct,
  getAllInventoryProducts,
  editInventoryProduct,
  deleteInventoryProduct,
};
