/**
 * Maps backend English `error.message` / `lockReason` / blocker copy to Vietnamese
 * for user-facing UI. Exact match first, then regex patterns. Vietnamese input
 * is returned as-is. Unmapped English falls through as `null` so callers can
 * use curated Vietnamese fallbacks.
 */

const EXACT_VI: Record<string, string> = {
  "This activity is locked until prerequisites are met.":
    "Hoạt động này chưa mở khóa. Hoàn thành các bài trước để tiếp tục.",
  "This module is locked until prerequisites are met.":
    "Module này chưa mở khóa. Hoàn thành module tiên quyết trước.",
  "This assignment is locked until prerequisites are met.":
    "Bài tập này chưa mở khóa. Hoàn thành các mục trước để tiếp tục.",
  "This course is locked until prerequisites are met.":
    "Khóa học này chưa mở khóa. Hoàn thành điều kiện tiên quyết trước.",
  "This milestone is locked until prerequisites are met.":
    "Mốc nghiên cứu chưa mở khóa. Hoàn thành điều kiện trước.",
  "Mentor has not opened submission yet.":
    "Mentor chưa mở cửa sổ nộp bài.",
  "You are not eligible to retake this module.":
    "Bạn chưa đủ điều kiện học lại module này.",
  "Module retake is only allowed after failing.":
    "Chỉ được học lại sau khi không đạt module.",
  "You must complete the prerequisite module first.":
    "Bạn phải hoàn thành module tiên quyết trước.",
  "You already have an active class enrollment for this program.":
    "Bạn đã có lớp đang học trong chương trình này.",
  "Class is at maximum capacity.": "Lớp đã đủ sĩ số.",
  "Class has reached maximum capacity.": "Lớp đã đủ sĩ số.",
  "This program has no open classes with available seats. Checkout is blocked until a recruiting class has capacity.":
    "Chương trình chưa có lớp đang tuyển còn ghế. Thanh toán tạm khóa cho đến khi có lớp tuyển sinh còn chỗ.",
  "Select this class before checkout or your seat hold has expired.":
    "Chưa giữ ghế hoặc ghế đã hết hạn. Chọn lại lớp trước khi thanh toán.",
  "The class seat hold has expired. Select the class again before checkout.":
    "Ghế đã hết hạn. Chọn lại lớp trước khi thanh toán.",
  "Student has reached the maximum of 2 in-progress programs (Active or PendingPayment). Complete or drop a program before starting another.":
    "Bạn đang học tối đa 2 chương trình (đang học hoặc chờ thanh toán). Hoàn thành hoặc hủy một chương trình trước khi đăng ký thêm.",
  "Student has reached the maximum of 2 active classes. Leave or complete a class before joining another.":
    "Bạn đang tham gia tối đa 2 lớp Active. Rời hoặc hoàn thành một lớp trước khi ghi danh lớp khác.",
  "Student is not enrolled in this class.":
    "Học viên chưa ghi danh vào lớp này.",
  "Enrollment not found.": "Không tìm thấy ghi danh.",
  "Activity not found.": "Không tìm thấy hoạt động.",
  "Assignment not found.": "Không tìm thấy bài tập.",
  "Session not found.": "Không tìm thấy buổi học.",
  "Program not found.": "Không tìm thấy chương trình.",
  "Payment not found.": "Không tìm thấy giao dịch thanh toán.",
  "Invalid check-in token.": "Token check-in không hợp lệ.",
  "Invalid check-in code.": "Mã check-in không hợp lệ.",
  "Check-in token has expired.": "Mã check-in đã hết hạn.",
  "Check-in is not available for this session.":
    "Buổi học này không hỗ trợ check-in.",
  "You have already checked in.": "Bạn đã check-in rồi.",
  Unauthorized: "Bạn chưa đăng nhập hoặc phiên đã hết hạn.",
  Forbidden: "Bạn không có quyền thực hiện thao tác này.",
  "Access denied.": "Bạn không có quyền thực hiện thao tác này.",
  "Access denied": "Bạn không có quyền thực hiện thao tác này.",
  "Not found.": "Không tìm thấy dữ liệu yêu cầu.",
  "Not Found": "Không tìm thấy dữ liệu yêu cầu.",
  "Bad Request": "Thông tin gửi lên chưa hợp lệ.",
  "Invalid request.": "Thông tin gửi lên chưa hợp lệ.",
  Conflict: "Dữ liệu bị trùng với mục đã có.",
  "Token expired.": "Liên kết hoặc token đã hết hạn.",
  "Invalid or expired token.": "Liên kết hoặc token không hợp lệ hoặc đã hết hạn.",
  "Invalid or expired token": "Liên kết hoặc token không hợp lệ hoặc đã hết hạn.",
  "OTP expired.": "Mã OTP đã hết hạn.",
  "Invalid OTP.": "Mã OTP không đúng.",
  "Email already exists.": "Email đã được sử dụng.",
  "Email already exists": "Email đã được sử dụng.",
  "Account is locked.": "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.",
  "Account is disabled.": "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.",
  "Payment failed.": "Thanh toán thất bại.",
  "Payment link expired.": "Liên kết thanh toán đã hết hạn.",
  "Assignment is not available yet.": "Bài tập chưa mở.",
  "Assignment is past due.": "Bài tập đã quá hạn nộp.",
  "Maximum attempts reached.": "Đã hết số lần làm bài.",
  "Quiz time has expired.": "Thời gian làm bài đã hết.",
  "Submission is locked.": "Chưa đủ điều kiện để nộp bài.",
  "Activity already completed.": "Hoạt động đã hoàn thành.",
  "Materials are only supported for self-paced activities.":
    "Tài liệu chỉ hỗ trợ hoạt động tự học.",
  "Unexpected error occurred.": "Hệ thống tạm thời gặp sự cố. Vui lòng thử lại.",
  "Unexpected error occurred": "Hệ thống tạm thời gặp sự cố. Vui lòng thử lại.",
  "Request failed.": "Yêu cầu không hoàn tất.",
  "Request failed": "Yêu cầu không hoàn tất.",
  "An error occurred.": "Đã xảy ra lỗi. Vui lòng thử lại.",
  "An error occurred": "Đã xảy ra lỗi. Vui lòng thử lại.",
  "Internal server error.": "Hệ thống tạm thời không phản hồi.",
  "Internal Server Error": "Hệ thống tạm thời không phản hồi.",
  "Program is not available for enrollment.":
    "Chương trình hiện không nhận đăng ký.",
  "Program is not active.": "Chương trình hiện không hoạt động.",
  "Only Active programs can be enrolled.":
    "Chỉ chương trình đang mở mới có thể đăng ký.",
  "Program cannot be updated or deleted while a class is in progress. Wait for in-progress classes to complete.":
    "Không cập nhật hoặc xóa chương trình khi còn lớp đang học. Chờ các lớp InProgress hoàn thành.",
  "Program cannot be updated or deleted while an open class has enrolled students.":
    "Không cập nhật hoặc xóa chương trình khi lớp đang tuyển sinh đã có học viên ghi danh.",
  "Program curriculum cannot be changed while a class is in progress. Wait for in-progress classes to complete — curriculum changes apply to new cohorts.":
    "Không sửa khung chương trình khi còn lớp đang học. Chờ lớp InProgress hoàn thành — thay đổi áp dụng cho cohort mới.",
  "Program curriculum cannot be changed while an open class has enrolled students.":
    "Không sửa khung chương trình khi lớp đang tuyển sinh đã có học viên ghi danh.",
  "Video ready": "Video đã sẵn sàng",

  "Your video has finished processing and is ready.":
    "Video của bạn đã xử lý xong và sẵn sàng xem.",
  "Video processing failed": "Xử lý video thất bại",
  "Video processing failed. Please try uploading again.":
    "Xử lý video thất bại. Vui lòng tải lên lại.",
  "AI tagging failed": "Gắn thẻ AI thất bại",
  "Automatic tagging for your video failed.":
    "Gắn thẻ tự động cho video thất bại.",
  "Video tags ready": "Thẻ video đã sẵn sàng",
  "AI tags for your video are ready.":
    "Thẻ AI cho video của bạn đã sẵn sàng.",
  "Material updated": "Tài liệu đã cập nhật",
  "Course material was updated.": "Tài liệu khóa học vừa được cập nhật.",
  "Highlight video ready": "Video highlight đã sẵn sàng",
  "Your personal highlight video is ready.":
    "Video highlight cá nhân của bạn đã sẵn sàng.",
  "Highlight video queued": "Đang xếp hàng tạo highlight",
  "Your personal highlight video generation has been queued.":
    "Hệ thống đang xếp hàng tạo video highlight của bạn.",
};

