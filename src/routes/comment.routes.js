import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply JWT verification middleware to all comment routes
router.use(verifyJWT);

// Comment Routes
router.route("/add").post(addComment);
router.route("/:videoId").get(getVideoComments);
router.route("/:commentId").delete(deleteComment).patch(updateComment);

export default router;
