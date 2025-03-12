import { Router } from "express";

import { getAllUser } from "../../../controllers/admin/userController";
import { setMaintainance } from "../../../controllers/admin/settingController";

const router = Router();

router.get("/users", getAllUser);
router.post("/maintainance", setMaintainance);

export default router;
