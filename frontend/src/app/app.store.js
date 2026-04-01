import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth.slice";
import chatReducer from "../features/chat/chat.slice";

//store configuration
export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
  },
});
