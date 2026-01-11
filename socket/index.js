const { Server } = require("socket.io");
const { verifyToken } = require("../config/jwt");

const userSocketMap = new Map();
const socketUserMap = new Map();

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "capacitor://localhost", "ionic://localhost", "*"],
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    allowUpgrades: true
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return next(new Error("AUTHENTICATION_ERROR"));
    }
    
    const result = verifyToken(token);
    
    if (!result.success) {
      return next(new Error(result.error));
    }
    
    socket.user = result.decoded;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.walletAddress || socket.user.studentId}`);
    
    const userId = socket.user.studentId || socket.user.walletAddress;
    userSocketMap.set(userId, socket.id);
    socketUserMap.set(socket.id, userId);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);
      
      socket.to(roomId).emit("user-joined", {
        userId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room: ${roomId}`);
      
      socket.to(roomId).emit("user-left", {
        userId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("chat-message", (data) => {
      const { roomId, message } = data;
      
      io.to(roomId).emit("new-message", {
        userId,
        message,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("typing", (data) => {
      const { roomId, isTyping } = data;
      
      socket.to(roomId).emit("user-typing", {
        userId,
        isTyping,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("ping-server", () => {
      socket.emit("pong-server", {
        timestamp: new Date().toISOString()
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${userId}, reason: ${reason}`);
      
      userSocketMap.delete(userId);
      socketUserMap.delete(socket.id);
      
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("user-disconnected", {
            userId,
            reason,
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    socket.on("error", (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  return io;
}

function getSocketByUserId(userId) {
  return userSocketMap.get(userId);
}

function getUserBySocketId(socketId) {
  return socketUserMap.get(socketId);
}

function getOnlineUsers() {
  return Array.from(userSocketMap.keys());
}

module.exports = {
  initializeSocket,
  getSocketByUserId,
  getUserBySocketId,
  getOnlineUsers
};
