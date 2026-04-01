import { initializeSocketConnection } from "../service/chat.socket";
import { sendMessage, getChats, getMessages } from "../service/chat.api";
import {
  setChats,
  setCurrentChatId,
  setError,
  setLoading,
  createNewChat,
  addNewMessage,
  addMessages,
} from "../chat.slice";
import { useDispatch } from "react-redux";
import { useCallback } from "react";

export const useChat = () => {
  const dispatch = useDispatch();

  const handleSendMessage = useCallback(
    async ({ message, chatId }) => {
      try {
        dispatch(setLoading(true));

        const data = await sendMessage({ message, chatId });
        const { chat, aiMessage } = data;

        if (!chatId) {
          dispatch(
            createNewChat({
              chatId: chat._id,
              title: chat.title,
            }),
          );
        }

        dispatch(
          addNewMessage({
            chatId: chatId || chat._id,
            content: message,
            role: "user",
          }),
        );

        dispatch(
          addNewMessage({
            chatId: chatId || chat._id,
            content: aiMessage.content,
            role: aiMessage.role,
          }),
        );

        dispatch(setCurrentChatId(chat._id));
      } catch {
        dispatch(setError("Message failed"));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const handleGetChats = useCallback(async () => {
    dispatch(setLoading(true));
    const data = await getChats();
    const { chats } = data;
    dispatch(
      setChats(
        chats.reduce((acc, chat) => {
          acc[chat._id] = {
            id: chat._id,
            title: chat.title,
            messages: [],
            lastUpdated: chat.updatedAt,
          };
          return acc;
        }, {}),
      ),
    );
    dispatch(setLoading(false));
  }, [dispatch]);

  const handleOpenChat = useCallback(
    async (chatId, chats) => {
      console.log(chats[chatId]?.messages.length);

      if (chats[chatId]?.messages.length === 0) {
        const data = await getMessages(chatId);
        const { messages } = data;

        const formattedMessages = messages.map((msg) => ({
          content: msg.content,
          role: msg.role,
        }));

        dispatch(
          addMessages({
            chatId,
            messages: formattedMessages,
          }),
        );
      }
      dispatch(setCurrentChatId(chatId));
    },
    [dispatch],
  );

  return {
    initializeSocketConnection,
    handleSendMessage,
    handleGetChats,
    handleOpenChat,
  };
};
