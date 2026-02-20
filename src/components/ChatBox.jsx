
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getChats, addMessage } from "../features/chat/chatSlice";
import { selectUser } from "../features/auth/authSlice";

const ChatBox = ({ sessionId, socket }) => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat?.messages) || [];
  const authUser = useSelector(selectUser);

  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const currentUserName = authUser?.fullName || authUser?.email || "Anonymous";

  // ✅ Fetch old messages
  useEffect(() => {
    if (!sessionId) return;
    dispatch(getChats(sessionId));
  }, [sessionId, dispatch]);

  // ✅ Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      dispatch(addMessage(msg));
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, dispatch]);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    if (!sessionId) {
      console.log("No active session");
      return;
    }

    console.log("Sending message:", message);

    socket.emit("send-message", {
      sessionId,
      message,
    });

    setMessage("");
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
        <h3 className="text-lg font-bold text-white">💬 Live Chat</h3>
        <span className="text-xs text-gray-400">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto bg-gray-900 rounded-lg p-3 space-y-2 mb-3 border border-gray-700">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-16">
            No messages yet...
          </p>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.username === currentUserName;

            return (
              <div
                key={msg.id || index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow-md ${
                    isMe
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isMe ? "text-blue-200" : "text-purple-400"
                    }`}
                  >
                    {msg.username}
                  </p>
                  <p>{msg.message}</p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 px-4 rounded-lg text-white text-sm font-semibold transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
