import { Router } from "express";

import { getAllUser } from "../../../controllers/admin/userController";
import { setMaintainance } from "../../../controllers/admin/settingController";
import upload from "../../../middlewares/uploadFiles";
import {
  createPost,
  deletePost,
  updatePost,
} from "../../../controllers/admin/postController";

const router = Router();

router.get("/users", getAllUser);
router.post("/maintainance", setMaintainance);

router.post("/posts", upload.single("image"), createPost);
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", deletePost);

export default router;
