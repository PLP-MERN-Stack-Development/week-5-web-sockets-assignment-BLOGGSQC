import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Connect to backend server
const socket = io("http://localhost:5000", { autoConnect: false });

export function useSocket() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const usernameRef = useRef("");

  const connect = (username, room) => {
    usernameRef.current = username;
    socket.connect();
    socket.emit("user_join", { username, room });
  };

  const disconnect = () => {
    socket.disconnect();
    setIsConnected(false);
  };

  const sendMessage = (msg, to = null, room = null, type = null) => {
    socket.emit("send_message", { message: msg, to, room, type });
  };

  const setTyping = (isTyping) => {
    socket.emit("typing", isTyping);
  };

  const joinRoom = (room) => {
    socket.emit("join_room", room);
  };

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      playSound();
      showNotification(msg);
    });

    socket.on("system_message", (msg) => {
      setMessages((prev) => [...prev, { system: true, message: msg.message }]);
    });

    socket.on("update_users", (userList) => {
      setUsers(userList);
    });

    socket.on("typing", ({ username, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping
          ? [...new Set([...prev, username])]
          : prev.filter((u) => u !== username)
      );
    });

    requestNotificationPermission();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receive_message");
      socket.off("system_message");
      socket.off("update_users");
      socket.off("typing");
    };
  }, []);

  const playSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {}); // Prevent autoplay error
  };

  const showNotification = (msg) => {
    if (
      Notification.permission === "granted" &&
      !msg.system &&
      msg.sender !== usernameRef.current
    ) {
      new Notification(msg.sender, {
        body:
          msg.type?.startsWith("image/")
            ? "📷 Sent an image"
            : msg.type?.includes("pdf")
            ? "📄 Sent a PDF"
            : msg.message,
      });
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  return {
    connect,
    disconnect,
    sendMessage,
    messages,
    isConnected,
    users,
    typingUsers,
    setTyping,
    joinRoom,
  };
}
