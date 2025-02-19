import { Router } from "express";

import {
  confirmPassword,
  login,
  logout,
  register,
  verifyOtp,
} from "../../controllers/authController";

const router = Router();

// Phone -> OTP -> Verify OTP -> Password -> Confirm Password
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/confirm-password", confirmPassword);

router.post("/login", login);
router.post("/logout", logout);

export default router;
