import { Router } from "express";

import { getAllUser } from "../../../controllers/admin/userController";

const router = Router();

router.get("/users", getAllUser);

export default router;
