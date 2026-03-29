import { Router } from "express";
import {
  loginValidator,
  registerValidator
} from "../validators/auth.validator.js";
import {
  login,
  register,
  verifyEmail,
  getMe,
  logout
} from "../controllers/auth.controller.js";
import { authuser } from "../middlewares/auth.middleware.js";

const authRouter = Router();

//register endpoint
authRouter.post("/register", registerValidator, register);

//login endpoint
authRouter.post("/login", loginValidator, login);

//get user details endpoint
authRouter.get("/get-me",authuser, getMe);

//verify email endpoint
authRouter.get("/verify-email", verifyEmail);

//logout endpoint
authRouter.post("/logout", logout);

export default authRouter;
