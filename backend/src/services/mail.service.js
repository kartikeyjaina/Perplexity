import "dotenv/config";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

let cachedTransporter = null;

function isOauthCredentialError(error) {
  const message = `${error?.message || ""} ${error?.response?.data?.error || ""}`.toLowerCase();
  return (
    message.includes("invalid_grant") ||
    message.includes("invalid_client") ||
    message.includes("unauthorized_client") ||
    message.includes("invalid_request")
  );
}

function formatMailError(error, fallbackMessage) {
  const detail = error?.response?.data?.error_description || error?.message || fallbackMessage;
  const wrappedError = new Error(fallbackMessage);
  wrappedError.cause = error;
  wrappedError.details = detail;
  return wrappedError;
}

async function createTransporter() {
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

async function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = await createTransporter();
    await cachedTransporter.verify();
    console.log("Email transporter ready");
  }

  return cachedTransporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: process.env.GOOGLE_USER,
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
  } catch (err) {
    if (isOauthCredentialError(err)) {
      cachedTransporter = null;
      throw formatMailError(
        err,
        "Gmail OAuth credentials are invalid or expired",
      );
    }

    console.error("Email send failed. Retrying with fresh transporter:", err);
    cachedTransporter = null;

    try {
      const transporter = await getTransporter();
      const details = await transporter.sendMail(mailOptions);
      console.log("Email sent:", details);
      return details;
    } catch (retryErr) {
      throw formatMailError(retryErr, "Failed to send email");
    }
  }
}
