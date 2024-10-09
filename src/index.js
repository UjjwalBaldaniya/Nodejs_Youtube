import dotenv from "dotenv";
import connectDB from "./db/index.js";

// Load environment variables
dotenv.config({ path: "./env" }); // Ensure the correct path to your .env file

// Connect to MongoDB
connectDB();
