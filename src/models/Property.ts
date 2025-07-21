import mongoose, { Schema } from "mongoose";
import { IProperty, IPropertyHistory } from "../types";

const propertyHistorySchema = new Schema<IPropertyHistory>(
  {
    columnIndex: {
      type: Number,
      required: [true, "columnIndex is required"],
      min: [0, "columnIndex cannot be negative"],
      max: [4, "columnIndex cannot be greater than 4"],
    },
    position: {
      type: Number,
      required: [true, "position is required"],
      min: [0, "position cannot be negative"],
    },
    status: {
      type: String,
      required: [true, "status is required"],
      enum: ["liked", "disliked", "deleted"],
    },
    comment: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const propertySchema = new Schema<IProperty>(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
    },
    propertyId: {
      type: String,
      required: [true, "propertyId is required"],
    },
    history: [propertyHistorySchema],
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Create compound index to ensure uniqueness of userId and propertyId combination
propertySchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export default mongoose.model<IProperty>("Property", propertySchema);
