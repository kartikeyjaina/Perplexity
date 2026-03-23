import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }
    const user = await User.create({
      username,
      email,
      password,
    });
    await sendEmail({
      to: user.email,
      subject: "Welcome 🎉",
      text: "Your account has been created successfully!",
    });
    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
