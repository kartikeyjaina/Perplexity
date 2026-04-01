import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage } from "langchain";

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

export async function generateResponse(messages) {
  const formattedMessages = messages.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content);
    } else if (msg.role === "ai") {
      return new AIMessage(msg.content);
    } else {
      return new SystemMessage(msg.content);
    }
  });

  const response = await geminiModel.invoke(formattedMessages);
  if (typeof response?.content === "string" && response.content.trim()) {
    return response.content;
  }
  if (Array.isArray(response?.content)) {
    const text = response.content
      .map((item) => (typeof item === "string" ? item : item?.text || ""))
      .join("\n")
      .trim();
    if (text) {
      return text;
    }
  }
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text;
  }
  return "I could not generate a response right now.";
}

export async function generateChatTitle(message) {
  const response = await mistralModel.invoke([
    new SystemMessage(
      `You are a helpful assistant that generates concise and descriptive titles for chat conversations.User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic.`,
    ),
    new HumanMessage(
      `Generate a title for a chat conversation based on the following first message: "${message}"`,
    ),
  ]);
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text;
  }
  if (typeof response?.content === "string" && response.content.trim()) {
    return response.content;
  }
  return "New Chat";
}
