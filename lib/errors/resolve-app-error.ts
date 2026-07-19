import { ZodError } from "zod";

import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";

import type { AppErrorContext, AppErrorState } from "./types";

const CONTEXT_FALLBACKS: Record<AppErrorContext, AppErrorState> = {
  generic: {
    title: "Đã xảy ra lỗi",
    reason: "Yêu cầu không hoàn tất.",
    action: "Vui lòng thử lại sau vài giây.",
  },
  "auth.login": {
    title: "Đăng nhập không thành công",
    reason: "Email hoặc mật khẩu không đúng.",
    action: "Kiểm tra lại thông tin hoặc chọn Quên mật khẩu.",
  },
  "auth.register": {
    title: "Không thể tạo tài khoản",
    reason: "Thông tin đăng ký chưa hợp lệ hoặc email đã được sử dụng.",
    action: "Sửa các trường được đánh dấu hoặc đăng nhập nếu bạn đã có tài khoản.",
  },
  "auth.verify-otp": {
    title: "Xác thực không thành công",
    reason: "Mã OTP không đúng hoặc đã hết hạn.",
    action: "Kiểm tra email và nhập lại mã 6 chữ số.",
  },
  "auth.forgot-password": {
    title: "Không gửi được liên kết",
    reason: "Email chưa được đăng ký hoặc yêu cầu bị từ chối.",
    action: "Kiểm tra địa chỉ email hoặc đăng ký tài khoản mới.",
  },
  "auth.reset-password": {
    title: "Không đặt lại được mật khẩu",
    reason: "Liên kết không hợp lệ hoặc đã hết hạn.",
    action: "Yêu cầu liên kết mới tại trang Quên mật khẩu.",
  },
  "account.profile": {
    title: "Không tải được hồ sơ",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ từ chối yêu cầu.",
    action: "Đăng nhập lại hoặc thử tải trang sau vài giây.",
  },
  "account.update-profile": {
    title: "Không cập nhật được hồ sơ",
    reason: "Thông tin chưa hợp lệ hoặc yêu cầu bị từ chối.",
    action: "Kiểm tra họ tên và số điện thoại rồi thử lại.",
  },
  "account.upload-avatar": {
    title: "Không tải lên được ảnh đại diện",
    reason: "Tệp không hợp lệ, quá lớn, hoặc máy chủ từ chối tải lên.",
    action: "Chọn ảnh JPG/PNG dưới 5 MB và thử lại.",
  },
  "parent.request-link": {
    title: "Không gửi được yêu cầu liên kết",
    reason: "Email phụ huynh chưa hợp lệ hoặc yêu cầu bị từ chối.",
    action: "Kiểm tra email phụ huynh và thử lại.",
  },
  "parent.magic-login": {
    title: "Không xác nhận được liên kết",
    reason: "Liên kết không hợp lệ, đã hết hạn, hoặc tài khoản đã tồn tại.",
    action: "Mở lại liên kết từ email hoặc đăng nhập nếu bạn đã có tài khoản phụ huynh.",
  },
  "parent.complete-profile": {
    title: "Không hoàn tất được hồ sơ",
    reason: "Thông tin chưa hợp lệ hoặc yêu cầu bị từ chối.",
    action: "Kiểm tra họ tên, số điện thoại và mật khẩu rồi thử lại.",
  },
  "parent.approve-link": {
    title: "Không xác nhận được liên kết",
    reason: "Token không hợp lệ hoặc đã hết hạn.",
    action: "Mở lại liên kết từ email hoặc yêu cầu học viên gửi lại.",
  },
  "parent.links": {
    title: "Không tải được danh sách học viên",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ từ chối yêu cầu.",
    action: "Đăng nhập lại hoặc thử tải trang sau vài giây.",
  },
  "student.links": {
    title: "Không tải được thông tin phụ huynh",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ từ chối yêu cầu.",
    action: "Đăng nhập lại hoặc thử tải trang sau vài giây.",
  },
  "programs.list": {
    title: "Không tải được danh sách chương trình",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Kiểm tra mạng và thử tải lại trang sau vài giây.",
  },
  "programs.detail": {
    title: "Không tải được chương trình",
    reason: "Chương trình không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Quay lại danh sách chương trình hoặc thử lại sau vài giây.",
  },
  "programs.reviews": {
    title: "Không tải được đánh giá",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Thử tải lại hoặc chuyển sang tab khác rồi quay lại.",
  },
  "programs.expert": {
    title: "Không tải được thông tin chuyên gia",
    reason: "Chuyên gia không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Đóng hộp thoại và thử lại sau vài giây.",
  },
  "payments.checkout": {
    title: "Không thể bắt đầu thanh toán",
    reason: "Yêu cầu thanh toán bị từ chối hoặc chương trình chưa sẵn sàng.",
    action: "Thử lại sau vài giây hoặc liên hệ hỗ trợ OboxSTEAM.",
  },
  "payments.detail": {
    title: "Không tải được thông tin thanh toán",
    reason: "Giao dịch không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Kiểm tra lại liên kết hoặc vào Khóa học của tôi.",
  },
  "payments.cancel": {
    title: "Không hủy được thanh toán",
    reason: "Yêu cầu hủy bị từ chối hoặc giao dịch đã được xử lý.",
    action: "Quay lại chương trình và thử đăng ký lại nếu cần.",
  },
  "payments.request-parent": {
    title: "Không gửi được yêu cầu thanh toán",
    reason: "Phụ huynh chưa liên kết, chưa xác nhận, hoặc yêu cầu bị từ chối.",
    action: "Kiểm tra liên kết phụ huynh trong hồ sơ và thử lại.",
  },
  "payments.parent-checkout": {
    title: "Không thể bắt đầu thanh toán",
    reason: "Liên kết thanh toán không hợp lệ hoặc đã hết hạn (24 giờ).",
    action: "Nhờ học viên gửi lại yêu cầu thanh toán từ trang chương trình.",
  },
  "enrollments.list": {
    title: "Không tải được khóa học",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ từ chối yêu cầu.",
    action: "Đăng nhập lại hoặc thử tải trang sau vài giây.",
  },
  "research.upload": {
    title: "Không tải lên được tệp",
    reason: "Tệp không hợp lệ, quá lớn, hoặc máy chủ từ chối tải lên.",
    action: "Chọn tệp khác (tối đa 25 MB) và thử lại.",
  },
  "research.submit": {
    title: "Không nộp được bài",
    reason: "Yêu cầu nộp bị từ chối hoặc bài nộp chưa sẵn sàng.",
    action: "Kiểm tra tệp chính, điều kiện mốc và thử lại.",
  },
  "portfolio.load": {
    title: "Không tải được portfolio",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ từ chối yêu cầu.",
    action: "Đăng nhập lại hoặc thử tải trang sau vài giây.",
  },
  "portfolio.create": {
    title: "Không tạo được portfolio",
    reason: "Portfolio có thể đã tồn tại hoặc yêu cầu bị từ chối.",
    action: "Tải lại trang hoặc thử lại sau vài giây.",
  },
  "portfolio.update": {
    title: "Không lưu được portfolio",
    reason: "Thông tin chưa hợp lệ hoặc máy chủ từ chối yêu cầu.",
    action: "Kiểm tra các trường và thử lưu lại.",
  },
  "portfolio.subdomain": {
    title: "Không cập nhật được subdomain",
    reason: "Subdomain đã được dùng, không hợp lệ, hoặc yêu cầu bị từ chối.",
    action: "Chọn subdomain khác hoặc bỏ trống khi chưa công khai.",
  },
  "portfolio.publish": {
    title: "Không cập nhật được trạng thái công khai",
    reason: "Cần subdomain hợp lệ trước khi công khai, hoặc yêu cầu bị từ chối.",
    action: "Đặt subdomain rồi thử công khai lại.",
  },
  "portfolio.item": {
    title: "Không cập nhật được mục portfolio",
    reason: "Thông tin mục chưa hợp lệ hoặc máy chủ từ chối yêu cầu.",
    action: "Kiểm tra tiêu đề và nội dung rồi thử lại.",
  },
  "portfolio.reorder": {
    title: "Không sắp xếp được mục",
    reason: "Danh sách mục không hợp lệ hoặc máy chủ từ chối yêu cầu.",
    action: "Thử kéo thả lại hoặc tải lại trang.",
  },
  "portfolio.sync": {
    title: "Không đồng bộ được mục tự động",
    reason: "Máy chủ tạm thời không phản hồi hoặc yêu cầu bị từ chối.",
    action: "Thử đồng bộ lại sau vài giây.",
  },
  "portfolio.public": {
    title: "Không tải được trang công khai",
    reason: "Portfolio không tồn tại, chưa công khai, hoặc máy chủ tạm thời không phản hồi.",
    action: "Kiểm tra lại liên kết hoặc quay lại trang chủ.",
  },
  "portfolio.media": {
    title: "Không xử lý được ảnh portfolio",
    reason: "Tệp không hợp lệ, vượt dung lượng, hoặc máy chủ từ chối yêu cầu.",
    action: "Chọn ảnh khác (JPG/PNG/WebP) và thử lại.",
  },
  "portfolio.section": {
    title: "Không cập nhật được section",
    reason: "Thông tin section chưa hợp lệ hoặc máy chủ từ chối yêu cầu.",
    action: "Kiểm tra tiêu đề và nội dung rồi thử lại.",
  },
};

