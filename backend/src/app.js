import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import { testAi } from "./services/ai.service.js";
const app = express();
testAi();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/auth", authRouter);

export default app;