const PATTERN_VI: Array<{ pattern: RegExp; vi: string }> = [
  {
    pattern: /locked until prerequisites? are met/i,
    vi: "Chưa mở khóa. Hoàn thành các điều kiện tiên quyết trước để tiếp tục.",
  },
  {
    pattern: /prerequisite(s)? (module |activity )?(not |is not )?(met|completed|satisfied)/i,
    vi: "Chưa hoàn thành điều kiện tiên quyết.",
  },
  {
    pattern: /mentor has not opened/i,
    vi: "Mentor chưa mở cửa sổ nộp bài.",
  },
  {
    pattern: /invalid (or )?expired token/i,
    vi: "Liên kết hoặc token không hợp lệ hoặc đã hết hạn.",
  },
  {
    pattern: /token (has )?expired/i,
    vi: "Token hoặc liên kết đã hết hạn.",
  },
  {
    pattern: /check[- ]?in.*(invalid|expired|not available)/i,
    vi: "Mã check-in không hợp lệ, đã hết hạn, hoặc buổi học không hỗ trợ check-in.",
  },
  {
    pattern: /already (checked in|exists|enrolled)/i,
    vi: "Dữ liệu đã tồn tại hoặc bạn đã thực hiện thao tác này.",
  },
  {
    pattern: /not found/i,
    vi: "Không tìm thấy dữ liệu yêu cầu.",
  },
  {
    pattern: /access denied|forbidden/i,
    vi: "Bạn không có quyền thực hiện thao tác này.",
  },
  {
    pattern: /unauthorized/i,
    vi: "Bạn chưa đăng nhập hoặc phiên đã hết hạn.",
  },
  {
    pattern: /maximum capacity|full capacity|no seats/i,
    vi: "Lớp đã đủ sĩ số.",
  },
  {
    pattern: /payment.*(expired|failed|cancelled|canceled)/i,
    vi: "Thanh toán thất bại, đã hủy, hoặc liên kết đã hết hạn.",
  },
  {
    pattern: /otp.*(invalid|expired)/i,
    vi: "Mã OTP không đúng hoặc đã hết hạn.",
  },
  {
    pattern: /email already/i,
    vi: "Email đã được sử dụng.",
  },
  {
    pattern: /Program cannot be updated or deleted while a class is in progress/i,
    vi: "Không cập nhật hoặc xóa chương trình khi còn lớp đang học. Chờ các lớp InProgress hoàn thành.",
  },
  {
    pattern: /Program cannot be updated or deleted while an open class has enrolled students/i,
    vi: "Không cập nhật hoặc xóa chương trình khi lớp đang tuyển sinh đã có học viên ghi danh.",
  },
  {
    pattern: /Program curriculum cannot be changed while a class is in progress/i,
    vi: "Không sửa khung chương trình khi còn lớp đang học. Chờ lớp InProgress hoàn thành — thay đổi áp dụng cho cohort mới.",
  },
  {
    pattern: /Program curriculum cannot be changed while an open class has enrolled students/i,
    vi: "Không sửa khung chương trình khi lớp đang tuyển sinh đã có học viên ghi danh.",
  },
  {
    pattern: /Class '.+' is not open for enrollment/i,
    vi: "Lớp không còn mở tuyển sinh. Chỉ lớp đang mở (Open) mới nhận ghi danh.",
  },
  {
    pattern: /Class '.+' must be Open and not yet started/i,
    vi: "Lớp phải đang mở tuyển sinh và chưa bắt đầu học.",
  },
  {
    pattern: /maximum of \d+ in-progress programs|Active or PendingPayment/i,
    vi: "Bạn đang học tối đa 2 chương trình (đang học hoặc chờ thanh toán). Hoàn thành hoặc hủy một chương trình trước khi đăng ký thêm.",
  },
  {
    pattern: /maximum of \d+ active classes/i,
    vi: "Bạn đang tham gia tối đa 2 lớp Active. Rời hoặc hoàn thành một lớp trước khi ghi danh lớp khác.",
  },
  {
    pattern: /StartDate must be at least \d+ days in the future/i,
    vi: "Ngày bắt đầu lớp phải cách hôm nay ít nhất 14 ngày.",
  },
  {
    pattern: /Program .+ is a draft and cannot be purchased/i,
    vi: "Chương trình đang ở bản nháp — chưa thể đăng ký hoặc thanh toán.",
  },
  {
    pattern: /Program .+ is inactive and is not accepting registrations/i,
    vi: "Chương trình đã ngừng hoạt động — không nhận đăng ký hoặc thanh toán.",
  },
  {
    pattern: /Program .+ is not (open|available) for enrollment|Program is not available for enrollment|Only Active programs can be enrolled/i,
    vi: "Chương trình hiện không nhận đăng ký.",
  },
  {
    pattern: /expected string, received null/i,
    vi: "Thiếu dữ liệu (null) ở trường bắt buộc phải là chuỗi.",
  },
  {
    pattern: /Máy chủ không trả (access|refresh) token/i,
    vi: "Máy chủ không trả token đăng nhập. Thử lại hoặc liên hệ hỗ trợ.",
  },
  {
    pattern: /past due|deadline.*(pass|expired)|overdue/i,
    vi: "Đã quá hạn nộp.",
  },
  {
    pattern: /maximum attempts|no attempts remaining/i,
    vi: "Đã hết số lần làm bài.",
  },
  {
    pattern: /quiz.*(time|timer).*(expired|ended)/i,
    vi: "Thời gian làm bài đã hết.",
  },
];

