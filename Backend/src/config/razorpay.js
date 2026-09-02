import Razorpay from "razorpay";

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_TW7UyGIgNFDquf";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "LHPyC5iAwIwxf0FvWGsxEufn";

export const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});
