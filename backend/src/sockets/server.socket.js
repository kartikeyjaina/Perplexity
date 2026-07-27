import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

function readCookie(header, name) {
  const match = header?.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function initSocket(httpserver) {
  const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

  io = new Server(httpserver, {
    cors: {
      origin: [frontendOrigin],
      credentials: true,
    },
  });
  console.log(frontendOrigin);
  console.log("socket.io initialized");
  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    const token = readCookie(socket.request.headers.cookie, "token");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          socket.join(`user:${decoded.id}`);
          socket.data.userId = decoded.id;
        }
      } catch (error) {
        console.error("Socket auth failed:", error.message);
      }
    }
  });
}
export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
