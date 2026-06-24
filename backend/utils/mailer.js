"use strict";
const nodemailer = require("nodemailer");
const { getConfig } = require("../config/env");

function createTransporter() {
  const config = getConfig();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.mailUser,
      pass: config.mailPass,
    },
  });
}

async function sendVerificationEmail(toEmail, code) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"FoodHub" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Verify your FoodHub account",
    html: `
      <div style="font-family:Poppins,sans-serif;max-width:480px;margin:auto;padding:32px;background:#fafaf8;border-radius:16px;">
        <h2 style="color:#ff3131;margin-bottom:8px;">FoodHub</h2>
        <p style="color:#1a1a1a;">Your verification code is:</p>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#ff3131;margin:24px 0;">${code}</div>
        <p style="color:#a6a6a6;font-size:13px;">This code expires in 30 minutes. If you did not register, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };