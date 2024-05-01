// order_controller.js

const Order = require("../Model/order_model");
const product_model = require("../Model/product_model");
const store_model = require("../Model/store_model");
const shippingMethod_model = require("../Model/shippingMethod_Model");
const buyer_model = require("../Model/buyer_model");
const bankDetails_model = require("../Model/bankDetails_model");
const vender_model = require("../Model/vender_model");
const notification_model = require("../Model/notification_model");
const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require("http-status-codes");
const AppError = require("../utils/appError");
const {
  successMessage,
  isValidObjectId,
  generateSignedUrl,
  checkDuplicateAwsImgInRecords,
  imageExistInAWSbucket,
  extractImgUrlAllRecordsArrayAWSflexible,
  extractImgUrlRecordsArrayAWSflexible,
  extractImgUrlSingleRecordAWSflexible,
  isFieldEqual,
  sendFCMNotification,
} = require("../functions/utility.functions");
const { orderJoi } = require("../utils/joi_validator_util");
// API Method: POST
// API Route: /api/v1/order/
// Description: Create a new order
// Permission (only buyer can do this)
const createOrder = async (req, res, next) => {
  try {
    req.body.buyerId = req.user.id;
    const result = orderJoi(req.body);
    if (result.error) {
      return next(
        new AppError(
          result.error.details.map((error) => error.message),
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const imgExist = await imageExistInAWSbucket(
      result.value.paymentReceiptImg
    );
    if (!imgExist) {
      return next(
        new AppError(
          `no image exists with this name ${result.value.paymentReceiptImg} in bucket`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const resultIs = await checkDuplicateAwsImgInRecords(
      result.value.paymentReceiptImg,
      "paymentReceiptImg"
    );
    if (!resultIs.success) {
      return next(new AppError(resultIs.error, StatusCodes.BAD_REQUEST));
    }
    const products = [];
    let orderSubTotal = 0;
    const promises = result.value.cart.map(async (cartItem) => {
      const product = await product_model.findOne({
        _id: cartItem.productId,
        productDeleted: false,
      });
      products.push(product);
      orderSubTotal += cartItem.orderQuantity * product.productSellingPrice;
    });

    await Promise.all(promises);
    result.value.orderSubTotal = orderSubTotal;
    if (products.includes(null)) {
      return next(
        new AppError("invalid products id's", StatusCodes.BAD_REQUEST)
      );
    }
    if (!isFieldEqual(products, "venderId")) {
      return next(
        new AppError("products with different venders", StatusCodes.BAD_REQUEST)
      );
    }
    if (products.length > 1) {
      if (isFieldEqual(products, "_id")) {
        return next(
          new AppError("duplicate products", StatusCodes.BAD_REQUEST)
        );
      }
    }
    let quantityErrors = [];
    for (let i = 0; i < products.length; i++) {
      if (
        !(result.value.cart[i].orderQuantity <= products[i].productQuantity)
      ) {
        quantityErrors.push(
          `product Name:${products[i].productName} with _id: ${products[i]._id} has quantity ${products[i].productQuantity} availiable`
        );
      }
    }
    if (quantityErrors.length > 0) {
      return next(
        new AppError(quantityErrors.join(` and `), StatusCodes.BAD_REQUEST)
      );
    }
    const shipping = await shippingMethod_model.findOne({
      venderId: products[0].venderId,
    });
    if (!shipping) {
      return next(
        new AppError(
          "shipping not added for this store",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (shipping.fixedShippingFee) {
      if (result.value.orderFixedShippingFee) {
        if (
          !(
            Number(result.value.orderFixedShippingFee) ==
            shipping.fixedShippingFee
          )
        ) {
          return next(
            new AppError("shipping fee not match", StatusCodes.BAD_REQUEST)
          );
        } else {
          result.value.totalAmount = orderSubTotal + shipping.fixedShippingFee;
        }
      } else {
        result.value.orderFixedShippingFee = null;
        result.value.orderCustomerPickUp = true;
        result.value.totalAmount = orderSubTotal;
      }
    } else {
      result.value.orderFixedShippingFee = null;
      result.value.orderCustomerPickUp = true;
      result.value.totalAmount = orderSubTotal;
    }
    const store = await store_model.findOne({ venderId: products[0].venderId });
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
    result.value.storePreferredCurrency = store.storePreferredCurrency;
    const venderBankDetail = await bankDetails_model.findOne({
      venderId: products[0].venderId,
    });
    if (!venderBankDetail) {
      return next(
        new AppError(
          "bank details are missing from vender",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!venderBankDetail.bankName) {
      return next(
        new AppError(
          "bank name is missing from vender",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!venderBankDetail.accountName) {
      return next(
        new AppError(
          "accountName is missing from vender",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (!venderBankDetail.accountNumber) {
      return next(
        new AppError(
          "accountNumber is missing from vender",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    let cartForMissingValues = [];
    for (let item = 0; item < products.length; item++) {
      cartForMissingValues.push({
        ...result.value.cart[item],
        productImage: products[item].productImage,
        productName: products[item].productName,
        productPrice: products[item].productSellingPrice,
      });
    }
    result.value.cart = cartForMissingValues;
    // Create the order
    let order = await Order.create({
      ...result.value,
      venderId: products[0].venderId,
    });
    // minus quantity
    for (let i = 0; i < products.length; i++) {
      const product = await product_model.findById(products[i]._id);
      product.productQuantity =
        product.productQuantity - result.value.cart[i].orderQuantity;
      await product.save();
    }
    // Generate signed URLs for each product image
    async function getSignUrlAWS() {
      const signedUrl = await generateSignedUrl(order.paymentReceiptImg);
      return {
        ...order.toObject(),
        paymentReceiptImg: signedUrl,
      };
    }
    order = await getSignUrlAWS();
    let cartImageExtract = await extractImgUrlAllRecordsArrayAWSflexible(
      [...result.value.cart],
      "productImage"
    );
    order.cart = cartImageExtract;
    const buyer = await buyer_model.findById(req.user.id);
    await notification_model.create({
      text: `${order.clientContactDetails.clientName} place order`,
      description: `The ${order.clientContactDetails.clientName} place the order for ${order.cart.length} products categories`,
      venderId: products[0].venderId,
    });
    const vender = await vender_model.findById(products[0].venderId);
    if (vender.fcm_key) {
      const data = {
        notification: {
          title: `${order.clientContactDetails.clientName} place order`,
          body: `The ${order.clientContactDetails.clientName} place the order for ${order.cart.length} products categories`,
        },
        data: {
          title: `${order.clientContactDetails.clientName} place order`,
          body: `The ${order.clientContactDetails.clientName} place the order for ${order.cart.length} products categories`,
        },
        to: vender.fcm_key,
      };
      await sendFCMNotification(data, process.env.fcmServerKey);
    }

    // Respond with success message and the created order
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Order created successfully",
      order
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Method: GET
// API Route: /api/v1/order/
// Description: Get all orders for the authenticated vendor
// Permission (only vender can do this)
const getAllOrders = async (req, res, next) => {
  try {
    // Get the vendor ID from the authenticated user
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

    // Get the order status from req.query or default to "all"
    let orderStatus = req.query.orderStatus || "all";

    // Validate the orderStatus against the enum values
    const validOrderStatusValues = [
      "Pending",
      "Shipped",
      "Completed",
      "Cancelled",
    ];
    if (
      orderStatus !== "all" &&
      !validOrderStatusValues.includes(orderStatus)
    ) {
      return next(
        new AppError(
          "Invalid orderStatus value. It must be one of: 'Pending', 'Shipped', 'Completed', 'Cancelled'",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Build the query based on the orderStatus value
    const query =
      orderStatus === "all" ? { venderId } : { venderId, orderStatus };
    // Count total orders for pagination information
    const totalCount = await Order.countDocuments(query);
    // Pagination
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : totalCount;
    const skip = (page - 1) * limit;

    // Retrieve orders based on the query with pagination
    let orders = await Order.find(query)
      .sort({ orderCreated: -1 })
      .skip(skip)
      .limit(limit);

    // Generate signed URLs for each product image
    orders = await Promise.all(
      orders.map(async (order) => {
        let cartImageExtract = await extractImgUrlAllRecordsArrayAWSflexible(
          order.cart,
          "productImage"
        );
        const buyer = await buyer_model.findById(order.buyerId);
        const buyerProfile = await extractImgUrlSingleRecordAWSflexible(
          buyer,
          "profileImage"
        );
        const signedUrl = await generateSignedUrl(order.paymentReceiptImg);
        return {
          ...order.toObject(),
          paymentReceiptImg: signedUrl,
          cart: cartImageExtract,
          buyerProfile: buyerProfile.profileImage,
        };
      })
    );
    // Count total orders for pagination information
    const totalPages = Math.ceil(totalCount / limit);

    // Respond with success, pagination info, and the list of orders
    const paginationInfo = {
      totalItems: totalCount,
      totalPages: totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
    const vender = await vender_model.findById(req.user.id);
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      paginationInfo,
      orders,
      "order"
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Method: PUT
// API Route: /api/v1/order/
// Description: Update a specific order by its ID
// Permission (only vender can do this)
const updateOrder = async (req, res, next) => {
  try {
    // Get the order ID from the query parameters
    const { orderId } = req.query;
    const { orderStatus } = req.body;

    // Check if the order ID is a valid ObjectId
    if (!isValidObjectId(orderId)) {
      return next(
        new AppError(
          "You do not have a valid objectId for the order",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // check if order exists with this id?
    let order = await Order.findById(orderId);
    if (!order) {
      return next(
        new AppError("not order with this id", StatusCodes.BAD_REQUEST)
      );
    }

    for (let i = 0; i < order.cart.length; i++) {
      const product = await product_model.findById(order.cart[i].productId);
      if (order.orderStatus == "Cancelled" && orderStatus != "Cancelled") {
        if (!(order.cart[i].orderQuantity <= product.productQuantity)) {
          return next(
            new AppError(
              `total products with id ${product._id} and name ${product.productName} ${product.productQuantity} availiable so increase quantity`,
              StatusCodes.BAD_REQUEST
            )
          );
        }
      }
    }

    // Get the updated order data from the request body
    const updatedOrderData = { orderStatus, orderModified: Date.now() };

    // Update the order by its ID
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updatedOrderData,
      { new: true }
    );

    // Check if the order exists
    if (!updatedOrder) {
      return next(new AppError("Order not found", StatusCodes.NOT_FOUND));
    }

    if (!(order.orderStatus == "Cancelled")) {
      if (orderStatus == "Cancelled") {
        const order = await Order.findById(orderId);
        order.paid = false;
        await order.save();
        for (let i = 0; i < order.cart.length; i++) {
          const product = await product_model.findById(order.cart[i].productId);
          product.productQuantity =
            product.productQuantity + order.cart[i].orderQuantity;
          await product.save();
        }
      }
    }

    if (
      order.orderStatus == "Cancelled" &&
      updatedOrder.orderStatus != "Cancelled"
    ) {
      const order = await Order.findById(orderId);
      order.paid = true;
      await order.save();
      for (let i = 0; i < order.cart.length; i++) {
        const product = await product_model.findById(order.cart[i].productId);
        product.productQuantity =
          product.productQuantity - order.cart[i].orderQuantity;
        await product.save();
      }
    }
    order = await Order.findById(orderId);
    const signedUrl = await generateSignedUrl(order.paymentReceiptImg);
    order = { ...order.toObject(), paymentReceiptImg: signedUrl };
    let cartImageExtract = await extractImgUrlAllRecordsArrayAWSflexible(
      order.cart,
      "productImage"
    );
    order.cart = cartImageExtract;
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      "Order updated successfully",
      order
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/order/orderHistory
// Description: get order history
// Permission (only buyer can do this)
const getOrderHistory = async (req, res, next) => {
  try {
    // Get the buyer ID from the authenticated user
    const buyerId = req.user.id;
    // Check if the buyer ID is a valid ObjectId
    if (!isValidObjectId(buyerId)) {
      return next(
        new AppError(
          "You do not have a valid objectId",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    // Count total orders for pagination information
    const totalCount = await Order.countDocuments({ buyerId });
    // Pagination
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : totalCount;
    const skip = (page - 1) * limit;

    // Sorting
    const sortOptions = { orderCreated: -1 }; // Sort by dateCreated in descending order (new to old)

    // Retrieve order history for the buyer
    let orderHistory = await Order.find({ buyerId })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Generate signed URLs for each payment receipt image
    orderHistory = await Promise.all(
      orderHistory.map(async (order) => {
        const signedUrl = await generateSignedUrl(order.paymentReceiptImg);
        return { ...order.toObject(), paymentReceiptImg: signedUrl };
      })
    );

    // Count total orders for pagination information
    const totalPages = Math.ceil(totalCount / limit);

    // Respond with success, pagination info, and the list of order history
    const paginationInfo = {
      totalItems: totalCount,
      totalPages: totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
    orderHistory = await Promise.all(
      orderHistory.map(async (order) => {
        let cartImageExtract = await extractImgUrlAllRecordsArrayAWSflexible(
          order.cart,
          "productImage"
        );
        return {
          ...order,
          cart: cartImageExtract,
        };
      })
    );
    return successMessage(
      StatusCodes.ACCEPTED,
      res,
      paginationInfo,
      orderHistory
    );
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/order/specificOrder
// Description: get a specific order by its ID
// Permission all can do this public
const getSpecificOrder = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return next(
        new AppError("orderId is required in req.query", StatusCodes.NOT_FOUND)
      );
    }
    let order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError("no order with this id", StatusCodes.NOT_FOUND));
    }
    const signedUrl = await generateSignedUrl(order.paymentReceiptImg);
    order = {
      ...JSON.parse(JSON.stringify(order)),
      paymentReceiptImg: signedUrl,
    };
    let cartImageExtract = await extractImgUrlAllRecordsArrayAWSflexible(
      order.cart,
      "productImage"
    );
    order.cart = cartImageExtract;
    successMessage(StatusCodes.OK, res, null, order);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// API Route: GET /api/v1/order/search
// Description: Search orders with a single search term query for productName, clientName, or productId
// Permission: All users can access this endpoint
const searchOrders = async (req, res, next) => {
  try {
    const venderId = req.user.id;
    // Extract search term from query string
    let searchTerm = req.query.searchTerm;
    searchTerm = encodeURIComponent(searchTerm);
    // Check if the searchTerm is provided
    if (!searchTerm) {
      return next(
        new AppError("Search term is required", StatusCodes.BAD_REQUEST)
      );
    }

    // Initialize the search query
    let searchQuery;
    let matchQuery;

    if (isValidObjectId(searchTerm)) {
      // If searchTerm is a valid ObjectId, search by productId or orderId
      matchQuery = {
        $or: [
          {
            "cart.productId": decodeURIComponent(searchTerm),
          },
          { _id: decodeURIComponent(searchTerm) },
        ],
      };
    } else {
      // If searchTerm is not a valid ObjectId, perform case-insensitive search by productName or clientName
      searchQuery = {
        $or: [
          {
            cart: {
              $elemMatch: {
                productName: {
                  $regex: decodeURIComponent(searchTerm),
                  $options: "i",
                },
              },
            },
          }, // Case-insensitive search by productName within cart array
          {
            "clientContactDetails.clientName": {
              $regex: decodeURIComponent(searchTerm),
              $options: "i",
            },
          }, // Case-insensitive search by clientName
        ],
      };
    }

    let orders;
    if (searchQuery) {
      // Execute the aggregation pipeline to find matching orders
      orders = await Order.aggregate([
        {
          $match: {
            venderId,
          },
          $match: {
            $and: [searchQuery],
          },
        },
        { $sort: { orderCreated: -1 } },
      ]);
    }
    if (matchQuery) {
      if (!orders) {
        orders = await Order.find({
          $and: [{ venderId }, matchQuery],
        }).sort({ dateCreated: -1 });
      }
    }
    orders = await Promise.all(
      orders.map(async (order) => {
        let cartImageExtract = await extractImgUrlAllRecordsArrayAWSflexible(
          order.cart,
          "productImage"
        );
        const buyer = await buyer_model.findById(order.buyerId);
        const buyerProfile = await extractImgUrlSingleRecordAWSflexible(
          buyer,
          "profileImage"
        );
        const signedUrl = await generateSignedUrl(order.paymentReceiptImg);
        return {
          ...JSON.parse(JSON.stringify(order)),
          paymentReceiptImg: signedUrl,
          cart: cartImageExtract,
          buyerProfile: buyerProfile.profileImage,
        };
      })
    );
    // Respond with success and the list of matching orders
    return successMessage(StatusCodes.OK, res, null, orders);
  } catch (error) {
    return next(new AppError(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// Export all controller functions
module.exports = {
  createOrder,
  getAllOrders,
  updateOrder,
  getOrderHistory,
  getSpecificOrder,
  searchOrders,
};
