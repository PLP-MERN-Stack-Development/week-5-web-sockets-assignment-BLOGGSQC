const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Create the Socket.io server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// In-memory store of connected users
let users = {}; // { socket.id: { username, room } }

io.on("connection", (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  // When a user joins
  socket.on("user_join", ({ username, room }) => {
    users[socket.id] = { username, room };
    socket.join(room);
    console.log(`👤 ${username} joined room: ${room}`);

    socket.broadcast.to(room).emit("system_message", {
      message: `${username} joined the room`,
    });

    io.to(room).emit("update_users", getUserList(room));
  });

  // When user sends a message
  socket.on("send_message", ({ message, to, room }) => {
    const sender = users[socket.id];
    if (!sender) return;

    const fullMessage = {
      sender: sender.username,
      message,
      timestamp: new Date(),
    };

    if (to) {
      // Send private message
      socket.to(to).emit("receive_message", fullMessage);
      socket.emit("receive_message", fullMessage); // echo back to sender
    } else if (room) {
      // Send to room
      io.to(room).emit("receive_message", fullMessage);
    } else {
      // Fallback: broadcast globally
      io.emit("receive_message", fullMessage);
    }
  });

  // Typing indicator
  socket.on("typing", (isTyping) => {
    const user = users[socket.id];
    if (!user) return;
    socket.broadcast.to(user.room).emit("typing", {
      username: user.username,
      isTyping,
    });
  });

  // When switching rooms
  socket.on("join_room", (newRoom) => {
    const user = users[socket.id];
    if (user) {
      const oldRoom = user.room;
      socket.leave(oldRoom);
      socket.join(newRoom);
      user.room = newRoom;

      socket.emit("system_message", {
        message: `Switched to room: ${newRoom}`,
      });

      io.to(oldRoom).emit("update_users", getUserList(oldRoom));
      io.to(newRoom).emit("update_users", getUserList(newRoom));
    }
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      console.log(`🔴 ${user.username} disconnected from ${user.room}`);
      socket.broadcast.to(user.room).emit("system_message", {
        message: `${user.username} left the room`,
      });
      delete users[socket.id];
      io.to(user.room).emit("update_users", getUserList(user.room));
    }
  });
});

// Helper: get users in a specific room
function getUserList(room) {
  return Object.entries(users)
    .filter(([_, user]) => user.room === room)
    .map(([id, { username }]) => ({ id, username }));
}

app.get("/", (req, res) => {
  res.send("🚀 Socket.io chat server is running!");
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
