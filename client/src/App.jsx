import { useState, useEffect } from "react";
import { useSocket } from "./socket";
import { socket } from "./socket";

function App() {
  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const {
    connect,
    disconnect,
    sendMessage,
    messages,
    isConnected,
    users,
    typingUsers,
    setTyping,
    hasBeenRead,
  } = useSocket();

  const handleJoin = () => {
    if (username.trim()) {
      connect(username);
      setHasJoined(true);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const message = e.target.message.value;
    if (message.trim()) {
      sendMessage(message);
      e.target.reset();
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      socket.emit("message_read", { sender: null });
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      {!hasJoined ? (
        <div>
          <h2>Enter your username:</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleJoin}>Join Chat</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {username}</h2>
          <p>Status: {isConnected ? "🟢 Online" : "🔴 Offline"}</p>

          <form onSubmit={handleSend}>
            <input
              type="text"
              name="message"
              placeholder="Type a message..."
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              autoComplete="off"
            />
            <button type="submit">Send</button>
          </form>

          <div style={{ marginTop: "1rem" }}>
            <h4>💬 Messages:</h4>
            <ul>
              {messages.map((msg, idx) => (
                <li key={idx}>
                  {msg.system ? (
                    <em>{msg.message}</em>
                  ) : (
                    <>
                      <strong>{msg.sender}</strong>: {msg.message} {" "}
                      <span style={{ fontSize: "0.8rem", color: "#888" }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.sender === username && hasBeenRead(msg) && (
                        <span style={{ marginLeft: 5, color: "blue" }}>✔️</span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {typingUsers.length > 0 && (
            <p>💡 {typingUsers.join(", ")} is typing...</p>
          )}

          <div style={{ marginTop: "1rem" }}>
            <h4>👥 Online Users:</h4>
            <ul>
              {users.map((user) => (
                <li key={user.id}>{user.username}</li>
              ))}
            </ul>
          </div>

          <button onClick={disconnect}>Leave Chat</button>
        </div>
      )}
    </div>
  );
}

export default App;