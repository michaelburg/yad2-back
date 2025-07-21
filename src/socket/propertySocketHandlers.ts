import { Server } from "socket.io";
import Property from "../models/Property";
import {
  AuthenticatedSocket,
  IPropertyResponse,
  IPropertyCreateRequest,
  ApiResponse,
} from "../types";

interface SocketCallback {
  (response: ApiResponse): void;
}

const propertySocketHandlers = (
  socket: AuthenticatedSocket,
  io: Server
): void => {
  // Get all properties for the authenticated user
  socket.on("getProperties", async (callback: SocketCallback) => {
    try {
      if (!socket.user) {
        return callback({
          success: false,
          message: "User not authenticated",
        });
      }

      const properties = await Property.find({
        userId: socket.user._id.toString(),
      }).lean();

      const propertiesWithCurrentState: IPropertyResponse[] = properties.map(
        (property) => {
          const lastHistoryItem = property.history[property.history.length - 1];
          return {
            _id: property._id.toString(),
            userId: property.userId,
            propertyId: property.propertyId,
            columnIndex: lastHistoryItem.columnIndex,
            position: lastHistoryItem.position,
            status: lastHistoryItem.status,
            createdAt: lastHistoryItem.createdAt,
          };
        }
      );

      callback({
        success: true,
        message: "Properties fetched successfully",
        data: propertiesWithCurrentState,
      });
    } catch (error: any) {
      callback({
        success: false,
        message: "Error fetching properties",
        error: error.message,
      });
    }
  });

  // Create or update a property
  socket.on(
    "updateProperty",
    async (data: IPropertyCreateRequest, callback: SocketCallback) => {
      try {
        const { columnIndex, position, status, propertyId, comment } = data;

        if (!socket.user) {
          return callback({
            success: false,
            message: "User not authenticated",
          });
        }

        const existingProperty = await Property.findOne({
          userId: socket.user._id.toString(),
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
            userId: socket.user._id.toString(),
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
      } catch (error: any) {
        callback({
          success: false,
          message: "Error updating property",
          error: error.message,
        });
      }
    }
  );

  // Join a user-specific room for targeted events
  socket.join(`user_${socket.user._id}`);
  console.log(`User ${socket.user._id} joined room: user_${socket.user._id}`);
};

export default propertySocketHandlers;
