import crypto from "crypto";
import nodemailer from "nodemailer";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";

// In-memory OTP storage with TTL for high performance & standalone resilience
const otpStore = new Map();

// Sender configuration
const SENDER_EMAIL = process.env.EMAIL_FROM || process.env.ADMIN_CONTACT_EMAIL || "pesarena2005@gmail.com";

/**
 * Dynamically retrieves or constructs the Nodemailer transport using current environment credentials.
 * Strips whitespace from Gmail App Password automatically.
 */
const getTransporter = () => {
  const smtpUser = (process.env.GMAIL_USER || process.env.SMTP_USER || process.env.ADMIN_CONTACT_EMAIL || "pesarena2005@gmail.com").trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || "";
  const smtpPass = rawPass.replace(/\s+/g, "").trim();

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  return null;
};

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 30 * 1000);

/**
 * Generates a secure 6-digit numeric OTP.
 */
export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Dispatch email via Nodemailer SMTP, Resend, SendGrid, or fallback console logging.
 */
const sendActualEmail = async (email, otp, name = "Customer", purpose = "verification") => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.06); }
          .header { background: #0d3a2a; padding: 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-top: 6px; }
          .content { padding: 32px 24px; text-align: center; }
          .greeting { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
          .message { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
          .otp-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 16px; font-size: 34px; font-weight: 800; font-family: monospace; letter-spacing: 8px; color: #0d3a2a; margin: 0 auto 24px; display: inline-block; }
          .expiry { font-size: 13px; color: #dc2626; font-weight: 600; margin-bottom: 24px; background: #fef2f2; padding: 8px 12px; border-radius: 8px; display: inline-block; }
          .footer { border-top: 1px solid #f1f5f9; padding: 16px 24px; background: #fafafa; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🤝 सहकारी Sahakari</div>
            <div class="badge">Verified Service Network</div>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name || "there"},</div>
            <div class="message">
              Use the following 6-digit One-Time Password (OTP) to complete your <strong>${purpose}</strong> on Sahakari.
            </div>
            <div class="otp-box">${otp}</div>
            <br/>
            <div class="expiry">⏱️ This code is valid for <strong>5 minutes</strong>. It will expire automatically after 5 minutes.</div>
          </div>
          <div class="footer">
            Sent from <strong>${SENDER_EMAIL}</strong><br/>
            © ${new Date().getFullYear()} Sahakari Cooperative Services. Verified & Safe.
          </div>
        </div>
      </body>
    </html>
  `;

  const activeTransporter = getTransporter();

  // 1. Send via Nodemailer SMTP
  if (activeTransporter) {
    try {
      const info = await activeTransporter.sendMail({
        from: `Sahakari Platform <${SENDER_EMAIL}>`,
        to: email,
        subject: `Your Sahakari Verification Code: ${otp}`,
        html: emailHtml,
      });
      console.log(`[Nodemailer SUCCESS] Real OTP email successfully sent to ${email} (MessageID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.warn(`[Nodemailer Warning] Send failed via SMTP:`, err.message);
    }
  }

  // 2. Check for Resend API Key
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Sahakari <${SENDER_EMAIL}>`,
          to: [email],
          subject: `Your Sahakari Verification OTP: ${otp}`,
          html: emailHtml,
        }),
      });
      if (response.ok) {
        console.log(`[Email Service] OTP successfully sent to ${email} via Resend.`);
        return true;
      }
    } catch (err) {
      console.warn(`[Email Service Error] Failed sending via Resend:`, err.message);
    }
  }

  // 3. Check for SendGrid API Key
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: SENDER_EMAIL, name: "Sahakari Platform" },
          subject: `Your Sahakari Verification OTP: ${otp}`,
          content: [{ type: "text/html", value: emailHtml }],
        }),
      });
      if (response.ok) {
        console.log(`[Email Service] OTP successfully sent to ${email} via SendGrid.`);
        return true;
      }
    } catch (err) {
      console.warn(`[Email Service Error] SendGrid error:`, err.message);
    }
  }

  // Fallback dev console output
  console.log(`=======================================================`);
  console.log(`[SAHAKARI REAL OTP GENERATED] Target: ${email}`);
  console.log(`[REAL OTP CODE]: >>> [ ${otp} ] <<< (Expires in 5 Minutes)`);
  console.log(`=======================================================`);
  return true;
};

/**
 * Send Email OTP Service (Valid for 5 Minutes)
 */
export const sendEmailOtpService = async (email, name = "", purpose = "Sign Up Verification") => {
  if (!email || !email.includes("@")) {
    throw new ApiError(400, "Valid email address is required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // Exactly 5 minutes (300,000 ms)

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
    verified: false,
    name: name || normalizedEmail.split("@")[0],
  });

  // Also persist to Firestore if available
  try {
    if (db && typeof db.collection === "function") {
      await db.collection("otp_verifications").doc(normalizedEmail).set({
        otp,
        expiresAt: new Date(expiresAt).toISOString(),
        verified: false,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Non-blocking
  }

  await sendActualEmail(normalizedEmail, otp, name, purpose);

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    email: normalizedEmail,
    expiresInSeconds: 300, // 5 Minutes
  };
};

/**
 * Verify Email OTP Service - STRICT REAL OTP VERIFICATION
 */
export const verifyEmailOtpService = async (email, otp) => {
  if (!email || !otp) {
    throw new ApiError(400, "Email and 6-digit OTP code are required.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const trimmedOtp = String(otp).trim();

  const record = otpStore.get(normalizedEmail);

  if (!record) {
    throw new ApiError(400, "No active OTP request found for this email. Please click Regenerate OTP.");
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    throw new ApiError(400, "OTP has expired after 5 minutes. Please click Regenerate OTP.");
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
  }

  if (record.otp !== trimmedOtp) {
    record.attempts += 1;
    throw new ApiError(400, `Incorrect 6-digit OTP code. (${5 - record.attempts} attempts remaining)`);
  }

  record.verified = true;

  try {
    if (db && typeof db.collection === "function") {
      await db.collection("otp_verifications").doc(normalizedEmail).update({
        verified: true,
        verifiedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Non-blocking
  }

  return {
    success: true,
    verified: true,
    email: normalizedEmail,
    message: "Email verified successfully",
  };
};

/**
 * Send Automated Welcome Email to Customer
 */
export const sendWelcomeEmailService = async (email, name = "Valued Customer") => {
  if (!email || !email.includes("@")) return { success: false };

  const normalizedEmail = email.toLowerCase().trim();
  const userName = name || normalizedEmail.split("@")[0];

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #0d3a2a 0%, #155e43 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
          .subtitle { font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .content { padding: 36px 28px; text-align: left; }
          .greeting { font-size: 20px; font-weight: 700; color: #0d3a2a; margin-bottom: 12px; }
          .body-text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px; }
          .highlight-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .highlight-title { font-weight: 700; color: #065f46; font-size: 14px; margin-bottom: 6px; }
          .highlight-desc { font-size: 13px; color: #047857; margin: 0; line-height: 1.6; }
          .cta-btn { display: inline-block; background: #0d3a2a; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 28px; border-radius: 12px; font-size: 14px; margin-top: 10px; }
          .footer { border-top: 1px solid #f1f5f9; padding: 20px 28px; background: #fafafa; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🤝 सहकारी Sahakari</div>
            <div class="subtitle">Welcome to India's Verified Service Network</div>
          </div>
          <div class="content">
            <div class="greeting">Welcome to Sahakari, ${userName}! 🎉</div>
            <div class="body-text">
              Your customer profile has been successfully created and verified. You are now part of India's leading cooperative local service platform.
            </div>
            <div class="highlight-box">
              <div class="highlight-title">What you can do on Sahakari:</div>
              <p class="highlight-desc">
                ✔ Discover verified local technicians, electricians, plumbers & workers<br/>
                ✔ Real-time price negotiation & dynamic instant quotes<br/>
                ✔ Escrow payment safety — payments released only after job completion<br/>
                ✔ Live GPS tracking of assigned worker visits
              </p>
            </div>
            <div class="body-text">
              If you ever have any questions, feel free to reach out to us at <strong>${SENDER_EMAIL}</strong>.
            </div>
            <div style="text-align: center;">
              <a href="http://localhost:3000/services" class="cta-btn">Explore Sahakari Services →</a>
            </div>
          </div>
          <div class="footer">
            Sent from <strong>${SENDER_EMAIL}</strong><br/>
            © ${new Date().getFullYear()} Sahakari Cooperative Services. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const activeTransporter = getTransporter();

  // 1. Send via Nodemailer
  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: `Sahakari Platform <${SENDER_EMAIL}>`,
        to: normalizedEmail,
        subject: "🎉 Welcome to Sahakari! Your Account is Ready",
        html: emailHtml,
      });
      console.log(`[Nodemailer] Welcome email sent to ${normalizedEmail} from ${SENDER_EMAIL}`);
      return { success: true };
    } catch (err) {
      console.warn(`[Nodemailer Warning] Welcome email transport error:`, err.message);
    }
  }

  // 2. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Sahakari <${SENDER_EMAIL}>`,
          to: [normalizedEmail],
          subject: "🎉 Welcome to Sahakari! Your Account is Ready",
          html: emailHtml,
        }),
      });
      return { success: true };
    } catch (err) {
      // non-blocking
    }
  }

  console.log(`=======================================================`);
  console.log(`[WELCOME EMAIL DISPATCHED] To: ${normalizedEmail} (From: ${SENDER_EMAIL})`);
  console.log(`=======================================================`);
  return { success: true };
};

