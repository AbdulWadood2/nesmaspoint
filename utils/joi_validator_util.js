const Joi = require("joi");

const mongoose = require("mongoose");
const isObjectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

/* product */
const productSchema = Joi.object({
  productName: Joi.string().required(),
  productCostPrice: Joi.number().positive().required(),
  productSellingPrice: Joi.number().positive().required(),
  productQuantity: Joi.number().integer().min(0).required(),
  productDescription: Joi.string().required(),
  productImage: Joi.array().items(Joi.string()).required(),
  published: Joi.boolean().required().valid(true, false),
}).unknown(false);
const editProductSchema = Joi.object({
  productName: Joi.string().allow(null),
  productCostPrice: Joi.number().positive().allow(null),
  productSellingPrice: Joi.number().positive().allow(null),
  productQuantity: Joi.number().integer().min(0).allow(null),
  productDescription: Joi.string().allow(null),
  published: Joi.boolean().valid(true, false).allow(null),
}).unknown(false);
const validateProduct = (product) => {
  return productSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const validateEditProduct = (product) => {
  return editProductSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const inventoryProductSchema = Joi.object({
  productName: Joi.string().required(),
  productCostPrice: Joi.number().positive().required(),
  productSellingPrice: Joi.number().positive().required(),
  productQuantity: Joi.number().integer().min(0).required(),
  productDescription: Joi.string().required(),
  productImage: Joi.array().items(Joi.string()).required(),
  unit: Joi.number().valid(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).required(),
  productsSoldQuantity: Joi.number().required(),
}).unknown(false);
const editInventoryProductSchema = Joi.object({
  productName: Joi.string().allow(null),
  productCostPrice: Joi.number().positive().allow(null),
  productSellingPrice: Joi.number().positive().allow(null),
  productQuantity: Joi.number().integer().min(0).allow(null),
  productDescription: Joi.string().allow(null),
  productImage: Joi.array().items(Joi.string()).required(),
  unit: Joi.number().valid(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).allow(null),
  productsSoldQuantity: Joi.number().allow(null),
}).unknown(false);
/* buyer */
const buyerSignUpSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .required()
    .min(8)
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/)
    .required()
    .message(
      "Password should be at least 8 characters long and contain at least one digit and one special character"
    ),
  venderId: isObjectId,
}).unknown(false);
const validateBuyerSignUp = (product) => {
  return buyerSignUpSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const buyerEditSchema = Joi.object({
  firstName: Joi.string().allow(null),
  lastName: Joi.string().allow(null),
  password: Joi.string()
    .allow(null)
    .required()
    .min(8)
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/)
    .required()
    .message(
      "Password should be at least 8 characters long and contain at least one digit and one special character"
    ),
  profileImage: Joi.string().allow(null),
}).unknown(false);
const validateBuyerEdit = (product) => {
  return buyerEditSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* vender */
const venderSignUpSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  companyName: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  password: Joi.string()
    .required()
    .min(8)
    .regex(/^(?=.*\d)(?=.*\W)(?=.*[a-zA-Z]).{8,}$/)
    .required()
    .message("Password: 8+ chars, 1 digit, 1 special char."),
}).unknown(false);

const validateVenderSignUp = (product) => {
  return venderSignUpSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const venderEditSchema = Joi.object({
  name: Joi.string().allow(null),
  companyName: Joi.string().allow(null),
  phoneNumber: Joi.string().allow(null),
  password: Joi.string()
    .allow(null) // Allow null
    .min(8)
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/)
    .message(
      "Password should be at least 8 characters long and contain at least one digit and one special character"
    ),
  venderProfileImage: Joi.string().allow(null),
}).unknown(false);

