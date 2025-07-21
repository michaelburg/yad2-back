import { Server } from "socket.io";
import PropertyInteraction from "../models/PropertyInteraction";
import {
  AuthenticatedSocket,
  IPropertyInteractionResponse,
  IPropertyInteractionCreateRequest,
  ApiResponse,
} from "../types";

interface SocketCallback {
  (response: ApiResponse): void;
}

const propertyInteractionSocketHandlers = (
  socket: AuthenticatedSocket,
  io: Server
): void => {
  // Get all property interactions for the authenticated user
  socket.on("getPropertyInteractions", async (callback: SocketCallback) => {
    try {
      if (!socket.user) {
        return callback({
          success: false,
          message: "User not authenticated",
        });
      }

      const propertyInteractions = await PropertyInteraction.find({
        userId: socket.user._id.toString(),
      }).lean();

      const propertyInteractionsWithCurrentState: IPropertyInteractionResponse[] =
        propertyInteractions.map((propertyInteraction) => {
          const lastHistoryItem =
            propertyInteraction.history[propertyInteraction.history.length - 1];
          return {
            _id: propertyInteraction._id.toString(),
            userId: propertyInteraction.userId,
            propertyId: propertyInteraction.propertyId,
            columnIndex: lastHistoryItem.columnIndex,
            position: lastHistoryItem.position,
            status: lastHistoryItem.status,
            createdAt: lastHistoryItem.createdAt,
          };
        });

      callback({
        success: true,
        message: "Property interactions fetched successfully",
        data: propertyInteractionsWithCurrentState,
      });
    } catch (error: any) {
      callback({
        success: false,
        message: "Error fetching property interactions",
        error: error.message,
      });
    }
  });

  // Create or update a property interaction
  socket.on(
    "updatePropertyInteraction",
    async (
      data: IPropertyInteractionCreateRequest,
      callback: SocketCallback
    ) => {
      try {
        const { columnIndex, position, status, propertyId, comment } = data;

        if (!socket.user) {
          return callback({
            success: false,
            message: "User not authenticated",
          });
        }

        const existingPropertyInteraction = await PropertyInteraction.findOne({
          userId: socket.user._id.toString(),
          propertyId: propertyId,
        });

        if (existingPropertyInteraction) {
          // Get the last history item to compare with new state
          const lastHistoryItem =
            existingPropertyInteraction.history[
              existingPropertyInteraction.history.length - 1
            ];

          // Check if the new state is different from the last history entry
          const isStateChanged =
            lastHistoryItem.columnIndex !== columnIndex ||
            lastHistoryItem.position !== position ||
            lastHistoryItem.status !== status ||
            lastHistoryItem.comment !== comment;

          if (isStateChanged) {
            existingPropertyInteraction.history.push({
              columnIndex,
              position,
              status,
              comment,
              createdAt: new Date(),
            });

            await existingPropertyInteraction.save();

            socket.emit("propertyInteractionUpdated", {
              success: true,
              message: "Property interaction updated successfully",
            });

            callback({
              success: true,
              message: "Property interaction updated successfully",
            });
          } else {
            // State hasn't changed, don't add to history
            callback({
              success: true,
              message: "Property interaction state unchanged, no update needed",
            });
          }
        } else {
          const propertyInteraction = new PropertyInteraction({
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

          await propertyInteraction.save();

          socket.emit("propertyInteractionCreated", {
            success: true,
            message: "Property interaction created successfully",
          });

          callback({
            success: true,
            message: "Property interaction created successfully",
          });
        }
      } catch (error: any) {
        callback({
          success: false,
          message: "Error updating property interaction",
          error: error.message,
        });
      }
    }
  );

  // Join a user-specific room for targeted events
  socket.join(`user_${socket.user._id}`);
  console.log(`User ${socket.user._id} joined room: user_${socket.user._id}`);
};

export default propertyInteractionSocketHandlers;
