import { Router } from "express";

import {
  changeLanguage,
  uploadProfile,
} from "../../../controllers/user/profileController";
import auth from "../../../middlewares/auth";
import upload from "../../../middlewares/uploadFiles";

const router = Router();

router.post("/change-language", changeLanguage);
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch(
  "/profile/upload/multiple",
  auth,
  upload.array("avatar"),
  uploadProfile
);

export default router;
