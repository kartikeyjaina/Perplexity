import { Router } from "express";

import {
  sendMessage,
  getChats,
  getMessages,
  deleteChat,
} from "../controllers/chat.controller.js";

import { authUser } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

chatRouter.post("/message", authUser, sendMessage);

chatRouter.get("/chats", authUser, getChats);

chatRouter.get("/chats/:chatId/messages", authUser, getMessages);

chatRouter.delete("/chats/:chatId", authUser, deleteChat);

export default chatRouter;
