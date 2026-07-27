import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

function createAuthCookie(res, userId, email) {
  const token = jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Attempt to create user (handles race condition with unique indexes)
    try {
      const user = await userModel.create({ username, email, password });
      createAuthCookie(res, user._id, user.email);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
          },
        },
      });
    } catch (mongoErr) {
      // Handle duplicate key error (E11000)
      if (mongoErr.code === 11000) {
        const duplicateField = Object.keys(mongoErr.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `User with this ${duplicateField} already exists`,
          err: `${duplicateField} already exists`,
          data: null,
        });
      }
      throw mongoErr;
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      err: error.message,
      data: null,
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        err: "User not found",
        data: null,
      });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        err: "Incorrect password",
        data: null,
      });
    }
    createAuthCookie(res, user._id, user.email);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          username: user.username,
          email: user.email,
          id: user._id,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      err: error.message,
      data: null,
    });
  }
}

export async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        err: "No user with this id",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: {
        user: {
          username: user.username,
          email: user.email,
          id: user._id,
        },
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user data",
      err: error.message,
      data: null,
    });
  }
}

export async function logout(req, res) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      path: "/",
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      err: error.message,
      data: null,
    });
  }
}
