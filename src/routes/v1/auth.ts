import { Router } from "express";

import {
  confirmPassword,
  login,
  logout,
  register,
  verifyOtp,
  authCheck,
} from "../../controllers/authController";
import {
  requestOTP,
  verifyOtpForPassword,
  resetPassword,
} from "../../controllers/forgetPasswordController";
import auth from "../../middlewares/auth";

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

router.get("/auth-check", auth, authCheck);

export default router;