/** Likely Latin/English user copy (not Vietnamese). */
export function looksLikeEnglishMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  // Vietnamese diacritics → treat as already localized.
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    trimmed,
  )) {
    return false;
  }
  // Common English structure: starts with capital Latin word.
  if (/^[A-Z][a-z]+(\s|$)/.test(trimmed)) return true;
  if (
    /\b(the|this|that|you|your|must|cannot|invalid|locked|failed|expired|required|unauthorized|forbidden)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Translate a backend/user message to Vietnamese when possible.
 * - Already Vietnamese → returned unchanged
 * - Known English → Vietnamese
 * - Unknown English → `null` (caller should use curated fallback)
 * - Empty → `null`
 */
export function translateApiMessage(
  message: string | null | undefined,
): string | null {
  if (!message) return null;
  const trimmed = message.trim();
  if (!trimmed) return null;

  const exact = EXACT_VI[trimmed] ?? EXACT_VI[trimmed.replace(/\.$/, "") + "."];
  if (exact) return exact;

  // Case-insensitive exact lookup
  const lower = trimmed.toLowerCase();
  for (const [en, vi] of Object.entries(EXACT_VI)) {
    if (en.toLowerCase() === lower) return vi;
  }

  for (const { pattern, vi } of PATTERN_VI) {
    if (pattern.test(trimmed)) return vi;
  }

  if (!looksLikeEnglishMessage(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Prefer translated Vietnamese; if unmapped English, return curated fallback.
 */
export function localizeUserFacingMessage(
  message: string | null | undefined,
  fallback: string,
): string {
  const translated = translateApiMessage(message);
  if (translated) return translated;
  if (message?.trim() && !looksLikeEnglishMessage(message)) {
    return message.trim();
  }
  return fallback;
}
