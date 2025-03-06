import { Router } from "express";

import { changeLanguage } from "../../../controllers/user/profileController";

const router = Router();

router.post("/change-language", changeLanguage);

export default router;
