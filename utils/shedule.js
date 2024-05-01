// package for sheduling tasks
let cron = require("node-cron");
// model
let subscriptions_model = require("../Model/subscriptions_model");
let vender_model = require("../Model/vender_model");
// email
const { sendSubscriptionAlertEmail } = require("./emails");
// // Get the current date and time
// const currentDate = new Date();

// // Calculate the time after 8 days from now
// const eightDaysFromNow = new Date(
//   currentDate.getTime() + 6 * 24 * 60 * 60 * 1000
// );

// // Get the time after 8 days in milliseconds
// const timeAfter8DaysInMillis = eightDaysFromNow.getTime();

// console.log(timeAfter8DaysInMillis);
const sendWarningMessage = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

      // Calculate the date 1 week from now
      const oneWeekFromNow = new Date(Date.now() + oneWeekInMilliseconds);
      const expiredSubscriptionsForWarning = await subscriptions_model.find({
        "currentPackage.expirationAlert": false,
        "currentPackage.expirationDate": {
          $lte: oneWeekFromNow.getTime(),
        },
      });
      if (expiredSubscriptionsForWarning.length > 0) {
        const promises = expiredSubscriptionsForWarning.map(
          async (subscription) => {
            const vender = await vender_model.findById(subscription.venderId);
            await new sendSubscriptionAlertEmail({
              email: vender.email,
              name: vender.name,
            })
              .sendMessage()
              .then(async () => {
                // Process each subscription here
                const subscriptionRecord = await subscriptions_model.findById(
                  subscription._id
                );
                subscriptionRecord.currentPackage.expirationAlert = true;
                await subscriptionRecord.save();
              });
          }
        );

        await Promise.all(promises);
      }
    } catch (error) {
      console.log(error.message);
    }
  });
};
module.exports = { sendWarningMessage };
