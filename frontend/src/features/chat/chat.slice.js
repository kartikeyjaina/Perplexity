import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: {},
    currentChatId: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    createNewChat: (state, action) => {
      const { chatId, title } = action.payload;
      if (!chatId) return;
      state.chats[chatId] = {
        id: chatId,
        title,
        messages: [],
        lastUpdated: new Date().toISOString(),
      };
    },
    addNewMessage: (state, action) => {
      const { chatId, content, role } = action.payload;
      if (!chatId || !state.chats[chatId]) return;
      if (!Array.isArray(state.chats[chatId].messages)) {
        state.chats[chatId].messages = [];
      }

      const lastMessage =
        state.chats[chatId].messages[state.chats[chatId].messages.length - 1];
      if (
        lastMessage &&
        lastMessage.content === content &&
        lastMessage.role === role
      ) {
        return;
      }

      state.chats[chatId].messages.push({ content, role });
    },
    addMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      if (!chatId || !state.chats[chatId]) return;
      if (!Array.isArray(state.chats[chatId].messages)) {
        state.chats[chatId].messages = [];
      }
      if (!Array.isArray(messages) || messages.length === 0) return;

      const existing = new Set(
        state.chats[chatId].messages.map(
          (msg) => `${msg.role}::${msg.content}`,
        ),
      );
      const nextMessages = messages.filter(
        (msg) => !existing.has(`${msg.role}::${msg.content}`),
      );
      state.chats[chatId].messages.push(...nextMessages);
    },
    setChats: (state, action) => {
      state.chats = action.payload || {};
    },
    setCurrentChatId: (state, action) => {
      state.currentChatId = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setChats,
  setCurrentChatId,
  setLoading,
  setError,
  createNewChat,
  addNewMessage,
  addMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
