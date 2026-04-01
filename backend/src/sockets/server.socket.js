import { Server } from "socket.io";

let io;

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
  });
}
export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
