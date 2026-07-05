"use strict";

const nodemailer = require("nodemailer");
const { getConfig } = require("../config/env");

function createTransporter() {
  const config = getConfig();
  
  // Check if email credentials are configured
  if (!config.mailUser || !config.mailPass) {
    console.warn("⚠️ Email credentials not configured. Verification emails will not be sent.");
    console.warn("   Please set MAIL_USER and MAIL_PASS in your .env file");
    return null;
  }
  
  // For Gmail, you need to use an App Password, not your regular password
  // Go to: Google Account > Security > 2-Step Verification > App Passwords
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.mailUser,
      pass: config.mailPass,
    },
    // Add these options to avoid common Gmail issues
    tls: {
      rejectUnauthorized: false
    }
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
    const config = getConfig();
    await transporter.sendMail({
      from: `"FoodHub" <${config.mailUser}>`,
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
    console.error(`❌ Failed to send verification email to ${toEmail}:`, error.message);
    // Don't throw error in development, just log it
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 [DEV] Verification code for ${toEmail}: ${code}`);
    }
    // Re-throw in production
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

async function sendBudgetCapEmail(toEmail, { capAmount, period, orderTotal, periodSpent }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`⚠️ Cannot send budget cap email to ${toEmail}: Email not configured.`);
    return;
  }

  try {
    const config = getConfig();
    await transporter.sendMail({
      from: `"FoodHub" <${config.mailUser}>`,
      to: toEmail,
      subject: "You've exceeded your FoodHub budget cap",
      html: `
        <div style="font-family:Poppins,sans-serif;max-width:480px;margin:auto;padding:32px;background:#fafaf8;border-radius:16px;border:1px solid #e8e8e8;">
          <h2 style="color:#ff3131;margin-bottom:8px;">FoodHub</h2>
          <p style="color:#1a1a1a;">Heads up — your order just pushed you past your ${period} budget cap.</p>
          <div style="margin:20px 0;padding:16px;background:#f5f5f5;border-radius:8px;">
            <p style="margin:4px 0;color:#555;">Your ${period} cap: <strong>₱${capAmount.toFixed(2)}</strong></p>
            <p style="margin:4px 0;color:#555;">Spent this ${period} so far: <strong>₱${periodSpent.toFixed(2)}</strong></p>
            <p style="margin:4px 0;color:#555;">This order: <strong>₱${orderTotal.toFixed(2)}</strong></p>
          </div>
          <p style="color:#666;font-size:13px;">You can adjust your budget cap anytime from your profile.</p>
          <hr style="border:none;border-top:1px solid #e8e8e8;margin:20px 0;">
          <p style="color:#999;font-size:12px;text-align:center;">FoodHub - TUP Taguig Canteen Ordering System</p>
        </div>
      `,
    });
    console.log(`✅ Budget cap email sent to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send budget cap email to ${toEmail}:`, error.message);
  }
}

module.exports = { sendVerificationEmail, sendBudgetCapEmail };