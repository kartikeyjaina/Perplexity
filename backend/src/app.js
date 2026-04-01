import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import cors from "cors";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(morgan("dev"));
//Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/auth", authRouter);

app.use("/api/chats",chatRouter);

export default app;
