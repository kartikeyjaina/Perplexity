import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { generateResponse, generateChatTitle } from "../services/ai.service.js";

export async function sendMessage(req, res) {
  try {
    const { message, chatId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
        success: false,
      });
    }

    let chat = null;
    let title = null;

    if (!chatId) {
      title = await generateChatTitle(message);
      chat = await chatModel.create({
        user: req.user.id,
        title,
      });
    } else {
      chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id,
      });

      if (!chat) {
        return res.status(404).json({
          message: "Chat not found",
          success: false,
        });
      }
    }

    await messageModel.create({
      chat: chat._id,
      content: message,
      role: "user",
    });

    const messages = await messageModel
      .find({ chat: chat._id })
      .sort({ createdAt: 1 });
    const result = await generateResponse(messages);

    const aiMessage = await messageModel.create({
      chat: chat._id,
      content: result,
      role: "ai",
    });

    res.status(201).json({ title, chat, aiMessage, success: true });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({
      message: "Failed to send message",
      success: false,
      err: error.message,
    });
  }
}

export async function getChats(req, res) {
  try {
    const user = req.user;
    const chats = await chatModel
      .find({ user: user.id })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Chats retrieved successfully",
      chats,
      success: true,
    });
  } catch (error) {
    console.error("getChats error:", error);
    res.status(500).json({
      message: "Failed to get chats",
      success: false,
      err: error.message,
    });
  }
}

export async function getMessages(req, res) {
  try {
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
      _id: chatId,
      user: req.user.id,
    });
    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found", success: false });
    }
    const messages = await messageModel
      .find({ chat: chatId })
      .sort({ createdAt: 1 });
    res.status(200).json({
      message: "Messages retrieved successfully",
      messages,
      success: true,
    });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({
      message: "Failed to get messages",
      success: false,
      err: error.message,
    });
  }
}

export async function deleteChat(req, res) {
  try {
    const { chatId } = req.params;
    const chat = await chatModel.findOneAndDelete({
      _id: chatId,
      user: req.user.id,
    });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found", success: false });
    }

    await messageModel.deleteMany({ chat: chatId });

    res.status(200).json({
      message: "Chat deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("deleteChat error:", error);
    res.status(500).json({
      message: "Failed to delete chat",
      success: false,
      err: error.message,
    });
  }
}
