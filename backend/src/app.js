import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import morgan from "morgan";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(morgan("dev"));
//Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/auth", authRouter);

export default app;
