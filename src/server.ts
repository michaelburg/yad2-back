import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import socketAuth from "./middleware/socketAuth";
import propertySocketHandlers from "./socket/propertySocketHandlers";
import settingsRoutes from "./routes/settingsRoutes";
import userRoutes from "./routes/userRoutes";
import { AuthenticatedSocket } from "./types";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Routes
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);

// Basic health check route
app.get("/", (req, res) => {
  res.json({ message: "MongoDB User Backend API is running!" });
});

// Socket.IO middleware for authentication
io.use(socketAuth);

// Socket.IO connection handling
io.on("connection", (socket) => {
  const authenticatedSocket = socket as AuthenticatedSocket;
  console.log(`User connected: ${authenticatedSocket.user._id}`);

  // Register property socket handlers
  propertySocketHandlers(authenticatedSocket, io);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${authenticatedSocket.user._id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
