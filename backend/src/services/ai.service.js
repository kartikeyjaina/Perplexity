import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage,tool,createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

const searchInternetTool = tool(
  searchInternet,
  {
    name: "search_internet",
    description: "Use this tool to search the internet for letestt information.",
    inputSchema: z.object({
      query:z.string().describe("The search query to look up on the internet")
    }),
  }
)

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
  return response.content;
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
  return response.text;
}
