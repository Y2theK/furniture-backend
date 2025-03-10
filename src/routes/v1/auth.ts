import { Router } from "express";

import {
  confirmPassword,
  login,
  logout,
  register,
  verifyOtp,
} from "../../controllers/authController";
import {
  requestOTP,
  verifyOtpForPassword,
  resetPassword,
} from "../../controllers/forgetPasswordController";

const router = Router();

// Phone -> OTP -> Verify OTP -> Password -> Confirm Password
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/confirm-password", confirmPassword);

router.post("/login", login);
router.post("/logout", logout);

router.post("/request-otp", requestOTP);
router.post("/verify-otp-password", verifyOtpForPassword);
router.post("/reset-password", resetPassword);

export default router;
