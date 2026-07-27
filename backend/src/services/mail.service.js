import "dotenv/config";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

let cachedTransporter = null;

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function hasOauthConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_USER,
  );
}

function isOauthCredentialError(error) {
  const message = `${error?.message || ""} ${error?.response?.data?.error || ""}`.toLowerCase();
  return (
    message.includes("invalid_grant") ||
    message.includes("invalid_client") ||
    message.includes("unauthorized_client") ||
    message.includes("invalid_request")
  );
}

function isSmtpAuthError(error) {
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    message.includes("authentication failed") ||
    message.includes("invalid login") ||
    message.includes("eauth")
  );
}

function formatMailError(error, fallbackMessage) {
  const detail =
    error?.response?.data?.error_description || error?.message || fallbackMessage;
  const wrappedError = new Error(fallbackMessage);
  wrappedError.cause = error;
  wrappedError.details = detail;
  return wrappedError;
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function createOauthTransporter() {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground",
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  try {
    const accessToken = await oauth2Client.getAccessToken();

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken?.token || accessToken,
      },
    });
  } catch (error) {
    if (isOauthCredentialError(error)) {
      throw formatMailError(
        error,
        "Gmail OAuth credentials are invalid or expired",
      );
    }

    throw formatMailError(error, "Failed to create mail transporter");
  }
}

async function createTransporter() {
  if (hasSmtpConfig()) {
    return createSmtpTransporter();
  }

  if (hasOauthConfig()) {
    return createOauthTransporter();
  }

  throw new Error(
    "Email configuration is missing. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS or Google OAuth env vars.",
  );
}

async function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = await createTransporter();
    await cachedTransporter.verify();
    console.log(
      hasSmtpConfig()
        ? "SMTP email transporter ready"
        : "OAuth email transporter ready",
    );
  }

  return cachedTransporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GOOGLE_USER || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  };

  try {
    const transporter = await getTransporter();
    const details = await transporter.sendMail(mailOptions);
    console.log("Email sent:", details);
    return details;
  } catch (error) {
    cachedTransporter = null;

    if (isOauthCredentialError(error) || isSmtpAuthError(error)) {
      throw formatMailError(
        error,
        hasSmtpConfig()
          ? "SMTP credentials are invalid or expired"
          : "Gmail OAuth credentials are invalid or expired",
      );
    }

    throw formatMailError(error, "Failed to send email");
  }
}
