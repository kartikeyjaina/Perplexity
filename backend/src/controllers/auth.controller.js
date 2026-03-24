import jwt from "jsonwebtoken";
import cookieparser from "cookie-parser";

import { sendEmail } from "../services/mail.service.js";
import userModel from "../models/user.model.js";

export async function register(req, res) {
  const { username, email, password } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ email }, { username }],
  });

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "User with this email or username already exists",
      success: false,
      err: "User already exists",
    });
  }

  const user = await userModel.create({ username, email, password });
  const emailVerificationToken = jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
  );
  const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${emailVerificationToken}`;

  await sendEmail({
    to: email,
    subject: "Welcome to Perplexity!",
    html: `
                <p>Hi ${username},</p>
                <p>Thank you for registering at <strong>Perplexity</strong>. We're excited to have you on board!</p>
                <a href=${verifyUrl}>Verify Email</a>
                <p>Best regards,<br>The Perplexity Team</p>
        `,
  });

  res.status(201).json({
    message: "User registered successfully",
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
      success: false,
      err: "User not found",
    });
  }
  if (!user.verified) {
    return res.status(403).json({
      message: "Email not verified",
      success: false,
      err: "Please verify your email before logging in",
    });
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid email or password",
      success: false,
      err: "Incorrect password",
    });
  }
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.cookie("token", token);
  res.status(200).json({
    message: "Login successful",
    success: true,
    user,
  });
}

export async function getMe(req,res){
  const token = req.user.id;
  const user = await userModel.findById(token).select("-password");
  if(!user){
    return res.status(404).json({
      message:"User not found",
      success:false,
      err:"No user with this id"
    });
  }
  res.status(200).json({
    message:"User details fetched successfully",
    success:true,
    user
  });
}

export async function verifyEmail(req, res) {
  const { token } = req.query;
  const user = null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = await userModel.findOne({ email: decoded.email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid token",
        success: false,
        err: "User not found",
      });
    }
    user.verified = true;
    await user.save();
    const html = `<h1>Email Verified Successfully</h1>
  <p>You can now login</p>`;
    res.send(html);
  } catch (err) {
    return res.status(400).json({
      message: "Invalid or expired token",
      success: false,
      err: err.message,
    });
  }
}
