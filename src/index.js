import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

// Load environment variables
dotenv.config({ path: "./env" });

// Connect to MongoDB
connectDB()
  .then(() => {
    const port = process.env.PORT || 9000;

    app.on("error", (error) => {
      console.log("on event error", error);
      throw error;
    });

    app.listen(port, () => {
      console.log(`server is running at port : ${port}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed", error);
  });
