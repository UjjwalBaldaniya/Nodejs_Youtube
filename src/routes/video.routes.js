import {
  getAllVideos,
  getVideoById,
  publishVideo,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { multerUpload } from "../middlewares/multer.middleware.js";

import { Router } from "express";

const router = Router();

router.get("/", getAllVideos);
router.get("/:videoId", getVideoById);

router.post(
  "/",
  verifyJWT,
  multerUpload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.patch(
  "/:videoId",
  verifyJWT,
  multerUpload.single("thumbnail"),
  updateVideo
);

export default router;
