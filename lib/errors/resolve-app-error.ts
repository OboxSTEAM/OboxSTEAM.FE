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
  "parent.progression": {
    title: "Không tải được tiến độ học viên",
    reason: "Liên kết phụ huynh chưa xác nhận, hoặc máy chủ tạm thời không phản hồi.",
    action: "Quay lại danh sách con hoặc thử tải lại trang sau vài giây.",
  },
  "parent.enrollment-progression": {
    title: "Không tải được chi tiết chương trình",
    reason: "Ghi danh không tồn tại, không thuộc học viên liên kết, hoặc máy chủ lỗi.",
    action: "Quay lại trang tiến độ học viên hoặc thử lại sau vài giây.",
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
  "experts.credentials": {
    title: "Không lưu được hồ sơ chuyên môn",
    reason: "Thông tin bằng cấp hoặc bài báo chưa hợp lệ.",
    action: "Kiểm tra học vị, trường, năm và đường dẫn rồi thử lại.",
  },
  "experts.profile": {
    title: "Không tải được hồ sơ chuyên gia",
    reason: "Hồ sơ không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Thử lại sau vài giây hoặc quay lại danh sách chuyên gia.",
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
    reason: "Thông tin lớp chưa hợp lệ, mã đã tồn tại, hoặc ngày bắt đầu chưa đủ 14 ngày.",
    action: "Kiểm tra mã, tên, chương trình và ngày bắt đầu (≥ 14 ngày nữa) rồi thử lại.",
  },
  "classes.update": {
    title: "Không cập nhật được lớp học",
    reason: "Thông tin chưa hợp lệ, hoặc buổi học hiện có nằm ngoài khoảng ngày mới.",
    action: "Tải lại trang, dời lịch buổi học hoặc mở rộng ngày lớp rồi thử lưu lại.",
  },
  "classes.lifecycle": {
    title: "Không chuyển được trạng thái lớp",
    reason: "Lớp thiếu mentor, lịch chưa khớp khung chương trình, hoặc ngày bắt đầu đã quá hạn.",
    action: "Gán mentor, xếp đủ lịch, kiểm tra ngày bắt đầu rồi thử lại.",
  },
  "classes.curriculumProgress": {
    title: "Không tải được tiến độ chương trình",
    reason: "Máy chủ tạm thời không phản hồi hoặc bạn không có quyền xem lớp này.",
    action: "Kiểm tra mạng và thử tải lại sau vài giây.",
  },
  "classMentorRequests.list": {
    title: "Không tải được yêu cầu mentor",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Kiểm tra mạng và thử tải lại sau vài giây.",
  },
  "classMentorRequests.board": {
    title: "Không tải được bảng lớp",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Kiểm tra mạng và thử tải lại sau vài giây.",
  },
  "classMentorRequests.mine": {
    title: "Không tải được yêu cầu của bạn",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Kiểm tra mạng và thử tải lại sau vài giây.",
  },
  "classMentorRequests.create": {
    title: "Không gửi được yêu cầu",
    reason: "Chỉ lớp Bản nháp đã có lịch, chưa có mentor mới nhận đăng ký.",
    action: "Tải lại bảng lớp và chọn lớp Draft còn trống mentor.",
  },
  "classMentorRequests.withdraw": {
    title: "Không rút được yêu cầu",
    reason: "Yêu cầu không còn ở trạng thái chờ duyệt hoặc đã được xử lý.",
    action: "Tải lại danh sách yêu cầu và thử lại.",
  },
  "classMentorRequests.approve": {
    title: "Không duyệt được yêu cầu mentor",
    reason: "Lớp đã mất lịch, đã có mentor, hoặc yêu cầu không còn chờ duyệt.",
    action: "Kiểm tra lịch lớp rồi tải lại danh sách yêu cầu.",
  },
  "classMentorRequests.reject": {
    title: "Không từ chối được yêu cầu mentor",
    reason: "Yêu cầu không còn ở trạng thái chờ duyệt hoặc đã được xử lý.",
    action: "Tải lại danh sách yêu cầu và thử lại.",
  },
  "mentors.detail": {
    title: "Không tải được hồ sơ mentor",
    reason: "Mentor không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Thử lại sau vài giây.",
  },
  "mentors.skills.list": {
    title: "Không tải được kỹ năng",
    reason: "Máy chủ tạm thời không phản hồi hoặc hồ sơ mentor chưa sẵn sàng.",
    action: "Thử tải lại sau vài giây.",
  },
  "mentors.skills.add": {
    title: "Không thêm được kỹ năng",
    reason: "Kỹ năng có thể đã tồn tại hoặc thông tin chưa hợp lệ.",
    action: "Chọn kỹ năng khác hoặc kiểm tra mức thành thạo rồi thử lại.",
  },
  "mentors.skills.update": {
    title: "Không cập nhật được kỹ năng",
    reason: "Thông tin kỹ năng chưa hợp lệ hoặc kỹ năng không còn tồn tại.",
    action: "Kiểm tra lại nội dung rồi thử lại.",
  },
  "mentors.skills.visibility": {
    title: "Không đổi được hiển thị kỹ năng",
    reason: "Máy chủ từ chối yêu cầu hoặc kỹ năng không còn tồn tại.",
    action: "Tải lại danh sách và thử lại.",
  },
  "mentors.skills.delete": {
    title: "Không xóa được kỹ năng",
    reason: "Kỹ năng có thể đã bị xóa hoặc máy chủ từ chối yêu cầu.",
    action: "Tải lại danh sách và thử lại.",
  },
  "skills.list": {
    title: "Không tải được danh mục kỹ năng",
    reason: "Máy chủ tạm thời không phản hồi.",
    action: "Thử tải lại sau vài giây.",
  },
  "assignments.submissions.list": {
    title: "Không tải được bài nộp",
    reason: "Máy chủ tạm thời không phản hồi hoặc lớp/bài tập không hợp lệ.",
    action: "Chọn lại bài tập hoặc thử tải lại.",
  },
  "assignments.submissions.grade": {
    title: "Không chấm được bài",
    reason: "Điểm chưa hợp lệ hoặc bài chưa ở trạng thái có thể chấm.",
    action: "Kiểm tra điểm và trạng thái bài nộp rồi thử lại.",
  },
  "assignments.quiz.result": {
    title: "Không tải được kết quả quiz",
    reason: "Không lấy được điểm tự chấm của học viên.",
    action: "Thử lại hoặc xem điểm trên bảng danh sách.",
  },
  "assignments.schedule": {
    title: "Không cập nhật được lịch mở bài",
    reason: "Khung thời gian chưa hợp lệ hoặc bạn không có quyền sửa bài tập này.",
    action: "Kiểm tra mở từ / đóng lúc / hạn nộp rồi thử lại.",
  },
  "classSessions.list": {
    title: "Không tải được lịch học",
    reason: "Máy chủ tạm thời không phản hồi hoặc lớp không tồn tại.",
    action: "Chọn lại lớp hoặc thử tải lại sau vài giây.",
  },
  "classSessions.create": {
    title: "Không tạo được buổi học",
    reason: "Thiếu mục chương trình, trùng buổi active, hoặc khung giờ không hợp lệ.",
    action: "Chọn đúng một hoạt động/bài tập chưa có buổi, kiểm tra giờ học rồi thử lại.",
  },
  "classSessions.generate": {
    title: "Không tạo được lịch tự động",
    reason: "Lớp đã có học viên, còn buổi active, hoặc khoảng ngày không đủ chỗ.",
    action: "Xóa/hủy buổi cũ nếu cần, nới EndDate, rồi thử lại. Không cần mentor khi tạo lịch.",
  },
  "classSessions.checkinToken": {
    title: "Không hiển thị được QR check-in",
    reason: "Buổi học không mở check-in hoặc bạn không có quyền.",
    action: "Kiểm tra trạng thái buổi học và thử lại.",
  },
  "classSessions.checkin": {
    title: "Check-in không thành công",
    reason: "Mã check-in không hợp lệ hoặc đã hết hạn.",
    action: "Nhờ mentor hiển thị mã QR mới và thử lại.",
  },
  "classSessions.update": {
    title: "Không cập nhật được buổi học",
    reason: "Mục chương trình bị trùng buổi active, hoặc thông tin chưa hợp lệ.",
    action: "Tải lại lịch học, chọn mục chưa có buổi rồi thử lưu lại.",
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
  "activityProgress.forceComplete": {
    title: "Không force-complete được hoạt động",
    reason: "Học viên hoặc hoạt động không hợp lệ, hoặc bạn không có quyền.",
    action: "Kiểm tra học viên/hoạt động rồi thử lại.",
  },
  "activityProgress.mentorCompleteBulk": {
    title: "Không hoàn thành được hoạt động cho lớp",
    reason:
      "Buổi học hoặc hoạt động không hợp lệ, chưa có học viên đủ điều kiện, hoặc bạn không có quyền.",
    action: "Kiểm tra điểm danh (Có mặt / Đi muộn / Có phép) rồi thử lại.",
  },
  "classQuizSet.get": {
    title: "Không tải được bộ đề lớp",
    reason: "Máy chủ tạm thời không phản hồi hoặc bài tập không tồn tại.",
    action: "Chọn lại bài quiz hoặc thử tải lại sau vài giây.",
  },
  "classQuizSet.pull": {
    title: "Không kéo được bộ đề lớp",
    reason: "Bộ đề có thể đã khóa, ngân hàng câu hỏi trống, hoặc bạn không có quyền.",
    action: "Nếu đã có học viên nộp bài, bộ đề bị khóa và không thể kéo lại.",
  },
  "classQuizSet.update": {
    title: "Không cập nhật được câu hỏi",
    reason: "Bộ đề đã khóa hoặc nội dung câu hỏi chưa hợp lệ.",
    action: "Kiểm tra nội dung rồi thử lại. Bộ đề khóa sau khi có bài nộp.",
  },
  "media.list": {
    title: "Không tải được media",
    reason: "Máy chủ tạm thời không phản hồi hoặc lớp không tồn tại.",
    action: "Thử tải lại sau vài giây.",
  },
  "media.detail": {
    title: "Không tải được chi tiết media",
    reason: "Media không tồn tại hoặc bạn không có quyền xem.",
    action: "Quay lại danh sách và thử lại.",
  },
  "media.progress": {
    title: "Không cập nhật được tiến trình media",
    reason: "Máy chủ tạm thời không trả được trạng thái xử lý.",
    action: "Đợi vài giây hoặc tải lại danh sách.",
  },
  "media.upload": {
    title: "Không tải lên được media",
    reason: "File không hợp lệ, quá lớn, hoặc bạn không có quyền upload cho lớp này.",
    action: "Dùng ảnh JPG/PNG hoặc video MP4/MOV rồi thử lại.",
  },
  "media.delete": {
    title: "Không xóa được media",
    reason: "Media có thể đã bị xóa hoặc bạn không có quyền.",
    action: "Tải lại danh sách và thử lại.",
  },
  "media.processTags": {
    title: "Không xử lý được face tagging",
    reason: "Video chưa sẵn sàng hoặc máy chủ đang xử lý.",
    action: "Đợi vài phút rồi thử quét lại.",
  },
  "media.tag.add": {
    title: "Không gắn thẻ học viên",
    reason: "Học viên không thuộc lớp hoặc đã được gắn thẻ trước đó.",
    action: "Kiểm tra danh sách học viên và thử lại.",
  },
  "media.tag.verify": {
    title: "Không cập nhật được xác nhận thẻ",
    reason: "Thẻ không tồn tại hoặc bạn không có quyền.",
    action: "Tải lại media và thử lại.",
  },
  "media.tag.delete": {
    title: "Không gỡ được thẻ học viên",
    reason: "Thẻ không tồn tại hoặc đã bị xóa.",
    action: "Tải lại media và thử lại.",
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
    reason: "Thông tin hoạt động chưa hợp lệ hoặc thời lượng chưa đúng.",
    action: "Kiểm tra tên, loại, thứ tự và thời lượng (phút) rồi thử lại.",
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
    action: "Kiểm tra tiêu đề, điểm và cấu hình (thời lượng làm bài nếu là quiz) rồi thử lại.",
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
  "curriculum.questionBank.questionDelete": {
    title: "Không xóa được câu hỏi",
    reason: "Câu hỏi không còn tồn tại hoặc máy chủ từ chối yêu cầu.",
    action: "Tải lại ngân hàng đề và thử lại.",
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
  "payments.checkout-retake": {
    title: "Không thể thanh toán học lại",
    reason: "Yêu cầu học lại chưa sẵn sàng thanh toán hoặc máy chủ từ chối.",
    action: "Kiểm tra trạng thái yêu cầu học lại rồi thử lại.",
  },
  "payments.request-parent-retake": {
    title: "Không gửi được yêu cầu thanh toán học lại",
    reason: "Phụ huynh chưa liên kết, chưa xác nhận, hoặc yêu cầu bị từ chối.",
    action: "Kiểm tra liên kết phụ huynh trong hồ sơ và thử lại.",
  },
  "invoices.list": {
    title: "Không tải được danh sách hóa đơn",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ tạm thời không phản hồi.",
    action: "Đăng nhập lại hoặc thử tải trang sau vài giây.",
  },
  "invoices.detail": {
    title: "Không tải được hóa đơn",
    reason: "Hóa đơn không tồn tại hoặc máy chủ tạm thời không phản hồi.",
    action: "Kiểm tra lại liên kết hoặc vào Khóa học của tôi.",
  },
  "assessment-recovery.create": {
    title: "Không gửi được yêu cầu làm lại",
    reason: "Bạn có thể đã hết lượt yêu cầu, hoặc bài tập chưa đủ điều kiện phục hồi.",
    action: "Kiểm tra số lần yêu cầu còn lại hoặc cân nhắc học lại lớp.",
  },
  "assessment-recovery.list": {
    title: "Không tải được yêu cầu làm lại",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ tạm thời không phản hồi.",
    action: "Thử tải lại trang sau vài giây.",
  },
  "assessment-recovery.decide": {
    title: "Không xử lý được yêu cầu làm lại",
    reason: "Yêu cầu có thể đã được xử lý hoặc bạn không có quyền quyết định.",
    action: "Tải lại danh sách chờ duyệt và thử lại.",
  },
  "class-redelivery.create": {
    title: "Không gửi được yêu cầu học lại lớp",
    reason: "Module chưa đủ điều kiện học lại hoặc yêu cầu đang chờ xử lý.",
    action: "Kiểm tra trạng thái ghi danh module rồi thử lại.",
  },
  "class-redelivery.list": {
    title: "Không tải được yêu cầu học lại lớp",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ tạm thời không phản hồi.",
    action: "Thử tải lại trang sau vài giây.",
  },
  "class-redelivery.decide": {
    title: "Không xử lý được yêu cầu học lại lớp",
    reason: "Yêu cầu có thể đã được xử lý hoặc lớp đích không hợp lệ.",
    action: "Tải lại hàng đợi quản lý và chọn lớp khác nếu cần.",
  },
  "enrollments.list": {
    title: "Không tải được khóa học",
    reason: "Phiên đăng nhập có thể đã hết hạn hoặc máy chủ từ chối yêu cầu.",
    action: "Đăng nhập lại hoặc thử tải trang sau vài giây.",
  },
  "dashboard.load": {
    title: "Không tải được dashboard",
    reason: "Máy chủ tạm thời không phản hồi hoặc kết nối bị gián đoạn.",
    action: "Kiểm tra mạng và thử tải lại trang sau vài giây.",
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
  "portfolio.gallery.import": {
    title: "Không nhập được media từ lớp",
    reason: "Media chưa sẵn sàng, không thuộc lớp đã ghi danh, hoặc máy chủ từ chối.",
    action: "Chọn media đã sẵn sàng và thử kéo thả lại.",
  },
  "highlight.load": {
    title: "Không tải được highlight video",
    reason: "Máy chủ tạm thời không phản hồi hoặc yêu cầu bị từ chối.",
    action: "Thử tải lại sau vài giây.",
  },
  "highlight.create": {
    title: "Không tạo được highlight",
    reason: "Lớp không hợp lệ, đang có job xử lý, hoặc máy chủ từ chối yêu cầu.",
    action: "Kiểm tra lớp và mô tả điểm mạnh rồi thử lại.",
  },
  "highlight.trim": {
    title: "Không cắt được video highlight",
    reason: "Khoảng thời gian không hợp lệ hoặc video chưa hoàn tất xử lý.",
    action: "Chọn đoạn cần loại bỏ trên video đã hoàn tất và thử lại.",
  },
  "highlight.segment": {
    title: "Không thêm được đoạn media",
    reason: "Media nguồn không hợp lệ, khoảng thời gian sai, hoặc overlap với đoạn đã có (409).",
    action: "Chọn media từ source-media và khoảng không chồng rồi thử lại.",
  },
  "highlight.delete": {
    title: "Không xóa được highlight",
    reason: "Stack/item đang xử lý hoặc máy chủ từ chối yêu cầu.",
    action: "Đợi job hoàn tất hoặc thử lại sau.",
  },
  "highlight.attach": {
    title: "Không đồng bộ highlight vào portfolio",
    reason: "Video chưa sẵn sàng hoặc máy chủ từ chối đồng bộ.",
    action: "Đợi video hoàn tất rồi thử đồng bộ lại.",
  },
  "highlight.cancel": {
    title: "Không hủy được job highlight",
    reason: "Item không còn Processing hoặc máy chủ từ chối hủy.",
    action: "Tải lại trạng thái stack rồi thử lại.",
  },
  "highlight.retry": {
    title: "Không thử lại được highlight",
    reason: "Chỉ retry được item Initial đã Failed/Cancelled.",
    action: "Xóa phiên bản Trim/SegmentAdd lỗi rồi tạo lại, hoặc chọn item Initial.",
  },
  "highlight.regenerate": {
    title: "Không tạo lại được highlight",
    reason: "Stack đã đủ slot, đang Processing, hoặc máy chủ từ chối.",
    action: "Xóa một phiên bản cũ rồi thử regenerate.",
  },
  "highlight.progress": {
    title: "Không theo dõi được tiến trình highlight",
    reason: "Máy chủ tạm thời không phản hồi tiến trình job.",
    action: "Đợi vài giây — hệ thống sẽ tiếp tục thử.",
  },
};

/** Placeholder client messages — not real BE copy; keep curated fallbacks instead. */
const CLIENT_PLACEHOLDER_MESSAGES = new Set([
  "Request failed.",
  "Request failed",
]);

/**
 * Manager mutate flows — status-based Vietnamese fallbacks when BE has no message.
 * Client-side Error tips are also suppressed here (not BE envelopes).
 */
const MANAGER_MUTATE: ReadonlySet<AppErrorContext> = new Set([
  "programs.create",
  "programs.update",
  "programs.delete",
  "programs.reviews.delete",
  "experts.create",
  "experts.update",
  "experts.delete",
  "experts.credentials",
  "classes.create",
  "classes.update",
  "classes.lifecycle",
  "classMentorRequests.create",
  "classMentorRequests.withdraw",
  "classMentorRequests.approve",
  "classMentorRequests.reject",
  "mentors.skills.add",
  "mentors.skills.update",
  "mentors.skills.visibility",
  "mentors.skills.delete",
  "assignments.submissions.grade",
  "assignments.schedule",
  "classSessions.create",
  "classSessions.update",
  "classSessions.delete",
  "classSessions.generate",
  "classSessions.checkinToken",
  "classSessions.checkin",
  "attendance.update",
  "activityProgress.forceComplete",
  "activityProgress.mentorCompleteBulk",
  "classQuizSet.pull",
  "classQuizSet.update",
  "media.upload",
  "media.delete",
  "media.processTags",
  "media.tag.add",
  "media.tag.verify",
  "media.tag.delete",
  "portfolio.gallery.import",
  "highlight.create",
  "highlight.trim",
  "highlight.segment",
  "highlight.delete",
  "highlight.attach",
  "highlight.cancel",
  "highlight.retry",
  "highlight.regenerate",
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
  "curriculum.questionBank.questionDelete",
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
      return "Không sửa được khung chương trình khi có lớp đang học hoặc lớp Open đã có học viên — hoặc mã/tên đã tồn tại.";
    }
    if (context === "classSessions.create" || context === "classSessions.update") {
      return "Mục chương trình này đã có buổi học active trên lớp.";
    }
    if (context === "highlight.segment") {
      return "Đoạn mới chồng lên khoảng đã có trong highlight (overlap).";
    }
    if (
      context === "highlight.create" ||
      context === "highlight.regenerate" ||
      context === "highlight.trim" ||
      context === "highlight.retry"
    ) {
      return "Stack đang Processing hoặc đã hết slot phiên bản.";
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

function sanitizeApiMessage(message: string | null | undefined): string | null {
  if (!message) return null;
  const trimmed = message.trim();
  if (!trimmed || CLIENT_PLACEHOLDER_MESSAGES.has(trimmed)) return null;
  if (/^Request failed with status \d+/i.test(trimmed)) return null;
  return trimmed;
}

function extractApiMessage(error: ApiRequestError | ApiResponseError): string | null {
  if (error instanceof ApiResponseError) {
    return sanitizeApiMessage(error.message);
  }

  const body = error.body as {
    error?: { message?: string };
    message?: string;
    value?: { message?: string };
  } | null;

  return sanitizeApiMessage(
    body?.error?.message ?? body?.value?.message ?? body?.message,
  );
}

/** Neutral next-step copy keyed by HTTP status — used when BE drives `reason`. */
function actionForHttpStatus(status: number): string {
  if (status === 0) {
    return "Kiểm tra mạng internet và thử lại.";
  }
  if (status === 401) {
    return "Đăng nhập lại rồi thử tiếp.";
  }
  if (status === 403) {
    return "Liên hệ quản trị viên nếu bạn cần quyền này.";
  }
  if (status === 404) {
    return "Kiểm tra lại thông tin hoặc quay lại trang trước.";
  }
  if (status === 409) {
    return "Kiểm tra dữ liệu bị trùng rồi thử lại.";
  }
  if (status === 413) {
    return "Chọn tệp nhỏ hơn rồi thử lại.";
  }
  if (status === 400 || status === 422) {
    return "Kiểm tra lại thông tin đã nhập rồi thử lại.";
  }
  if (status >= 500) {
    return "Thử lại sau vài phút. Nếu vẫn lỗi, liên hệ hỗ trợ OboxSTEAM.";
  }
  return "Vui lòng thử lại sau vài giây.";
}

function resolveAction(
  status: number,
  apiMessage: string | null,
  curatedAction: string,
): string {
  return apiMessage ? actionForHttpStatus(status) : curatedAction;
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
      action: resolveAction(
        status,
        apiMessage,
        "Kiểm tra lại thông tin hoặc chọn Quên mật khẩu.",
      ),
    };
  }

  if (status === 409 && context === "auth.register") {
    return {
      title: "Email đã được sử dụng",
      reason: apiMessage ?? "Tài khoản với email này đã tồn tại.",
      action: resolveAction(
        status,
        apiMessage,
        "Đăng nhập hoặc dùng email khác để đăng ký.",
      ),
    };
  }

  if (status === 409 && context === "curriculum.material.save") {
    return {
      title: "Hoạt động đã có tài liệu",
      reason:
        apiMessage ?? "Mỗi hoạt động chỉ đính kèm được một tài liệu.",
      action: resolveAction(
        status,
        apiMessage,
        "Tải lại trang để xem tài liệu hiện có, hoặc xóa nó trước khi tải tài liệu mới.",
      ),
    };
  }

  const fallback = CONTEXT_FALLBACKS[context];
  const statusReason = reasonForHttpStatus(status, context);

  if (status >= 500) {
    return {
      title: "Máy chủ đang gặp sự cố",
      reason: apiMessage ?? statusReason ?? "Hệ thống tạm thời không phản hồi.",
      action: resolveAction(
        status,
        apiMessage,
        "Thử lại sau vài phút. Nếu vẫn lỗi, liên hệ hỗ trợ OboxSTEAM.",
      ),
    };
  }

  if (status === 0 || status >= 400) {
    const curatedAction =
      status === 401
        ? "Đăng nhập lại rồi thử tiếp."
        : fallback.action;

    return {
      title: fallback.title,
      reason: apiMessage ?? statusReason ?? fallback.reason,
      action: resolveAction(status, apiMessage, curatedAction),
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
 * Backend `error.message` is preferred as `reason` when present;
 * `action` then uses status-based copy instead of context-specific tips.
 */
export function resolveAppError(
  error: unknown,
  context: AppErrorContext = "generic",
): AppErrorState {
  if (error instanceof ApiResponseError) {
    const mapped = mapHttpStatusToError(
      400,
      context,
      extractApiMessage(error),
    );
    if (mapped) return mapped;
    return CONTEXT_FALLBACKS[context];
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
