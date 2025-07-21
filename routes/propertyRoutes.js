const express = require("express");
const Property = require("../models/property");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const properties = await Property.find({ userId: req.user._id }).lean();

    const propertiesWithCurrentState = properties.map((property) => {
      const lastHistoryItem = property.history[property.history.length - 1];
      return JSON.parse(
        JSON.stringify({
          _id: property._id,
          userId: property.userId,
          propertyId: property.propertyId,
          columnIndex: lastHistoryItem.columnIndex,
          position: lastHistoryItem.position,
          status: lastHistoryItem.status,
          createdAt: lastHistoryItem.createdAt,
        })
      );
    });

    res.json({
      success: true,
      data: propertiesWithCurrentState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching properties",
      error: error.message,
    });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { columnIndex, position, status, propertyId } = req.body;

    const existingProperty = await Property.findById(
      `${req.user._id}#${propertyId}`
    );

    if (existingProperty) {
      existingProperty.history.push({
        columnIndex,
        position,
        status,
        createdAt: new Date(),
      });

      await existingProperty.save();

      return res.status(200).json({
        success: true,
        message: "Property updated successfully",
        data: existingProperty,
      });
    } else {
      const property = new Property({
        _id: `${req.user._id}#${propertyId}`,
        userId: req.user._id,
        propertyId,
        history: [
          {
            columnIndex,
            position,
            status,
            createdAt: new Date(),
          },
        ],
      });

      await property.save();

      return res.status(201).json({
        success: true,
        message: "Property created successfully",
        data: property,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating/updating property",
      error: error.message,
    });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    const result = await Property.deleteMany({
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} properties deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting properties",
      error: error.message,
    });
  }
});

module.exports = router;
