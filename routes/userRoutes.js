const express = require("express");
const User = require("../models/User");
const router = express.Router();

// POST create new user
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, age, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
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
      data: user,
      token: token,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

// POST login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: "Login successful",
      data: user,
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
});

module.exports = router;
