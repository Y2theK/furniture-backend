import { Router } from "express";
import auth from "../../middlewares/auth";
import healthRoutes from "./health";
import AuthRoutes from "./auth";
import AdminRoutes from "./admin/admin";
import UserRoutes from "./user/user";
import { authorize } from "../../middlewares/authorize";

const router = Router();

// when you use /api/v1 prefix for 2 routes like in health and auth routes, the middleware will run twice
router.use("/api/v1", healthRoutes);
router.use("/api/v1", AuthRoutes);
router.use("/api/v1/user", UserRoutes);
router.use("/api/v1/admin", auth, authorize(true, "ADMIN"), AdminRoutes);

export default router;
