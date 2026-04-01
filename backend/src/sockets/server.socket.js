import { Server } from "socket.io";

let io;

export function initSocket(httpserver) {
  io = new Server(httpserver, {
    cors: {
      origin: [process.env.FRONTEND_URL],
      credentials: true,
    },
  });
  console.log(process.env.FRONTEND_URL);
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
