import express, { Response } from "express";
import Setting from "../models/Settings";
import {
  AuthenticatedRequest,
  ApiResponse,
  ISettingsRequest,
  ISettingsData,
} from "../types";
import auth from "../middleware/auth";

const router = express.Router();

const defaultSettings: ISettingsData = {
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

// POST create/update settings
router.post(
  "/",
  auth,
  async (
    req: AuthenticatedRequest & { body: ISettingsRequest },
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { settings } = req.body;
      const userId = req.user!._id.toString();

      const existingSetting = await Setting.findOne({ userId });
      if (existingSetting) {
        existingSetting.settings = settings;
        await existingSetting.save();
        res.status(200).json({
          success: true,
          message: "Settings updated successfully",
          data: existingSetting,
        });
        return;
      }

      const setting = new Setting({
        userId,
        settings,
      });

      await setting.save();

      res.status(201).json({
        success: true,
        message: "Settings created successfully",
        data: setting,
      });
    } catch (error: any) {
      console.error("Error in POST /settings:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

router.get(
  "/",
  auth,
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const userId = req.user!._id.toString();

      let setting = await Setting.findOne({ userId });
      if (!setting) {
        setting = new Setting({
          userId,
          settings: defaultSettings,
        });
        await setting.save();
      }

      res.status(200).json({
        success: true,
        message: "Settings fetched successfully",
        data: setting,
      });
    } catch (error: any) {
      console.error("Error in GET /settings:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

export default router;
