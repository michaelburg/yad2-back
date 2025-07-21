import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import User from "../models/User";
import { JWTPayload, AuthenticatedSocket } from "../types";

const socketAuth = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
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
    ) as JWTPayload;

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(
        new Error("Authentication error: User not found or inactive")
      );
    }

    (socket as AuthenticatedSocket).user = user;
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token"));
    }

    if (error.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }

    return next(new Error("Authentication error: " + error.message));
  }
};

export default socketAuth;
