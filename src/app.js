import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// if frontend send data in json format, that time we can add limit,
// because if larger size json data will come then our website is crashed
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import subscriptionRouter from "./routes/subscription.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

// route declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);

export default app;
