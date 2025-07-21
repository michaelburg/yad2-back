const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
    },
    settings: {
      likeColumns: [
        {
          color: {
            type: String,
            required: [true, "color is required"],
          },
          name: {
            type: String,
            required: [true, "name is required"],
          },
          _id: false, // Disable automatic _id for subdocuments
        },
      ],
      dislikeColumns: [
        {
          color: {
            type: String,
            required: [true, "color is required"],
          },
          name: {
            type: String,
            required: [true, "name is required"],
          },
          _id: false, // Disable automatic _id for subdocuments
        },
      ],
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Create compound index to ensure uniqueness of userId and propertyId combination
settingsSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("Setting", settingsSchema);
