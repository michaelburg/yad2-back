const Property = require("../models/property");

const propertySocketHandlers = (socket, io) => {
  // Get all properties for the authenticated user
  socket.on("getProperties", async (callback) => {
    if (!socket.user) throw new Error("User not authenticated", 401);
    const properties = await Property.find({ userId: socket.user._id }).lean();

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
          comment: lastHistoryItem.comment,
        })
      );
    });

    callback({
      success: true,
      data: propertiesWithCurrentState,
    });
  });

  // Create or update a property
  socket.on("updateProperty", async (data, callback) => {
    const { columnIndex, position, status, propertyId, comment } = data;
    if (!socket.user) throw new Error("User not authenticated", 401);

    const existingProperty = await Property.findOne({
      userId: socket.user._id,
      propertyId: propertyId,
    });

    if (existingProperty) {
      // Get the last history item to compare with new state
      const lastHistoryItem =
        existingProperty.history[existingProperty.history.length - 1];

      // Check if the new state is different from the last history entry
      const isStateChanged =
        lastHistoryItem.columnIndex !== columnIndex ||
        lastHistoryItem.position !== position ||
        lastHistoryItem.status !== status ||
        lastHistoryItem.comment !== comment;

      if (isStateChanged) {
        existingProperty.history.push({
          columnIndex,
          position,
          status,
          comment,
          createdAt: new Date(),
        });

        await existingProperty.save();

        socket.emit("propertyUpdated", {
          success: true,
          message: "Property updated successfully",
        });

        callback({
          success: true,
          message: "Property updated successfully",
        });
      } else {
        // State hasn't changed, don't add to history
        callback({
          success: true,
          message: "Property state unchanged, no update needed",
        });
      }
    } else {
      const property = new Property({
        userId: socket.user._id,
        propertyId,
        history: [
          {
            columnIndex,
            position,
            status,
            comment,
            createdAt: new Date(),
          },
        ],
      });

      await property.save();

      socket.emit("propertyCreated", {
        success: true,
        message: "Property created successfully",
      });

      callback({
        success: true,
        message: "Property created successfully",
      });
    }
  });

  // Join a user-specific room for targeted events
  socket.join(`user_${socket.user._id}`);
  console.log(`User ${socket.user._id} joined room: user_${socket.user._id}`);
};

module.exports = propertySocketHandlers;
