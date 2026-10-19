const app = require("../../backend/app");
const connectDB = require("../../backend/config/db");

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      success: false,
      message: "Server database connection error",
      error: error.message,
    });
  }
}
