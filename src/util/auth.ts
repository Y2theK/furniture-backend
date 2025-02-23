export const checkUserExists = (user: any) => {
  if (user) {
    const error: any = new Error("User already exists.");
    error.status = 409;
    error.code = "ALREADY_EXISTS";
    throw error;
  }
};

export const checkOtpErrorIfSameDate = (
  isSameDate: boolean,
  errorCount: number
) => {
  if (isSameDate && errorCount === 1) {
    const error: any = new Error(
      "OTP is wrong from 5 times. Please try tomorrow"
    );
    error.status = 401;
    error.code = "Error_OverLimit";
    throw error;
  }
};

export const checkOtpRow = (otp: any) => {
  if (!otp) {
    const error: any = new Error("User already exists.");
    error.status = 409;
    error.code = "ALREADY_EXISTS";
    throw error;
  }
};
