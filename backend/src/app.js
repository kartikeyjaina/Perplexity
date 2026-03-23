import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Health check endpoint
app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});

export default app;