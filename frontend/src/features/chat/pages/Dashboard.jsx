import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useSelector } from "react-redux";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../../auth/hooks/useAuth";
import remarkGfm from "remark-gfm";
import { deleteChat } from "../service/chat.api";

const Dashboard = () => {
  const {
    initializeSocketConnection,
    handleGetChats,
    handleSendMessage,
    handleOpenChat,
  } = useChat();

  const { handleLogout } = useAuth();

  const [chatInput, setChatInput] = useState("");
  const bottomRef = useRef(null);

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    initializeSocketConnection();
    handleGetChats();
  }, [initializeSocketConnection, handleGetChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId]);

  const handleSubmitMessage = (e) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    handleSendMessage({ message: trimmed, chatId: currentChatId });
    setChatInput("");
  };

  const handleNewChat = () => {
    window.location.href = "/";
  };

  const handleDeleteChat = async (chatId) => {
    await deleteChat(chatId);
    window.location.reload();
  };

  return (
    <main className="h-screen w-full bg-black text-gray-200 flex">
      {/* SIDEBAR */}
      <aside className="w-[260px] h-full flex flex-col bg-[#050505] border-r border-white/5">
        {/* HEADER */}
        <div className="px-5 py-5 text-lg font-semibold tracking-tight">
          Perplexity
        </div>

        {/* NEW CHAT */}
        <div className="px-4">
          <button
            onClick={handleNewChat}
            className="w-full rounded-lg bg-[#111] hover:bg-[#1a1a1a] transition py-2 text-sm"
          >
            + New chat
          </button>
        </div>

        {/* CHAT LIST */}
        <div className="flex-1 mt-4 overflow-y-auto px-2 space-y-1">
          {Object.values(chats).map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition ${
                currentChatId === chat.id ? "bg-[#1a1a1a]" : "hover:bg-[#111]"
              }`}
            >
              <button
                onClick={() => handleOpenChat(chat.id, chats)}
                className="truncate text-left w-full"
              >
                {chat.title}
              </button>

              <button
                onClick={() => handleDeleteChat(chat.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* USER */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.username || "User"}</p>
              <p className="text-xs text-gray-500">online</p>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <section className="flex flex-col flex-1 h-full relative">
        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8 max-w-3xl w-full mx-auto">
          {!currentChatId && (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Start a new conversation
            </div>
          )}

          {(chats[currentChatId]?.messages || []).map((msg, index) => (
            <div key={index} className="flex gap-4">
              {/* AVATAR */}
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#111] text-xs uppercase">
                {msg.role === "user"
                  ? user?.username?.slice(0, 2) || "U"
                  : "AI"}
              </div>

              {/* MESSAGE */}
              <div className="flex-1 text-sm leading-relaxed text-gray-300">
                {msg.role === "user" ? (
                  <p>{msg.content}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0">{children}</p>
                      ),
                      code: ({ children }) => (
                        <code className="bg-[#111] px-1.5 py-0.5 rounded">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-[#0d0d0d] p-3 rounded-xl overflow-x-auto">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="absolute bottom-0 left-0 w-full border-t border-white/5 bg-black/80 backdrop-blur">
          <form
            onSubmit={handleSubmitMessage}
            className="max-w-3xl mx-auto px-4 py-4"
          >
            <div className="flex items-center gap-3 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
              />

              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-30"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
