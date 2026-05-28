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
