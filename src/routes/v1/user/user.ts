import { Router } from "express";

import {
  changeLanguage,
  uploadProfile,
  uploadProfileMultiple,
  uploadProfileOptimize,
} from "../../../controllers/user/profileController";
import auth from "../../../middlewares/auth";
import upload, { uploadMemory } from "../../../middlewares/uploadFiles";

const router = Router();

router.post("/change-language", changeLanguage);
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch(
  "/profile/upload/multiple",
  auth,
  upload.array("avatar"),
  uploadProfileMultiple
);

router.patch(
  "/profile/upload/optimize",
  auth,
  uploadMemory.single("avatar"),
  uploadProfileOptimize
);

export default router;
