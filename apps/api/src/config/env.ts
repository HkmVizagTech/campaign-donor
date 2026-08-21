import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/garbha-gudi-campaign",
  JWT_SECRET: process.env.JWT_SECRET || "dev-jwt-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  GUPSHUP_ENABLED: process.env.GUPSHUP_ENABLED === "true",
  GUPSHUP_API_KEY: process.env.GUPSHUP_API_KEY || "",
  GUPSHUP_APP_ID: process.env.GUPSHUP_APP_ID || "",
  GUPSHUP_APP_NAME: process.env.GUPSHUP_APP_NAME || "",
  GUPSHUP_SOURCE_NUMBER: process.env.GUPSHUP_SOURCE_NUMBER || "",
  GUPSHUP_WEBHOOK_SECRET: process.env.GUPSHUP_WEBHOOK_SECRET || "",
  GUPSHUP_TEMPLATE_ID: process.env.GUPSHUP_TEMPLATE_ID || "garbagudi_nirman_message",
  GUPSHUP_TEMPLATE_NAME: process.env.GUPSHUP_TEMPLATE_NAME || "garbagudi_nirman_message",
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
};
