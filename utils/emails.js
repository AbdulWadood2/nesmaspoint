// const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.emailPassword);
// const pug = require("pug");
const {
  htmlForOTP,
  htmlForWelcome,
  htmlSubscriptionCreated,
  sendPackageExpireAlert,
  htmlForCustomerEmail,
  htmlForDebtRemainderEmail,
} = require("./html");

let Email = class Email {
  constructor(user, resetcode) {
    this.to = user.email;
    this.username = user.name.split(" ")[0];
    this.resetcode = resetcode;
    this.from = `${process.env.myEmail}`;
  }
  async send() {
    const msg = {
      to: this.to,
      from: "noreply@nesmaspoint.com",
      subject: "NesMesPoint verification code",
      text: "NesMesPoint verification code",
      html: htmlForOTP.replace("#code#", this.resetcode),
    };

    sgMail.send(msg);
  }
  async sendWelcome() {
    await this.send("Welcome", "Welcome to the starschat!");
  }
  async sendVerificationCode() {
    await this.send();
  }
};

let WelcomeVender = class WelcomeVender {
  constructor(user, resetcode) {
    this.to = user.email;
    this.username = user.name.split(" ")[0];
    this.resetcode = resetcode;
    this.from = `${process.env.myEmail}`;
  }
  async send() {
    const msg = {
      to: this.to,
      from: "noreply@nesmaspoint.com",
      subject: "Welcome to NesMasPoint - Simplify Your Business Management",
      text: "Welcome to NesMasPoint - Simplify Your Business Management",
      html: htmlForWelcome,
    };

    sgMail.send(msg);
  }
  async sendWelcome() {
    await this.send();
  }
};

let forSubscriptionCreatedEmailSend = class forSubscriptionCreatedEmailSend {
  constructor({ email, planName, planPrice, duration, subscriptionDate }) {
    this.to = email;
    // this.from = `${process.env.myEmail}`;
    this.planName = planName;
    this.planPrice = planPrice;
    this.duration = duration;
    this.subscriptionDate = subscriptionDate;
  }
  async send() {
    const msg = {
      to: this.to,
      from: "noreply@nesmaspoint.com",
      subject: "Subscription done successfully",
      text: "Subscription done successfully",
      html: htmlSubscriptionCreated
        .replace("#planName#", this.planName)
        .replace("#planPrice#", this.planPrice)
        .replace("#duration#", this.duration)
        .replace("#subscriptionDate#", this.subscriptionDate),
    };

    sgMail.send(msg);
  }
  async sendSubscriptionCreatedMessage() {
    await this.send();
  }
};
let sendSubscriptionAlertEmail = class sendSubscriptionAlertEmail {
  constructor({ email, name }) {
    this.to = email;
    this.name = name;
  }
  async send() {
    const msg = {
      to: this.to,
      from: "noreply@nesmaspoint.com",
      subject: "Subscription alert from Nesmaspoint",
      text: "Subscription alert from Nesmaspoint",
      html: sendPackageExpireAlert.replace("#name#", this.name),
    };

    sgMail.send(msg);
  }
  async sendMessage() {
    await this.send();
  }
};
let createdCustomerEmail = class createdCustomerEmail {
  constructor({ senderName, storeName, email, message }) {
    this.senderName = senderName;
    this.storeName = storeName;
    this.to = email;
    this.message = message;
  }
  async send() {
    const msg = {
      to: this.to,
      from: "noreply@nesmaspoint.com",
      subject: "From Nesmaspoint",
      text: "From Nesmaspoint",
      html: htmlForCustomerEmail
        .replace("##message##", this.message)
        .replace("##storeName##",this.storeName)
        .replace("##senderName##", this.senderName),
    };

    sgMail.send(msg);
  }
  async sendMessage() {
    await this.send();
  }
};
let debtRemainderEmail = class debtRemainderEmail {
  constructor({
    email,
    debtorName,
    debtorEmail,
    debtorPhoneNumber,
    venderBankName,
    venderAccountName,
    venderAccountNumber,
    amount,
    message,
  }) {
    this.to = email;
    this.debtorName = debtorName;
    this.debtorEmail = debtorEmail;
    this.debtorPhoneNumber = debtorPhoneNumber;
    this.venderBankName = venderBankName;
    this.venderAccountName = venderAccountName;
    this.venderAccountNumber = venderAccountNumber;
    this.amount = amount;
    this.message = message;
  }
  async send() {
    const msg = {
      to: this.to,
      from: "noreply@nesmaspoint.com",
      subject: "Debt remainder email",
      text: "Debt remainder email",
      html: htmlForDebtRemainderEmail
        .replace("##debtorName##", this.debtorName)
        .replace("##debtorEmail##", this.debtorEmail)
        .replace("##debtorPhoneNumber##", this.debtorPhoneNumber)
        .replace("##venderBankName##", this.venderBankName)
        .replace("##venderAccountName##", this.venderAccountName)
        .replace("##venderAccountNumber##", this.venderAccountNumber)
        .replace("##amount##", this.amount)
        .replace("##message##", this.message),
    };

    sgMail.send(msg);
  }
  async sendMessage() {
    await this.send();
  }
};

module.exports = {
  Email,
  WelcomeVender,
  forSubscriptionCreatedEmailSend,
  sendSubscriptionAlertEmail,
  createdCustomerEmail,
  debtRemainderEmail,
};
