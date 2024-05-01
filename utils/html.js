exports.htmlForOTP = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verification Code</title>
    <style>
        body {
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .email-container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
        }
        p {
            color: #555;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <h1>Verification Code</h1>
        
        <p>Dear User,</p>
        
        <p>Your verification code is: <strong style="color: #0077b6;">#code#</strong></p>
        
        <p>Please use this code to complete your verification process.</p>
        
        <p>Thank you for using our service.</p>
    </div>
</body>
</html>
`;

exports.htmlForWelcome = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to NesMasPoint</title>
</head>

<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; padding: 20px;">

    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px;">
        <p>Dear Esteemed User,</p>
        <p>Welcome to NesMasPoint! We're excited to have you with us.</p>
        <p>As the founder and CEO, I and the NesMasPoint team extend a warm welcome. Choosing NesMasPoint means streamlined operations and growth for your business.</p>

        <h3 style="color: #333;">Key points to get started:</h3>
        <ol>
            <li><strong>Explore Features:</strong> Navigate our user-friendly interface with powerful tools for an enhanced business management experience.</li>
            <li><strong>Support Resources:</strong> Need help? Contact our support team at <a href="mailto:support@nesmaspoint.com">support@nesmaspoint.com</a> or visit <a href="http://www.nesmaspoint.com">www.nesmaspoint.com</a>.</li>
            <li><strong>Stay Updated:</strong> Follow us <a href="https://twitter.com/nesmaspoint">@nesmaspoint</a> on social media for updates, tips, and new features.</li>
        </ol>

        <p>Thank you for choosing NesMasPoint. We're here for your success. Feel free to share feedback or suggestions.</p>
        <p>Best regards,</p>
        <p>Donalson Ijeoma Ejeokwuare<br>Founder and CEO<br>NesMasPoint</p>
    </div>

</body>

</html>
`;

exports.htmlSubscriptionCreated = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Success</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f5f5f5;
        }
        .message-container {
            text-align: center;
            padding: 20px;
            border-radius: 5px;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 600px; /* Added max-width to limit container width */
            margin: auto; /* Center the container horizontally */
        }
        h1 {
            color: #333333;
            margin-bottom: 10px;
        }
        p {
            color: #666666;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="message-container">
        <h1>Subscription Successful!</h1>
        <p>
          Plan Name: #planName# <br>
          Plan Price: #planPrice# <br>
          Duration: #duration# <br>
          Subscription Date: #subscriptionDate# <br>
          Thank you for subscribing!
        </p>
    </div>
</body>
</html>
`;

exports.sendPackageExpireAlert = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subscription Expiration Reminder</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Subscription Expiration Reminder</h2>
        <p>Hello #name#,</p>
        <p>This is a friendly reminder that your subscription is set to expire in one week. We'd hate to see you go!</p>
        <p>Please take a moment to review your subscription status and consider renewing to continue enjoying our services.</p>
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        <p>Thank you for choosing us!</p>
        <p>Sincerely,<br>Your nesmaspoint Team</p>
    </div>
</body>
</html>
`;

exports.htmlForCustomerEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Banner Message</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
    }

    .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        padding: 20px;
    }

    .banner {
        border: 2px solid #007bff;
        background-color: #fff;
        color: #007bff;
        padding: 20px;
        border-radius: 5px;
    }

    .banner p {
        margin: 0;
        color: #fff;
        font-size: 16px;
    }

    .banner p.incSize {
        font-size: 20px;
        font-weight: bold;
        margin-top: 10px;
    }

    .poweredBy {
        color: #007bff;
        margin-top: 10px;
        font-size: 18px;
        text-align: center;
    }
</style>
</head>
<body>
<div class="container">
    <div class="banner">
        <p>Dear Amazing Customer! I am <b>##senderName##</b> from <b>##storeName##</b> store. ##message##</p>
        <div class="incSize poweredBy">Powered by NesMasPoint</div>
    </div>
</div>
</body>
</html>
`;

exports.htmlForDebtRemainderEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nesmaspoint Debt Reminder</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
    }

    .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        padding: 20px;
        border-style: solid;
        border-color: blue;
        box-shadow: 5px 10px;
    }

    .header {
        background-color: #007bff;
        color: #fff;
        padding: 10px;
        text-align: center;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
    }

    .content {
        padding: 20px;
    }

    .field {
        margin-bottom: 10px;
    }

    .field label {
        font-weight: bold;
    }

    .remainder {
        argin-bottom: 10px;
        background-color: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 5px;
        font-weight: bold;
    }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h2>Nesmaspoint Debt Reminder</h2>
    </div>
    <div class="content">
        <div class="field">
            <label>Debtor name:</label>
            <span>##debtorName##</span>
        </div>
        <div class="field">
            <label>Email:</label>
            <span>##debtorEmail##</span>
        </div>
        <div class="field">
            <label>Phone number:</label>
            <span>##debtorPhoneNumber##</span>
        </div>
        <div class="field">
            <label>Bank name:</label>
            <span>##venderBankName##</span>
        </div>
        <div class="field">
            <label>Vendor account name:</label>
            <span>##venderAccountName##</span>
        </div>
        <div class="field">
            <label>Vendor account number:</label>
            <span>##venderAccountNumber##</span>
        </div>
        <div class="field">
            <label>Amount:</label>
            <span>##amount##</span>
        </div>
        <div class="remainder">
            <label>Reminder:</label>
            <span>##message##</span>
        </div>
    </div>
</div>
</body>
</html>
`;
