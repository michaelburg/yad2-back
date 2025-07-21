import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import User from "../models/User";
import { AuthenticatedRequest, JWTPayload, ApiResponse } from "../types";

const auth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      } as ApiResponse);
      return;
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      } as ApiResponse);
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as JWTPayload;

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Access denied. User not found or inactive.",
      } as ApiResponse);
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        message: "Access denied. Invalid token.",
      } as ApiResponse);
      return;
    }

    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Access denied. Token expired.",
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

export default auth;