function extractApiMessage(error: ApiRequestError | ApiResponseError): string | null {
  if (error instanceof ApiResponseError) {
    return error.message || null;
  }

  const body = error.body as {
    error?: { message?: string };
    message?: string;
    value?: { message?: string };
  } | null;

  return body?.error?.message ?? body?.value?.message ?? body?.message ?? null;
}

function mapHttpStatusToError(
  status: number,
  context: AppErrorContext,
  apiMessage: string | null,
): AppErrorState | null {
  if (status === 401 && context === "auth.login") {
    return {
      title: "Đăng nhập không thành công",
      reason: apiMessage ?? "Email hoặc mật khẩu không đúng.",
      action: "Kiểm tra lại thông tin hoặc chọn Quên mật khẩu.",
    };
  }

  if (status === 409 && context === "auth.register") {
    return {
      title: "Email đã được sử dụng",
      reason: apiMessage ?? "Tài khoản với email này đã tồn tại.",
      action: "Đăng nhập hoặc dùng email khác để đăng ký.",
    };
  }

  if (status >= 500) {
    return {
      title: "Máy chủ đang gặp sự cố",
      reason: apiMessage ?? "Hệ thống tạm thời không phản hồi.",
      action: "Thử lại sau vài phút. Nếu vẫn lỗi, liên hệ hỗ trợ OboxSTEAM.",
    };
  }

  if (status === 0 || status >= 400) {
    const fallback = CONTEXT_FALLBACKS[context];
    return {
      title: fallback.title,
      reason: apiMessage ?? fallback.reason,
      action: fallback.action,
    };
  }

  return null;
}

