import mongoose, { Schema } from "mongoose";
import { ISettings, IColumnSettings } from "../types";

const columnSettingsSchema = new Schema<IColumnSettings>(
  {
    color: {
      type: String,
      required: [true, "color is required"],
    },
    name: {
      type: String,
      required: [true, "name is required"],
    },
  },
  { _id: false } // Disable automatic _id for subdocuments
);

const settingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
    },
    settings: {
      likeColumns: [columnSettingsSchema],
      dislikeColumns: [columnSettingsSchema],
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Create compound index to ensure uniqueness of userId
settingsSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model<ISettings>("Setting", settingsSchema);
