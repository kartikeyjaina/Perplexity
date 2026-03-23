import { Router } from "express";
import { registerValidator } from "../validators/auth.validator.js";
import { register } from "../controllers/auth.controller.js";

const authRouter = Router();

//register endpoint
authRouter.post("/register",registerValidator,register);

// //login endpoint
// authRouter.post("/login");

// //get user details endpoint
// authRouter.get("/get-me");

// //verify email endpoint
// authRouter.get("verify-email");



export default authRouter;