import jwt from "jsonwebtoken";

import { sendEmail } from "../services/mail.service.js";
import userModel from "../models/user.model.js";

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Attempt to create user (handles race condition with unique indexes)
    try {
      const user = await userModel.create({ username, email, password });

      const emailVerificationToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
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
    } catch (mongoErr) {
      // Handle duplicate key error (E11000)
      if (mongoErr.code === 11000) {
        const duplicateField = Object.keys(mongoErr.keyValue)[0];
        return res.status(400).json({
          message: `User with this ${duplicateField} already exists`,
          success: false,
          err: `${duplicateField} already exists`,
        });
      }
      throw mongoErr;
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
      success: false,
      err: error.message,
    });
  }
}

export async function login(req, res) {
  try {
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
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.status(200).json({
      message: "Login successful",
      success: true,
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
        id: user._id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      success: false,
      err: error.message,
    });
  }
}

export async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        err: "No user with this id",
      });
    }
    res.status(200).json({
      message: "User details fetched successfully",
      success: true,
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
        id: user._id,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      message: "Server error fetching user data",
      success: false,
      err: error.message,
    });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });
    res.status(200).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Server error during logout",
      success: false,
      err: error.message,
    });
  }
}

export async function verifyEmail(req, res) {
  const { token } = req.query;
  let user = null;

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
