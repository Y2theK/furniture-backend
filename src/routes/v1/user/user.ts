import { Router } from "express";

import {
  changeLanguage,
  uploadProfile,
  uploadProfileMultiple,
  uploadProfileOptimize,
} from "../../../controllers/user/profileController";
import auth from "../../../middlewares/auth";
import upload, { uploadMemory } from "../../../middlewares/uploadFiles";
import {
  getInfinitePostsByPagination,
  getPost,
  getPostsByPagination,
} from "../../../controllers/user/postController";
import {
  getInfiniteProductsByPagination,
  getProduct,
  getProductsByPagination,
} from "../../../controllers/user/productController";

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
  upload.single("avatar"),
  uploadProfileOptimize
);

router.get("/posts", auth, getPostsByPagination);
router.get("/posts/infinite", auth, getInfinitePostsByPagination);
router.get("/posts/:id", auth, getPost);

router.get("/products", auth, getProductsByPagination);
router.get("/products/infinite", auth, getInfiniteProductsByPagination);
router.get("/products/:id", auth, getProduct);

export default router;
