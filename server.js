const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
/* routes */
const adminRouter = require("./Route/admin_routes");
const venderRouter = require("./Route/vender_routes");
const buyerRouter = require("./Route/buyer_routes");
const productRouter = require("./Route/product_routes");
const customer_routes = require("./Route/customer_routes");
const sales_routes = require("./Route/sales_routes");
const income_routes = require("./Route/income_routes");
const expense_routes = require("./Route/expense_routes");
const invoice_routes = require("./Route/invoice_routes");
const store_routes = require("./Route/store_routes");
const aws_routes = require("./Route/aws_routes");
const order_routes = require("./Route/order_routes");
const shipping_routes = require("./Route/shipping_routes");
const notification_routes = require("./Route/notification_routes");
const bankDetails_routes = require("./Route/bankDetails_routes");
const subscription_routes = require("./Route/subscription.routes");
const dashboard_routes = require("./Route/dashboard_routes");
const shareStore_routes = require("./Route/shareStore_route"); 

const app = express();
app.enable("trust proxy");
app.use(
  cors({
    origin: true, // Allow access from any origin
    credentials: true,
  })
);
app.options("*", cors());
app.use(
  express.json({
    limit: "10kb",
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/* routes */
app.use("/api/v1/vender", venderRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/buyer", buyerRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/customers", customer_routes);
app.use("/api/v1/sales", sales_routes);
app.use("/api/v1/incomes", income_routes);
app.use("/api/v1/expense", expense_routes);
app.use("/api/v1/invoice", invoice_routes);
app.use("/api/v1/store", store_routes);
app.use("/api/v1/aws", aws_routes);
app.use("/api/v1/order", order_routes);
app.use("/api/v1/shipping", shipping_routes);
app.use("/api/v1/notification", notification_routes);
app.use("/api/v1/bankDetail", bankDetails_routes);
app.use("/api/v1/subscription", subscription_routes);
app.use("/api/v1/dashboard", dashboard_routes);
app.use("/api/v1/shareStore", shareStore_routes);

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
app.all("*", (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

app.use((err, req, res, next) => {
  return next(new AppError(err, 404));
});

const DB = process.env.mongo_uri;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connection Successful!!");
    //shedule
    const { sendWarningMessage } = require("./utils/shedule");
    sendWarningMessage();
  })
  .catch((err) => console.error(err));

const port = 8000;

const server = app.listen(port, () => {
  console.log(`App run with url: http://localhost:${port}`);
});
