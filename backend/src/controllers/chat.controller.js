import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { generateResponse, generateChatTitle } from "../services/ai.service.js";

export async function sendMessage(req, res) {
  try {
    const { message, chatId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
        data: null,
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
          success: false,
          message: "Chat not found",
          data: null,
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

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        title,
        chat,
        aiMessage,
      },
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      err: error.message,
      data: null,
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
      success: true,
      message: "Chats retrieved successfully",
      data: {
        chats,
      },
    });
  } catch (error) {
    console.error("getChats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chats",
      err: error.message,
      data: null,
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
        .json({ success: false, message: "Chat not found", data: null });
    }
    const messages = await messageModel
      .find({ chat: chatId })
      .sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: {
        messages,
      },
    });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      err: error.message,
      data: null,
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
        .json({ success: false, message: "Chat not found", data: null });
    }

    await messageModel.deleteMany({ chat: chatId });

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
      data: {
        chatId,
      },
    });
  } catch (error) {
    console.error("deleteChat error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete chat",
      err: error.message,
      data: null,
    });
  }
}
