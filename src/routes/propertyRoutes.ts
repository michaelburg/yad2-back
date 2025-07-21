import express, { Response } from "express";
import Property from "../models/Property";
import auth from "../middleware/auth";
import {
  AuthenticatedRequest,
  ApiResponse,
  IPropertyCreateRequest,
  IPropertyResponse,
} from "../types";

const router = express.Router();

router.get(
  "/",
  auth,
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse<IPropertyResponse[]>>
  ): Promise<void> => {
    try {
      const properties = await Property.find({
        userId: req.user!._id.toString(),
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

      res.json({
        success: true,
        message: "Properties fetched successfully",
        data: propertiesWithCurrentState,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching properties",
        error: error.message,
      });
    }
  }
);

router.post(
  "/",
  auth,
  async (
    req: AuthenticatedRequest & { body: IPropertyCreateRequest },
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { columnIndex, position, status, propertyId, comment } = req.body;
      const userId = req.user!._id.toString();

      const existingProperty = await Property.findById(
        `${userId}#${propertyId}`
      );

      if (existingProperty) {
        existingProperty.history.push({
          columnIndex,
          position,
          status,
          comment,
          createdAt: new Date(),
        });

        await existingProperty.save();

        res.status(200).json({
          success: true,
          message: "Property updated successfully",
          data: existingProperty,
        });
        return;
      } else {
        const property = new Property({
          _id: `${userId}#${propertyId}`,
          userId,
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

        res.status(201).json({
          success: true,
          message: "Property created successfully",
          data: property,
        });
        return;
      }
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Error creating/updating property",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/",
  auth,
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const result = await Property.deleteMany({
        userId: req.user!._id.toString(),
      });

      res.status(200).json({
        success: true,
        message: `${result.deletedCount} properties deleted successfully`,
        data: { deletedCount: result.deletedCount },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error deleting properties",
        error: error.message,
      });
    }
  }
);

export default router;