function fromZodError(error: ZodError): AppErrorState {
  const first = error.issues[0];
  return {
    title: "Dữ liệu chưa hợp lệ",
    reason: first?.message ?? "Một số trường chưa đúng định dạng.",
    action: "Sửa các trường được đánh dấu và gửi lại.",
  };
}

function fromNetworkError(context: AppErrorContext): AppErrorState {
  const fallback = CONTEXT_FALLBACKS[context];
  return {
    title: "Không thể kết nối máy chủ",
    reason: "Thiết bị của bạn không kết nối được với OboxSTEAM.",
    action: "Kiểm tra mạng internet và thử lại.",
  };
}

/**
 * Normalize any thrown value into a three-part error for UI toasts.
 */
export function resolveAppError(
  error: unknown,
  context: AppErrorContext = "generic",
): AppErrorState {
  if (error instanceof ApiResponseError) {
    const mapped = mapHttpStatusToError(400, context, error.message);
    if (mapped) return mapped;
    return {
      title: CONTEXT_FALLBACKS[context].title,
      reason: error.message,
      action: CONTEXT_FALLBACKS[context].action,
    };
  }

  if (error instanceof ApiRequestError) {
    const apiMessage = extractApiMessage(error);
    const mapped = mapHttpStatusToError(error.status, context, apiMessage);
    if (mapped) return mapped;

    if (error.status === 0 || error.status >= 502) {
      return fromNetworkError(context);
    }
  }

  if (error instanceof ZodError) {
    return fromZodError(error);
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return fromNetworkError(context);
  }

  if (error instanceof Error && error.message) {
    const fallback = CONTEXT_FALLBACKS[context];
    return {
      title: fallback.title,
      reason: error.message,
      action: fallback.action,
    };
  }

  return CONTEXT_FALLBACKS[context];
}
