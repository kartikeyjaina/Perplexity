import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { generateResponse, generateChatTitle } from "../services/ai.service.js";

export async function sendMessage(req, res) {
  const { message, chat: chatId } = req.body;

  let chat = null;
  let title = null;

  if (!chatId) {
    title = await generateChatTitle(message);
    chat = await chatModel.create({
      user: req.user.id,
      title,
    });
  }

  const userMessage = await messageModel.create({
    chat: chat._id,
    content: message,
    roles: "user",
  });

  // If chatId is provided, find the existing chat
  const messages = await messageModel.find({ chat: chat._id || chatId });

  // generate a response based on the message and the chat history
  const result = await generateResponse(messages);

  const aiMessage = await messageModel.create({
    chat: chat._id || chat._id,
    content: result,
    roles: "ai",
  });

  res.status(201).json({ title, chat, aiMessage });
}

export async function getChats(req, res) {
  const user = req.user;

  const chats = await chatModel.find({ user: user.id });

  res.status(200).json({
    message: "Chats retrieved successfully",
    chats,
  });
}

export async function getMessages(req, res) {
  const { chatId } = req.params;

  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id,
  });
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }
  const messages = await messageModel.find({ chat: chatId });
  res.status(200).json({
    message: "Messages retrieved successfully",
    messages,
  });
}

export async function deleteChat(req, res) {
  const { chatId } = req.params;
  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id,
  });
  await messageModel.deleteMany({ chat: chatId });
  if(!chat){
    return res.status(404).json({ message: "Chat not found" });
  }
  res.status(200).json({
    message: "Chat deleted successfully",
  });
}
