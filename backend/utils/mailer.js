"use strict";

const nodemailer = require("nodemailer");
const { getConfig } = require("../config/env");

function createTransporter() {
  const config = getConfig();
  
  // Check if email credentials are configured
  if (!config.mailUser || !config.mailPass) {
    console.warn("⚠️ Email credentials not configured. Verification emails will not be sent.");
    return null;
  }
  
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
  
  if (!transporter) {
    console.warn(`⚠️ Cannot send verification email to ${toEmail}: Email not configured.`);
    // In development, log the code so it can be used for testing
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 [DEV] Verification code for ${toEmail}: ${code}`);
    }
    return; // Don't throw error in development
  }
  
  try {
    await transporter.sendMail({
      from: `"FoodHub" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: "Verify your FoodHub account",
      html: `
        <div style="font-family:Poppins,sans-serif;max-width:480px;margin:auto;padding:32px;background:#fafaf8;border-radius:16px;border:1px solid #e8e8e8;">
          <h2 style="color:#ff3131;margin-bottom:8px;">FoodHub</h2>
          <p style="color:#1a1a1a;">Your verification code is:</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#ff3131;margin:24px 0;padding:16px;background:#f5f5f5;border-radius:8px;text-align:center;">
            ${code}
          </div>
          <p style="color:#666;font-size:13px;">This code expires in 30 minutes. If you did not register, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e8e8e8;margin:20px 0;">
          <p style="color:#999;font-size:12px;text-align:center;">FoodHub - TUP Taguig Canteen Ordering System</p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${toEmail}:`, error);
    throw error; // Re-throw to let caller handle
  }
}

module.exports = { sendVerificationEmail };