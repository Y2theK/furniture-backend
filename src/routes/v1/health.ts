
import { Router } from "express"
import { check } from "../../middlewares/check";
import { healthCheck } from "../../controllers/healthController";

const router = Router();

router.get('/health', check, healthCheck);

export default router;