const validateVenderEdit = (product) => {
  return venderEditSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* sales */

const saleJoiSchema = Joi.object({
  venderId: isObjectId,
  productName: Joi.string().required(),
  customerName: Joi.string().required(),
  soldDate: Joi.string().required(),
  productPrice: Joi.number().positive().required(),
  shippingFee: Joi.number().min(0).required(),
  discount: Joi.number().min(0).required(),
  quantity: Joi.number().integer().positive().required(),
  payType: Joi.string()
    .valid("Cash", "Bank Transfer", "Credit Card")
    .required(),
}).unknown(false);

const saleJoi = (product) => {
  return saleJoiSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const editSaleJoiSchema = Joi.object({
  productName: Joi.string(),
  customerName: Joi.string(),
  soldDate: Joi.string(),
  productPrice: Joi.number().positive(),
  shippingFee: Joi.number().min(0).required(),
  discount: Joi.number().min(0).required(),
  quantity: Joi.number().integer().positive(),
  payType: Joi.string().valid("Cash", "Bank Transfer", "Credit Card"),
}).unknown(false);

const editSaleJoi = (product) => {
  return editSaleJoiSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* income */
const incomeSchema = Joi.object({
  incomeTitle: Joi.string().required(),
  incomeDate: Joi.string().required(),
  incomeAmount: Joi.number().required(),
  incomeDescription: Joi.string().required(),
  venderId: isObjectId,
}).unknown(false);

const incomeJoi = (product) => {
  return incomeSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const editIncomeSchema = Joi.object({
  incomeTitle: Joi.string(),
  incomeDate: Joi.string(),
  incomeAmount: Joi.number(),
  incomeDescription: Joi.string(),
}).unknown(false);

const editIncomeJoi = (product) => {
  return editIncomeSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* expense */

const expenseValidationSchema = Joi.object({
  vendorId: isObjectId,
  expenseTitle: Joi.string().required(),
  expenseDate: Joi.string().required(),
  expenseAmount: Joi.number().required(),
  expenseDescription: Joi.string().required(),
}).unknown(false);

const expenseJoi = (product) => {
  return expenseValidationSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const editExpenseValidationSchema = Joi.object({
  expenseTitle: Joi.string(),
  expenseDate: Joi.string(),
  expenseAmount: Joi.number(),
  expenseDescription: Joi.string(),
}).unknown(false);

const editExpenseJoi = (product) => {
  return editExpenseValidationSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* invoice */
const invoiceValidationSchema = Joi.object({
  venderId: isObjectId,
  companylogo: Joi.string().required(),
  invoiceDate: Joi.string().required(),
  invoiceDueDate: Joi.string().required(),
  contactDetails: Joi.object({
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
  }).required(),
  recipientDetails: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
  }).required(),
  companyBankDetails: Joi.object({
    bankName: Joi.string().required(),
    accountNumber: Joi.number().required(),
    accountName: Joi.string().required(),
  }).required(),
  products: Joi.array()
    .items(
      Joi.object({
        itemName: Joi.string().required(),
        quantity: Joi.number().required(),
        productPrice: Joi.number().required(),
        tax: Joi.number().required(),
        discount: Joi.number().required(),
        shippingFee: Joi.number().required(),
        totalPrice: Joi.number().required(),
      })
    )
    .required(),
}).unknown(false);

const invoiceJoi = (product) => {
  return invoiceValidationSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
const editInvoiceValidationSchema = Joi.object({
  companylogo: Joi.string(),
  invoiceDate: Joi.string(),
  invoiceDueDate: Joi.string(),
  contactDetails: Joi.object({
    email: Joi.string().email(),
    phoneNumber: Joi.string(),
  }),
  recipientDetails: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    phoneNumber: Joi.string(),
  }),
  companyBankDetails: Joi.object({
    bankName: Joi.string(),
    accountNumber: Joi.number(),
    accountName: Joi.string(),
  }),
  products: Joi.array().items(
    Joi.object({
      itemName: Joi.string(),
      quantity: Joi.number(),
      productPrice: Joi.number(),
      tax: Joi.number(),
      discount: Joi.number(),
      shippingFee: Joi.number(),
      totalPrice: Joi.number(),
    })
  ),
}).unknown(false);

const editInvoiceJoi = (product) => {
  return editInvoiceValidationSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};
/* store */
const storeNameValidationSchema = Joi.object({
  storeCompanyName: Joi.string().required(),
  storeName: Joi.string().default(null),
  storePreferredCurrency: Joi.string()
    .default("Nigerian Naira")
    .valid("Nigerian Naira"),
  storeAbout: Joi.string().default(null),
  storeAddressDetails: Joi.string().default(null),
  storeCity: Joi.string().default(null),
  storeState: Joi.string().default(null),
  storeZipCode: Joi.number().default(null),
  storeCountry: Joi.string().default(null),
  storeStreet: Joi.string().default(null),
}).unknown(false);

const storeJoi = (product) => {
  return storeNameValidationSchema.validate(product, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* order */
const orderSchema = Joi.object({
  buyerId: isObjectId.required(),
  cart: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        orderQuantity: Joi.number().positive().required(),
      })
    )
    .required()
    .min(1), // Ensure there is at least one item in the cart array
  orderDisCount: Joi.number().positive().allow(null),
  orderFixedShippingFee: Joi.number().positive().allow(null),
  orderCustomerPickUp: Joi.boolean().default(false),
  clientContactDetails: Joi.object({
    clientName: Joi.string().required(),
    clientEmail: Joi.string().email().required(),
    clientPhoneNumber: Joi.string().required(),
    clientAddress: Joi.string().required(),
  }).required(),
  clientNote: Joi.string().required(),
  paymentReceiptImg: Joi.string().allow(null),
  orderStatus: Joi.string().valid(
    "Pending",
    "Shipped",
    "Completed",
    "Cancelled"
  ),
  paid: Joi.boolean().default(true), // Assuming paid is defaulted to true in Mongoose schema
  storePreferredCurrency: Joi.string(), // Assuming storePreferredCurrency is required in Mongoose schema
  orderCreated: Joi.date().default(Date.now()), // Assuming orderCreated is defaulted to current date in Mongoose schema
  orderModified: Joi.date().allow(null), // Assuming orderModified allows null in Mongoose schema
}).unknown(false);

const orderJoi = (order) => {
  return orderSchema.validate(order, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* notifications */
const notificationSchema = Joi.object({
  text: Joi.string().required(),
  description: Joi.string().required(),
}).unknown(false);

const validateNotification = (notification) => {
  return notificationSchema.validate(notification, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* bank details */
const bankDetailsSchema = Joi.object({
  bankName: Joi.string().required(),
  accountName: Joi.string().required(),
  accountNumber: Joi.number().required(),
}).unknown(false);

const validateBankDetails = (bankDetails) => {
  return bankDetailsSchema.validate(bankDetails, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

const planSchema = Joi.object({
  planName: Joi.string().required(),
  planPrice: Joi.number().positive().required(),
  duration: Joi.string().required(),
  subscriptionDate: Joi.date().iso().required(),
});
const validatePlanSchema = (plan) => {
  return planSchema.validate(plan, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

/* product sorted search */
const productSorted = Joi.object({
  venderId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  sort: Joi.string().valid("newToOld", "oldToNew").required(),
}).unknown(false);
const productSortedSchema = (term) => {
  return productSorted.validate(term, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

// loan Package joi
const loanPackageSchema = Joi.object({
  title: Joi.string().required(),
  intrustRate: Joi.number().required(),
  amount: Joi.number().required(),
  duration: Joi.number().required(),
  durationType: Joi.string().required(),
});

//loanApplication joi
const loanApplicationSchema = Joi.object({
  // is valid objectId
  loanPackageId: isObjectId.required(),
  nin: Joi.string().required(),
  businessName: Joi.string().required(),
  businessRegistrationNumber: Joi.string().allow(null),
  businessAddress: Joi.string().required(),
  businessSector: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  bankName: Joi.string().required(),
  accountName: Joi.string().required(),
  accountNumber: Joi.string().required(),
});

// Define Joi schema for editing loan application record
const editLoanApplicationSchema = Joi.object({
  status: Joi.number().valid(0, 1, 2, 3),
});

// Define Joi schema for transaction
const transactionSchema = Joi.object({
  amount: Joi.number().required(),
  transactionId: Joi.string().required(),
  transactionType: Joi.number().valid(0, 1).required(),
  transactionFrom: Joi.string().required(),
  transactionStatus: Joi.string().required(),
});

// schema for customer create
const customerCreateSchema = Joi.object({
  customerImage: Joi.string().required(),
  customerName: Joi.string().required(),
  customerPhone: Joi.string().required(),
  status: Joi.number().valid(0, 1).required(),
  email: Joi.string().required(),
});
// edit customer create schema
const editCustomerCreateSchema = Joi.object({
  customerImage: Joi.string().allow(null),
  customerName: Joi.string().allow(null),
  customerPhone: Joi.string().allow(null),
  status: Joi.number().valid(0, 1).allow(null),
  email: Joi.string().allow(null),
});

// Define debtor schema
const debtorValidationSchema = Joi.object({
  image: Joi.string().required(),
  amount: Joi.number().required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  status: Joi.number().valid(0, 1).required(), // Assuming status should be 0 or 1
});
// Define debtor edit schema
const debtorEditValidationSchema = Joi.object({
  image: Joi.string(),
  amount: Joi.number(),
  name: Joi.string(),
  phone: Joi.string(),
  status: Joi.number().valid(0, 1), // Assuming status should be 0 or 1
});

// Define debtor remainder schema
const debtNotificationSchema = Joi.object({
  debtorName: Joi.string().required(),
  debtorEmail: Joi.string().email().required(),
  debtorPhoneNumber: Joi.string().required(),
  venderBankName: Joi.string().required(),
  venderAccountName: Joi.string().required(),
  venderAccountNumber: Joi.string().required(),
  amount: Joi.number().required(),
  message: Joi.string().required(),
});

// help schema
const helpSchema = Joi.object({
  callPhoneNumber: Joi.string().required(),
  chatWhatsAppPhoneNumber: Joi.string().required(),
  contactEmail: Joi.string().required(),
});

module.exports = {
  validateProduct,
  validateEditProduct,
  inventoryProductSchema,
  editInventoryProductSchema,
  validateBuyerSignUp,
  validateBuyerEdit,
  validateVenderSignUp,
  validateVenderEdit,
  saleJoi,
  editSaleJoi,
  incomeJoi,
  editIncomeJoi,
  expenseJoi,
  editExpenseJoi,
  invoiceJoi,
  editInvoiceJoi,
  storeJoi,
  orderJoi,
  validateNotification,
  validateBankDetails,
  validatePlanSchema,
  productSortedSchema,
  loanPackageSchema,
  loanApplicationSchema,
  editLoanApplicationSchema,
  transactionSchema,
  customerCreateSchema,
  editCustomerCreateSchema,
  debtorValidationSchema,
  debtorEditValidationSchema,
  debtNotificationSchema,
  helpSchema,
};
