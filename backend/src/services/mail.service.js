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

async function createTransporter() {
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
    console.error("Email send failed. Retrying with fresh transporter:", err);
    cachedTransporter = null;

    const transporter = await getTransporter();
    const details = await transporter.sendMail(mailOptions);
    console.log("Email sent:", details);
    return details;
  }
}
