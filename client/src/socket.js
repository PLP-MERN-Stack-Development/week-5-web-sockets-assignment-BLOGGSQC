import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const socket = io("https://week-5-web-sockets-assignment-bloggsqc.onrender.com", {
  autoConnect: false,
});

export function useSocket() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [readReceipts, setReadReceipts] = useState([]);
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

  const hasBeenRead = (msg) => {
    return readReceipts.some(
      (r) =>
        r.reader !== usernameRef.current &&
        new Date(r.timestamp) >= new Date(msg.timestamp)
    );
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

    socket.on("message_read_ack", ({ reader, timestamp }) => {
      setReadReceipts((prev) => [...prev, { reader, timestamp }]);
    });

    requestNotificationPermission();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receive_message");
      socket.off("system_message");
      socket.off("update_users");
      socket.off("typing");
      socket.off("message_read_ack");
    };
  }, []);

  const playSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});
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
    hasBeenRead,
  };
}
