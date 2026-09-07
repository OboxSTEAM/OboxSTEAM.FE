export const PAYMENT_SUCCESS_ILLUSTRATION_URL =
  "https://cdni.iconscout.com/illustration/premium/thumb/payment-success-illustration-svg-download-png-3598820.png";

export const PAYMENT_CANCEL_ILLUSTRATION_URL =
  "https://img.freepik.com/premium-vector/fail-payment-hand-illustration-flat-style-declined-money-vector-illustration-isolated-background-rejected-pay-sign-business-concept_157943-4662.jpg";

export const PAYMENT_STATUS_LABELS = {
  Pending: "Đang chờ",
  Success: "Thành công",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
  Refunded: "Đã hoàn tiền",
} as const;

export const PAYMENT_GATEWAY_LABELS = {
  VnPay: "VNPay",
  Stripe: "Stripe",
  BankTransfer: "Chuyển khoản",
} as const;
