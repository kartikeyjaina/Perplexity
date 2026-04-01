import app from "./src/app.js";
import connectToDb from "./src/config/database.js";
import "dotenv/config";
import http from "http";
import { initSocket } from "./src/sockets/server.socket.js";


const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

connectToDb().catch((err) => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
