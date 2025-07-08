// File: client/src/App.jsx
import { useState } from "react";
import { useSocket } from "./socket";

const roomsList = ["General", "Tech", "Gaming", "Random"];

function App() {
  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("General");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const {
    connect,
    disconnect,
    sendMessage,
    messages,
    isConnected,
    users,
    typingUsers,
    setTyping,
    joinRoom,
  } = useSocket();

  const handleJoin = () => {
    if (username.trim()) {
      connect(username, selectedRoom);
      setHasJoined(true);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const message = e.target.message.value;
    const file = e.target.file.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        sendMessage(reader.result, selectedUserId, selectedRoom, file.type);
      };
      reader.readAsDataURL(file);
      e.target.reset();
      return;
    }

    if (message.trim()) {
      sendMessage(message, selectedUserId, selectedRoom);
      e.target.reset();
    }
  };

  const handleRoomChange = (newRoom) => {
    setSelectedRoom(newRoom);
    setSelectedUserId(null);
    joinRoom(newRoom);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      {!hasJoined ? (
        <div>
          <h2>Enter your username:</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <h4>Select a room:</h4>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            {roomsList.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
          <button onClick={handleJoin}>Join Chat</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {username}</h2>
          <p>Status: {isConnected ? "🟢 Online" : "🔴 Offline"}</p>
          <h4>Current Room: {selectedRoom}</h4>

          <form onSubmit={handleSend}>
            <input
              type="text"
              name="message"
              placeholder={
                selectedUserId ? "Private message..." : "Type a message..."
              }
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              autoComplete="off"
              style={{ width: "60%" }}
            />
            <input type="file" name="file" accept="image/*,.pdf" />
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
                      <strong>{msg.sender}</strong>: {" "}
                      {msg.type && msg.type.startsWith("image/") ? (
                        <img
                          src={msg.message}
                          alt="shared"
                          style={{ maxWidth: "150px" }}
                        />
                      ) : msg.type && msg.type.includes("pdf") ? (
                        <a href={msg.message} target="_blank" rel="noreferrer">
                          View PDF
                        </a>
                      ) : (
                        msg.message
                      )}
                      <span
                        style={{
                          marginLeft: "8px",
                          color: "#888",
                          fontSize: "0.8rem",
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
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
                <li key={user.id}>
                  <button
                    onClick={() =>
                      setSelectedUserId(
                        user.id === selectedUserId ? null : user.id
                      )
                    }
                    style={{
                      fontWeight:
                        user.id === selectedUserId ? "bold" : "normal",
                    }}
                  >
                    {user.username}
                    {user.id === selectedUserId ? " (private)" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <h4>🛏️ Switch Room:</h4>
            {roomsList.map((room) => (
              <button
                key={room}
                style={{
                  margin: "5px",
                  fontWeight: room === selectedRoom ? "bold" : "normal",
                }}
                onClick={() => handleRoomChange(room)}
              >
                {room}
              </button>
            ))}
          </div>

          <button
            style={{ marginTop: "2rem", backgroundColor: "#f33", color: "white" }}
            onClick={() => {
              disconnect();
              setUsername("");
              setHasJoined(false);
              setSelectedUserId(null);
            }}
          >
            Leave Chat
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
