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
  "programs.create": {
    title: "Không tạo được chương trình",
    reason: "Thông tin chương trình chưa hợp lệ hoặc đã trùng mã/tên.",
    action: "Kiểm tra lại các trường bắt buộc rồi thử lưu lần nữa.",
  },
  "programs.update": {
    title: "Không cập nhật được chương trình",
    reason: "Thông tin chưa hợp lệ hoặc chương trình không còn tồn tại.",
    action: "Kiểm tra lại thông tin, tải lại trang rồi thử lưu.",
  },
  "programs.delete": {
    title: "Không xóa được chương trình",
    reason: "Chương trình có thể đang được sử dụng hoặc không còn tồn tại.",
    action: "Tải lại danh sách và thử lại. Nếu vẫn lỗi, liên hệ hỗ trợ.",
  },
  "programs.reviews": {
    title: "Không tải được đánh giá",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Thử tải lại hoặc chuyển sang tab khác rồi quay lại.",
  },
  "programs.reviews.delete": {
    title: "Không xóa được đánh giá",
    reason: "Đánh giá có thể đã bị xóa hoặc máy chủ từ chối yêu cầu.",
    action: "Tải lại danh sách đánh giá và thử lại.",
  },
  "programs.expert": {
    title: "Không tải được thông tin chuyên gia",
    reason: "Chuyên gia không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Đóng hộp thoại và thử lại sau vài giây.",
  },
  "experts.list": {
    title: "Không tải được danh sách chuyên gia",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Kiểm tra mạng và thử tải lại sau vài giây.",
  },
  "experts.create": {
    title: "Không tạo được chuyên gia",
    reason: "Thông tin chưa hợp lệ hoặc mã chuyên gia đã tồn tại.",
    action: "Kiểm tra mã, họ tên và các chương trình được gán rồi thử lại.",
  },
  "experts.update": {
    title: "Không cập nhật được chuyên gia",
    reason: "Thông tin chưa hợp lệ hoặc chuyên gia không còn tồn tại.",
    action: "Tải lại danh sách, kiểm tra thông tin rồi thử lưu lại.",
  },
  "experts.delete": {
    title: "Không xóa được chuyên gia",
    reason: "Chuyên gia có thể đang được sử dụng hoặc không còn tồn tại.",
    action: "Tải lại danh sách và thử lại. Nếu vẫn lỗi, liên hệ hỗ trợ.",
  },
  "classes.list": {
    title: "Không tải được danh sách lớp",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Kiểm tra mạng và thử tải lại sau vài giây.",
  },
  "classes.detail": {
    title: "Không tải được thông tin lớp",
    reason: "Lớp không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Quay lại danh sách lớp hoặc thử lại sau vài giây.",
  },
  "classes.create": {
    title: "Không tạo được lớp học",
    reason: "Thông tin lớp chưa hợp lệ hoặc mã lớp đã tồn tại.",
    action: "Kiểm tra mã, tên, chương trình và lịch học rồi thử lại.",
  },
  "classes.update": {
    title: "Không cập nhật được lớp học",
    reason: "Thông tin chưa hợp lệ hoặc lớp không còn tồn tại.",
    action: "Tải lại trang, kiểm tra thông tin rồi thử lưu lại.",
  },
  "classes.lifecycle": {
    title: "Không chuyển được trạng thái lớp",
    reason: "Lớp không ở trạng thái phù hợp hoặc yêu cầu bị từ chối.",
    action: "Tải lại thông tin lớp và thử lại thao tác.",
  },
  "classSessions.list": {
    title: "Không tải được lịch học",
    reason: "Máy chủ tạm thời không phản hồi hoặc lớp không tồn tại.",
    action: "Chọn lại lớp hoặc thử tải lại sau vài giây.",
  },
  "classSessions.create": {
    title: "Không tạo được buổi học",
    reason: "Thông tin buổi học chưa hợp lệ hoặc lịch bị trùng.",
    action: "Kiểm tra tiêu đề, module và khung giờ rồi thử lại.",
  },
  "classSessions.update": {
    title: "Không cập nhật được buổi học",
    reason: "Thông tin chưa hợp lệ hoặc buổi học không còn tồn tại.",
    action: "Tải lại lịch học, kiểm tra thông tin rồi thử lưu lại.",
  },
  "classSessions.delete": {
    title: "Không xóa được buổi học",
    reason: "Buổi học có thể đã bị xóa hoặc máy chủ từ chối yêu cầu.",
    action: "Tải lại lịch học và thử lại.",
  },
  "attendance.list": {
    title: "Không tải được danh sách điểm danh",
    reason: "Máy chủ tạm thời không phản hồi hoặc buổi học không tồn tại.",
    action: "Chọn lại buổi học hoặc thử tải lại sau vài giây.",
  },
  "attendance.update": {
    title: "Không cập nhật được điểm danh",
    reason: "Trạng thái không hợp lệ hoặc bạn không có quyền thao tác.",
    action: "Tải lại roster và thử cập nhật lại.",
  },
  "curriculum.module.save": {
    title: "Không lưu được module",
    reason: "Thông tin module chưa hợp lệ hoặc đã trùng mã.",
    action: "Kiểm tra tên, mã, thứ tự và học phí rồi thử lại.",
  },
  "curriculum.course.save": {
    title: "Không lưu được khóa học",
    reason: "Thông tin khóa học chưa hợp lệ hoặc đã trùng mã.",
    action: "Kiểm tra tên, mã và mô tả rồi thử lại.",
  },
  "curriculum.activity.save": {
    title: "Không lưu được hoạt động",
    reason: "Thông tin hoạt động chưa hợp lệ hoặc lịch học chưa đúng.",
    action: "Kiểm tra tên, loại, thứ tự và thời gian (nếu có) rồi thử lại.",
  },
  "curriculum.material.save": {
    title: "Không lưu được tài liệu",
    reason: "Tệp không hợp lệ, thiếu tiêu đề, hoặc máy chủ từ chối tải lên.",
    action: "Chọn đúng loại tệp, đặt tiêu đề rõ ràng rồi thử lại.",
  },
  "curriculum.material.delete": {
    title: "Không xóa được tài liệu",
    reason: "Tài liệu có thể không còn tồn tại hoặc máy chủ từ chối yêu cầu.",
    action: "Tải lại trang rồi thử xóa lại.",
  },
  "curriculum.assignment.save": {
    title: "Không lưu được bài tập",
    reason: "Thông tin bài tập chưa hợp lệ hoặc đã trùng mã.",
    action: "Kiểm tra tiêu đề, điểm, và cấu hình rồi thử lại.",
  },
  "curriculum.milestone.save": {
    title: "Không lưu được milestone",
    reason: "Thông tin milestone hoặc sản phẩm nộp chưa hợp lệ.",
    action: "Kiểm tra mã, tiêu đề, thứ tự và sản phẩm nộp rồi thử lại.",
  },
  "curriculum.milestone.link": {
    title: "Không cập nhật được liên kết hoạt động",
    reason: "Hoạt động có thể đã được liên kết hoặc yêu cầu bị từ chối.",
    action: "Tải lại và thử lại.",
  },
  "curriculum.questionBank.save": {
    title: "Không lưu được ngân hàng câu hỏi",
    reason: "Thông tin chưa hợp lệ hoặc máy chủ từ chối yêu cầu.",
    action: "Kiểm tra tên ngân hàng câu hỏi rồi thử lại.",
  },
  "curriculum.questionBank.delete": {
    title: "Không xóa được ngân hàng câu hỏi",
    reason: "Ngân hàng có thể đang được sử dụng hoặc không còn tồn tại.",
    action: "Tải lại và thử lại.",
  },
  "curriculum.questionBank.import": {
    title: "Không import được câu hỏi",
    reason: "Tệp CSV không hợp lệ hoặc máy chủ từ chối tải lên.",
    action: "Kiểm tra định dạng tệp CSV rồi thử lại.",
  },
  "curriculum.node.delete": {
    title: "Không xóa được mục này",
    reason: "Mục có thể đang chứa nội dung con hoặc không còn tồn tại.",
    action: "Xóa các mục con trước (nếu có), tải lại rồi thử lại.",
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

/** Contexts where a curated backend string may be shown (auth only). */
const API_MESSAGE_ALLOWED: ReadonlySet<AppErrorContext> = new Set([
  "auth.login",
  "auth.register",
  "auth.verify-otp",
  "auth.forgot-password",
  "auth.reset-password",
]);

/** Manager mutate flows — never surface raw BE messages. */
const MANAGER_MUTATE: ReadonlySet<AppErrorContext> = new Set([
  "programs.create",
  "programs.update",
  "programs.delete",
  "programs.reviews.delete",
  "experts.create",
  "experts.update",
  "experts.delete",
  "classes.create",
  "classes.update",
  "classes.lifecycle",
  "classSessions.create",
  "classSessions.update",
  "classSessions.delete",
  "attendance.update",
  "curriculum.module.save",
  "curriculum.course.save",
  "curriculum.activity.save",
  "curriculum.material.save",
  "curriculum.material.delete",
  "curriculum.assignment.save",
  "curriculum.milestone.save",
  "curriculum.milestone.link",
  "curriculum.questionBank.save",
  "curriculum.questionBank.delete",
  "curriculum.questionBank.import",
  "curriculum.node.delete",
]);

function reasonForHttpStatus(
  status: number,
  context: AppErrorContext,
): string | null {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.";
  }
  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }
  if (status === 404) {
    if (MANAGER_MUTATE.has(context)) {
      return "Mục này không còn tồn tại hoặc đã bị xóa.";
    }
    return "Không tìm thấy dữ liệu yêu cầu.";
  }
  if (status === 409) {
    if (context === "programs.create" || context === "programs.update") {
      return "Mã hoặc tên chương trình đã tồn tại.";
    }
    if (context === "classes.create" || context === "classes.update") {
      return "Mã lớp đã tồn tại hoặc xung đột dữ liệu lớp.";
    }
    if (context.startsWith("curriculum.")) {
      return "Mã hoặc tên đã tồn tại trong chương trình.";
    }
    return "Dữ liệu bị trùng với mục đã có.";
  }
  if (status === 413) {
    return "Tệp tải lên quá lớn so với giới hạn hệ thống.";
  }
  if (status === 400 || status === 422) {
    if (MANAGER_MUTATE.has(context)) {
      return CONTEXT_FALLBACKS[context].reason;
    }
    return "Thông tin gửi lên chưa hợp lệ.";
  }
  if (status >= 500) {
    return "Hệ thống tạm thời không phản hồi.";
  }
  return null;
}

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

  if (status === 409 && context === "curriculum.material.save") {
    return {
      title: "Hoạt động đã có tài liệu",
      reason: "Mỗi hoạt động chỉ đính kèm được một tài liệu.",
      action: "Tải lại trang để xem tài liệu hiện có, hoặc xóa nó trước khi tải tài liệu mới.",
    };
  }

  const fallback = CONTEXT_FALLBACKS[context];
  const statusReason = reasonForHttpStatus(status, context);
  const useApi = API_MESSAGE_ALLOWED.has(context) && !!apiMessage;

  if (status >= 500) {
    return {
      title: "Máy chủ đang gặp sự cố",
      reason: useApi ? apiMessage! : (statusReason ?? "Hệ thống tạm thời không phản hồi."),
      action: "Thử lại sau vài phút. Nếu vẫn lỗi, liên hệ hỗ trợ OboxSTEAM.",
    };
  }

  if (status === 0 || status >= 400) {
    return {
      title: fallback.title,
      reason: useApi
        ? apiMessage!
        : (statusReason ?? fallback.reason),
      action:
        status === 401
          ? "Đăng nhập lại rồi thử tiếp."
          : fallback.action,
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

function fromNetworkError(_context: AppErrorContext): AppErrorState {
  return {
    title: "Không thể kết nối máy chủ",
    reason: "Thiết bị của bạn không kết nối được với OboxSTEAM.",
    action: "Kiểm tra mạng internet và thử lại.",
  };
}

/**
 * Normalize any thrown value into a three-part error for UI toasts.
 * Raw backend messages are only used for curated auth contexts.
 */
export function resolveAppError(
  error: unknown,
  context: AppErrorContext = "generic",
): AppErrorState {
  if (error instanceof ApiResponseError) {
    const mapped = mapHttpStatusToError(
      400,
      context,
      API_MESSAGE_ALLOWED.has(context) ? error.message : null,
    );
    if (mapped) return mapped;
    return CONTEXT_FALLBACKS[context];
  }

  if (error instanceof ApiRequestError) {
    const apiMessage = API_MESSAGE_ALLOWED.has(context)
      ? extractApiMessage(error)
      : null;
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

  // Intentional client-side tips — keep if message looks user-facing (Vietnamese), not technical.
  if (error instanceof Error && error.message) {
    const looksTechnical =
      /[A-Z][a-z]+Exception|\bDTO\b|\bUUID\b|\bHttpStatus\b|at\s+\w+\.|System\.|Request failed|NullReference|SqlException/i.test(
        error.message,
      );
    if (!looksTechnical && !MANAGER_MUTATE.has(context)) {
      const fallback = CONTEXT_FALLBACKS[context];
      return {
        title: fallback.title,
        reason: error.message,
        action: fallback.action,
      };
    }
  }

  return CONTEXT_FALLBACKS[context];
}
