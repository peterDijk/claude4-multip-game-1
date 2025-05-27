import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomManager } from "./managers/RoomManager";
import { SocketHandler } from "./handlers/SocketHandler";
import { createApiRouter } from "./routes/api";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "./types/socket.types";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with TypeScript types
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize managers and handlers
const roomManager = new RoomManager(io);
const socketHandler = new SocketHandler(roomManager);

// API routes
app.use("/api", createApiRouter(roomManager));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: Date.now(),
    rooms: roomManager.getRoomCount(),
    players: roomManager.getTotalPlayerCount(),
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  socketHandler.handleConnection(socket);
});

// Game loop for updating rooms
const GAME_UPDATE_INTERVAL = 100; // 100ms
const CLEANUP_INTERVAL = 60000; // 1 minute

setInterval(() => {
  roomManager.updateAllRooms();
}, GAME_UPDATE_INTERVAL);

setInterval(() => {
  roomManager.cleanupEmptyRooms();
}, CLEANUP_INTERVAL);

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

server.listen(PORT, () => {
  console.log(`🚀 Multiplayer game server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🎮 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export { io, roomManager };
