const express = require("express");
const Setting = require("../models/settings");
const router = express.Router();
const auth = require("../middleware/auth");

// POST create new user
router.post("/", auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.id;

    const existingSetting = await Setting.findOne({ userId });
    if (existingSetting) {
      existingSetting.settings = settings;
      await existingSetting.save();
      return res.status(200).json({
        success: true,
        data: existingSetting,
      });
    }
    const setting = new Setting({
      userId,
      settings,
    });
    await setting.save();
    return res.status(201).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("Error in POST /settings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    let setting = await Setting.findOne({ userId });
    if (!setting) {
      setting = new Setting({
        userId,
        settings: defaultSettings,
      });
      await setting.save();
    }

    return res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("Error in GET /settings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
const defaultSettings = {
  likeColumns: [
    { color: "#3B82F6", name: "liked" },
    { color: "#10B981", name: "contacted" },
    { color: "#F59E0B", name: "visited" },
    { color: "#EF4444", name: "want" },
  ],
  dislikeColumns: [
    { color: "#3B82F6", name: "disliked" },
    { color: "#10B981", name: "contacted" },
    { color: "#F59E0B", name: "visited" },
    { color: "#EF4444", name: "want" },
  ],
};
module.exports = router;
