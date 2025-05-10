import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { FaBars, FaPaperPlane, FaPlus, FaTimes, FaTrash } from "react-icons/fa";

const Chat = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [chatId, setChatId] = useState(() => localStorage.getItem("chatId"));
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [history, setHistory] = useState([]);
  const [pageNum, setPageNum] = useState(1);

  useEffect(() => {
    if (chatId) {
      fetchChatById(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    fetchHistory();
  }, [pageNum]);

  const fetchChatById = async (chatId) => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_ENDPOINT}/chat/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(data.messages);
      setChat(data.messages);
    } catch (err) {
      console.error("Error fetching selected chat:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = input;
    setChat((prev) => [...prev, { role: "user", content: newMessage }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_ENDPOINT}/chat`,
        {
          message: newMessage,
          chatId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(data);

      let assistantMsg;

      if (data.message) {
        assistantMsg = { role: "assistant", content: data.message };
      } else {
        assistantMsg = { role: "assistant", content: data.reply.content };
      }

      setChat((prev) => [...prev, assistantMsg]);

      if (!chatId && data.chatId) {
        setChatId(data.chatId);
        localStorage.setItem("chatId", data.chatId);
      }
    } catch (err) {
      console.error(err);
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_ENDPOINT}/chat/delete/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHistory((prev) => prev.filter((chatItem) => chatItem._id !== chatId));

      if (chatId === chatId) {
        setChat([]);
        setChatId(null);
        localStorage.removeItem("chatId");
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_ENDPOINT}/chat/history?page=${pageNum}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(pageNum);
      console.log(data.data);
      setHistory(data.data);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  const handleNewChat = () => {
    setChat([]);
    setChatId(null);
    localStorage.removeItem("chatId");
  };

  const handleSelectChat = (selectedChatId) => {
    setChatId(selectedChatId);
    localStorage.setItem("chatId", selectedChatId);
  };

  const toggleSidebar = async () => {
    if (!showSidebar) await fetchHistory();
    setShowSidebar((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex">
      {/* Sidebar Toggle Button - Only show when sidebar is closed */}
      {!showSidebar && (
        <div className="fixed top-20 left-4 z-50">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 hover:bg-gray-700/50 transition duration-200"
          >
            <FaBars className="text-xl" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-gray-800/50 backdrop-blur-lg border-r border-gray-700/50 transform transition-transform duration-300 ease-in-out pt-16 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Chat History</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewChat}
                className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 transition duration-200"
              >
                <FaPlus className="text-green-400" />
              </button>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition duration-200"
                aria-label="Close sidebar"
              >
                <FaTimes className="text-gray-400" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((chatItem, idx) => (
                <div className="flex justify-between bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition duration-200 rounded-lg ">
                  <div
                    key={idx}
                    onClick={() => handleSelectChat(chatItem._id)}
                    className="p-3 w-full"
                  >
                    <p className="text-sm truncate flex items-center">
                      {chatItem.title}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteChat(chatItem._id)}
                    className="flex items-center mr-1 justify-center rounded-full p-1 shadow-md"
                    aria-label="Delete chat"
                  >
                    <FaTrash className="text-red-400" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No chat history found
              </p>
            )}
          </div>
          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                if (pageNum > 1) {
                  setPageNum((prev) => prev - 1);
                  fetchHistory();
                }
              }}
              className={`p-2 rounded-lg ${
                pageNum === 1 ? "bg-gray-500" : "bg-gray-700 hover:bg-gray-600"
              } transition duration-200`}
              disabled={pageNum === 1}
            >
              Previous
            </button>
            <span className="self-center text-white">Page {pageNum}</span>
            <button
              onClick={() => {
                setPageNum((prev) => prev + 1);
                fetchHistory();
              }}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-screen pt-16">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 mt-4">
          <div className="max-w-[50%] mx-auto w-full">
            {chat.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-blue-600/20 border border-blue-500/20"
                      : "bg-gray-700/30 border border-gray-600/20"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <p {...props} className="text-sm text-gray-200" />
                        ),
                        h1: ({ node, ...props }) => (
                          <h1
                            {...props}
                            className="text-xl font-bold mt-4 mb-2 text-white"
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            {...props}
                            className="list-disc list-inside ml-4 text-sm text-gray-200"
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="text-sm text-gray-200" />
                        ),
                        code: ({ node, ...props }) => (
                          <code
                            {...props}
                            className="bg-gray-800/50 px-1.5 py-0.5 rounded text-sm font-mono"
                          />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700/30 border border-gray-600/20 rounded-2xl p-4">
                  <p className="text-sm text-gray-400">
                    Generating response...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-lg">
          <div className="max-w-[50%] mx-auto w-full flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-700/30 border border-gray-600/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition duration-200"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSend}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
