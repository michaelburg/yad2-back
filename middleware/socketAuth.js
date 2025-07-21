const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Remove "Bearer " prefix if present
    const cleanToken = token.replace("Bearer ", "");

    const decoded = jwt.verify(
      cleanToken,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(
        new Error("Authentication error: User not found or inactive")
      );
    }

    socket.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token"));
    }

    if (error.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }

    return next(new Error("Authentication error: " + error.message));
  }
};

module.exports = socketAuth;
