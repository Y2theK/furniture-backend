import { Router } from "express";
import auth from "../../middlewares/auth";
import healthRoutes from "./health";
import AuthRoutes from "./auth";
import AdminRoutes from "./admin/admin";
import UserRoutes from "./user/user";
import { authorize } from "../../middlewares/authorize";
import { maintainance } from "../../middlewares/maintainance";
const router = Router();

// when you use /api/v1 prefix for 2 routes like in health and auth routes, the middleware will run twice
router.use("/api/v1", maintainance, healthRoutes);
router.use("/api/v1", maintainance, AuthRoutes);
router.use("/api/v1/users", maintainance, UserRoutes);
router.use(
  "/api/v1/admins",
  maintainance,
  auth,
  authorize(true, "ADMIN"),
  AdminRoutes
);

export default router;