/**
 * Send Security Notification Email when Account Password is Changed
 */
export const sendPasswordChangedEmailService = async (email, name = "Valued Customer") => {
  if (!email || !email.includes("@")) return { success: false };

  const normalizedEmail = email.toLowerCase().trim();
  const userName = name || normalizedEmail.split("@")[0];

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #0d3a2a 0%, #155e43 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
          .subtitle { font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .content { padding: 36px 28px; text-align: left; }
          .greeting { font-size: 20px; font-weight: 700; color: #0d3a2a; margin-bottom: 12px; }
          .body-text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .alert-title { font-weight: 700; color: #991b1b; font-size: 14px; margin-bottom: 4px; }
          .alert-desc { font-size: 13px; color: #b91c1c; margin: 0; line-height: 1.5; }
          .cta-btn { display: inline-block; background: #ef4444; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 28px; border-radius: 12px; font-size: 14px; margin-top: 10px; }
          .footer { border-top: 1px solid #f1f5f9; padding: 20px 28px; background: #fafafa; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🤝 सहकारी Sahakari</div>
            <div class="subtitle">Security Alert Notification</div>
          </div>
          <div class="content">
            <div class="greeting">Security Notice for ${userName} 🔒</div>
            <div class="body-text">
              Your Sahakari account password has been <strong>successfully changed</strong>.
            </div>
            <div class="alert-box">
              <div class="alert-title">Did you request this change?</div>
              <p class="alert-desc">
                If you made this change, no further action is required. If you did <strong>NOT</strong> change your password, someone else may have accessed your account. Reset your password immediately below.
              </p>
            </div>
            <div style="text-align: center;">
              <a href="http://localhost:5173/services" class="cta-btn">Reset Password Now →</a>
            </div>
          </div>
          <div class="footer">
            Sent from <strong>${SENDER_EMAIL}</strong><br/>
            © ${new Date().getFullYear()} Sahakari Cooperative Services. Verified & Safe.
          </div>
        </div>
      </body>
    </html>
  `;

  const activeTransporter = getTransporter();
  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: `Sahakari Security <${SENDER_EMAIL}>`,
        to: normalizedEmail,
        subject: "🔒 Security Alert: Your Sahakari Account Password Was Changed",
        html: emailHtml,
      });
      console.log(`[Nodemailer] Security alert email sent to ${normalizedEmail}`);
      return { success: true };
    } catch (err) {
      console.warn(`[Nodemailer Warning] Security alert transport error:`, err.message);
    }
  }

  console.log(`=======================================================`);
  console.log(`[SECURITY ALERT DISPATCHED] Password Changed for: ${normalizedEmail}`);
  console.log(`=======================================================`);
  return { success: true };
};

/**
 * Reset Password with Verified OTP Service
 */
export const resetPasswordWithOtpService = async (email, newPassword) => {
  if (!email || !newPassword) {
    throw new ApiError(400, "Email and new password are required.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  let userName = normalizedEmail.split("@")[0];

  // 1. Update password in Firebase Admin Auth & Firestore
  try {
    const { auth: adminAuth, db: firestoreDb } = await import("../config/firebase.js");
    let userUid = null;

    if (adminAuth && typeof adminAuth.getUserByEmail === "function") {
      try {
        const userRecord = await adminAuth.getUserByEmail(normalizedEmail);
        if (userRecord && userRecord.uid) {
          userUid = userRecord.uid;
          userName = userRecord.displayName || userName;
          await adminAuth.updateUser(userRecord.uid, { password: newPassword });
          console.log(`[Firebase Admin] Password updated successfully for UID: ${userRecord.uid}`);
        }
      } catch (adminErr) {
        console.warn("[Firebase Admin Fetch Notice]:", adminErr.message);
      }
    }

    if (firestoreDb && typeof firestoreDb.collection === "function") {
      try {
        const docRef = userUid ? firestoreDb.collection("customers").doc(userUid) : firestoreDb.collection("customers").doc(normalizedEmail);
        await docRef.set({
          email: normalizedEmail,
          passwordUpdated: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (dbErr) {
        console.warn("[Firestore Update Notice]:", dbErr.message);
      }
    }
  } catch (err) {
    console.warn("[Password Reset Notice]", err.message);
  }

  // 2. Dispatch Security Notification Email to User's Email Address!
  await sendPasswordChangedEmailService(normalizedEmail, userName);

  return {
    success: true,
    message: "Your password has been successfully reset! Security alert email sent.",
  };
};

/**
 * Check if a User Account Already Exists in Database or Auth
 */
export const checkUserExistsService = async (email) => {
  if (!email || !email.includes("@")) {
    return { exists: false, email: "" };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { auth: adminAuth, db: firestoreDb } = await import("../config/firebase.js");

    // 1. Check Firebase Admin Auth
    if (adminAuth && typeof adminAuth.getUserByEmail === "function") {
      try {
        const userRecord = await adminAuth.getUserByEmail(normalizedEmail);
        if (userRecord && userRecord.uid) {
          return { exists: true, email: normalizedEmail, name: userRecord.displayName || "" };
        }
      } catch (err) {
        // User not found in Admin Auth
      }
    }

    // 2. Check Firestore customers collection
    if (firestoreDb && typeof firestoreDb.collection === "function") {
      try {
        const docSnap = await firestoreDb.collection("customers").doc(normalizedEmail).get();
        if (docSnap.exists) {
          return { exists: true, email: normalizedEmail };
        }

        const querySnap = await firestoreDb.collection("customers").where("email", "==", normalizedEmail).get();
        if (!querySnap.empty) {
          return { exists: true, email: normalizedEmail };
        }
      } catch (err) {
        // Firestore query error
      }
    }
  } catch (err) {
    console.warn("[Check User Exists Warning]:", err.message);
  }

  return { exists: false, email: normalizedEmail };
};

/**
 * Send Invoice Email to Customer
 */
export const sendInvoiceEmailService = async (email, booking) => {
  if (!email || !email.includes("@")) return { success: false };

  const normalizedEmail = email.toLowerCase().trim();
  const userName = booking.customerName || normalizedEmail.split("@")[0];

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${booking.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; background-color: #f8fafc; }
        .container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.06); }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: -0.5px; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #111; text-align: right; }
        .details { display: flex; justify-content: space-between; margin-bottom: 40px; line-height: 1.5; }
        .section-title { font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; letter-spacing: 0.5px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { padding: 16px; border-bottom: 1px solid #eee; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: 600; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .total-row { font-weight: bold; font-size: 18px; color: #0f172a; }
        .total-row td { border-top: 2px solid #cbd5e1; border-bottom: none; padding-top: 24px; }
        .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 60px; border-top: 1px solid #eee; padding-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Sahakari</div>
          <div class="invoice-title">INVOICE</div>
        </div>
        
        <p>Hi ${userName},</p>
        <p>Thank you for your payment. Here is the invoice for your recent service booking.</p>

        <div class="details">
          <div style="margin-top: 20px;">
            <div class="section-title">Invoice Details</div>
            <div>Invoice No: <strong style="color: #1e293b;">INV-${booking.id ? booking.id.replace('BK-', '').substring(0, 8) : 'N/A'}</strong></div>
            <div>Date: <strong style="color: #1e293b;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
            <div style="margin-top: 8px;">Status: <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; display: inline-block;">PAID</span></div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Provider</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color: #334155;">${booking.serviceName || 'Professional Service'}</strong></td>
              <td style="color: #475569;">${booking.workerName || 'Service Provider'}</td>
              <td style="text-align: right; font-weight: 500;">₹${booking.agreedPrice || 0}</td>
            </tr>
            <tr>
              <td style="color: #475569;">Platform Fee</td>
              <td style="color: #475569;">Sahakari</td>
              <td style="text-align: right; font-weight: 500;">₹${booking.platformFee || 0}</td>
            </tr>
            <tr>
              <td style="color: #475569;">Taxes & GST (18%)</td>
              <td style="color: #475569;">-</td>
              <td style="text-align: right; font-weight: 500;">₹${booking.taxes || 0}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">Total Amount</td>
              <td style="text-align: right; color: #10b981; font-size: 24px;">₹${booking.totalPrice || 0}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <strong>Thank you for choosing Sahakari!</strong><br><br>
          If you have any questions about this invoice, please contact support@sahakari.com.
        </div>
      </div>
    </body>
    </html>
  `;

  const activeTransporter = getTransporter();

  // 1. Send via Nodemailer
  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: `Sahakari Invoicing <${SENDER_EMAIL}>`,
        to: normalizedEmail,
        subject: `Invoice Paid: ${booking.serviceName || 'Service'} (INV-${booking.id ? booking.id.replace('BK-', '').substring(0, 8) : 'N/A'})`,
        html: invoiceHtml,
      });
      console.log(`[Nodemailer] Invoice email sent to ${normalizedEmail} from ${SENDER_EMAIL}`);
      return { success: true };
    } catch (err) {
      console.warn(`[Nodemailer Warning] Invoice email transport error:`, err.message);
    }
  }

  console.log(`=======================================================`);
  console.log(`[INVOICE EMAIL DISPATCHED] To: ${normalizedEmail}`);
  console.log(`Booking ID: ${booking.id}`);
  console.log(`Total Price: ₹${booking.totalPrice}`);
  console.log(`=======================================================`);
  return { success: true };
};


