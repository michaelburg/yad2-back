import express, { Request, Response } from "express";
import User from "../models/User";
import { IUserInput, IUserLogin, ApiResponse } from "../types";

const router = express.Router();

// POST create new user
router.post(
  "/signup",
  async (
    req: Request<{}, ApiResponse, IUserInput>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { name, email, password, age, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
        return;
      }

      const user = new User({
        name,
        email,
        password,
        age,
        phone,
      });

      await user.save();

      // Generate JWT token
      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Error creating user",
        error: error.message,
      });
    }
  }
);

// POST login user
router.post(
  "/login",
  async (
    req: Request<{}, ApiResponse, IUserLogin>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Generate JWT token
      const token = user.generateAuthToken();

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error during login",
        error: error.message,
      });
    }
  }
);

export default router;
