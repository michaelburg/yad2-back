import mongoose, { Schema } from "mongoose";
import { IPropertyInteraction, IPropertyInteractionHistory } from "../types";

const propertyInteractionHistorySchema =
  new Schema<IPropertyInteractionHistory>(
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

const propertyInteractionSchema = new Schema<IPropertyInteraction>(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
    },
    propertyId: {
      type: String,
      required: [true, "propertyId is required"],
    },
    history: [propertyInteractionHistorySchema],
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Create compound index to ensure uniqueness of userId and propertyId combination
propertyInteractionSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export default mongoose.model<IPropertyInteraction>(
  "PropertyInteraction",
  propertyInteractionSchema
);
