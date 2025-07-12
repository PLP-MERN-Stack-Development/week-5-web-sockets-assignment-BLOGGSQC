const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("user_join", ({ username, room }) => {
    socket.data.username = username;
    socket.data.room = room;
    if (room) socket.join(room);

    socket.broadcast.emit("system_message", {
      message: `${username} has joined the chat.`,
    });

    updateUsers();
  });

  socket.on("send_message", ({ message, to, room, type }) => {
    const msg = {
      sender: socket.data.username,
      message,
      timestamp: new Date(),
      type,
    };

    if (room) {
      io.to(room).emit("receive_message", msg);
    } else if (to) {
      io.to(to).emit("receive_message", msg);
      socket.emit("receive_message", msg);
    } else {
      io.emit("receive_message", msg);
    }
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", {
      username: socket.data.username,
      isTyping,
    });
  });

  socket.on("message_read", ({ sender }) => {
    const reader = socket.data.username;
    const ack = { reader, timestamp: new Date() };
    if (sender) {
      io.to(sender).emit("message_read_ack", ack);
    } else {
      socket.broadcast.emit("message_read_ack", ack);
    }
  });

  socket.on("join_room", (room) => {
    socket.join(room);
    socket.data.room = room;
    socket.emit("system_message", {
      message: `You joined room ${room}`,
    });
  });

  socket.on("disconnect", () => {
    const username = socket.data.username;
    console.log(`❌ ${username} disconnected`);
    socket.broadcast.emit("system_message", {
      message: `${username} left the chat.`,
    });
    updateUsers();
  });

  function updateUsers() {
    const users = [];
    for (let [id, s] of io.of("/").sockets) {
      users.push({ id, username: s.data.username, room: s.data.room });
    }
    io.emit("update_users", users);
  }
});

app.get("/", (req, res) => {
  res.send("🔵 Socket.IO Chat Server is running.");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
