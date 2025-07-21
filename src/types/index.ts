import { Document, Types } from "mongoose";
import { Request } from "express";
import { Socket } from "socket.io";

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  age: number;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

export interface IUserInput {
  name: string;
  email: string;
  password: string;
  age: number;
  phone: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

// Property Interaction History Types (formerly Property)
export interface IPropertyInteractionHistory {
  columnIndex: number;
  position: number;
  status: "liked" | "disliked" | "deleted";
  comment?: string;
  createdAt: Date;
}

export interface IPropertyInteraction extends Document {
  _id: Types.ObjectId;
  userId: string;
  propertyId: string;
  history: IPropertyInteractionHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyInteractionInput {
  userId: string;
  propertyId: string;
  history?: IPropertyInteractionHistory[];
}

// Property Interaction route request types
export interface IPropertyInteractionCreateRequest {
  columnIndex: number;
  position: number;
  status: "liked" | "disliked" | "deleted";
  propertyId: string;
  comment?: string;
}

export interface IPropertyInteractionResponse {
  _id: string;
  userId: string;
  propertyId: string;
  columnIndex: number;
  position: number;
  status: string;
  createdAt: Date;
}

// Settings Types
export interface IColumnSettings {
  color: string;
  name: string;
}

export interface ISettingsData {
  likeColumns: IColumnSettings[];
  dislikeColumns: IColumnSettings[];
}

export interface ISettings extends Document {
  _id: Types.ObjectId;
  userId: string;
  settings: ISettingsData;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingsInput {
  userId: string;
  settings: ISettingsData;
}

export interface ISettingsRequest {
  settings: ISettingsData;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Request with user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Socket with user
export interface AuthenticatedSocket extends Socket {
  user: IUser;
}

// JWT Payload
export interface JWTPayload {
  id: string;
  _id: string;
  email: string;
  iat: number;
  exp: number;
}
