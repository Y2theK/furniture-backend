import { Router } from "express";

import { getAllUser } from "../../../controllers/admin/userController";
import { setMaintainance } from "../../../controllers/admin/settingController";
import upload from "../../../middlewares/uploadFiles";
import {
  createPost,
  deletePost,
  updatePost,
} from "../../../controllers/admin/postController";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../../../controllers/admin/productController";

const router = Router();

router.get("/users", getAllUser);
router.post("/maintainance", setMaintainance);

router.post("/posts", upload.single("image"), createPost);
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", deletePost);

router.post("/products", upload.array("image", 4), createProduct);
router.patch("/products", upload.array("image", 4), updateProduct);
router.delete("/products", deleteProduct);

export default router;
