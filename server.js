const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const propertyRoutes = require("./routes/propertyRoutes");
const socketAuth = require("./middleware/socketAuth");
const propertySocketHandlers = require("./socket/propertySocketHandlers");
require("dotenv").config();
const settingsRoutes = require("./routes/settingsRoutes");
const userRoutes = require("./routes/userRoutes");

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
  });

// Routes
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/settings", settingsRoutes);

// Basic health check route
app.get("/", (req, res) => {
  res.json({ message: "MongoDB User Backend API is running!" });
});

// Socket.IO middleware for authentication
io.use(socketAuth);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user._id}`);

  // Register property socket handlers
  propertySocketHandlers(socket, io);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user._id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
