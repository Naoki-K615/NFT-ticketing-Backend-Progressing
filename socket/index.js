const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Mobile apps often have dynamic origins or no origin
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000, // Handle mobile backgrounding better
    pingInterval: 25000
  });

  // User to Socket mapping for reliability
  const userSockets = new Map();

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Map user ID to socket for targeted messaging
    userSockets.set(socket.user.id, socket.id);

    // Join personal room
    socket.join(socket.user.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.user.id} joined room: ${roomId}`);
    });

    socket.on("send_message", (data) => {
      // data: { roomId, message, timestamp }
      const { roomId, message } = data;
      io.to(roomId).emit("receive_message", {
        senderId: socket.user.id,
        message,
        timestamp: new Date()
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.user.id}, Reason: ${reason}`);
      userSockets.delete(socket.user.id);
    });

    // Handle mobile-specific errors
    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  });

  return io;
};

module.exports = initSocket;
