/**
 * Auth panel copy and mock imagery — swap `imageSrc` when final assets are ready.
 */
export type AuthPageKey =
  | "login"
  | "register"
  | "verify-otp"
  | "forgot-password"
  | "reset-password"
  | "magic-login";

export type AuthPanelContent = {
  panelEyebrow: string;
  panelTitle: string;
  panelDescription: string;
  imageSrc: string;
  imageAlt: string;
};

export const AUTH_PAGES: Record<AuthPageKey, AuthPanelContent> = {
  login: {
    panelEyebrow: "CHÀO MỪNG TRỞ LẠI",
    panelTitle: "Tiếp tục hành trình STEAM",
    panelDescription:
      "Đăng nhập để theo dõi tiến độ, hoàn thiện portfolio và kết nối với mentor OboxSTEAM.",
    imageSrc:
      "https://plus.unsplash.com/premium_photo-1682124436940-4f3739d0dc63?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    imageAlt: "Gradient ánh sáng trừu tượng",
  },
  register: {
    panelEyebrow: "BẮT ĐẦU MIỄN PHÍ",
    panelTitle: "Tạo tài khoản học viên",
    panelDescription:
      "Tham gia cộng đồng trẻ em Việt khám phá khoa học, công nghệ và sáng tạo mỗi ngày.",
    imageSrc:
      "https://plus.unsplash.com/premium_photo-1664372145591-f7cc308ff5da?q=80&w=696&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    imageAlt: "Học sinh trong lớp học STEAM",
  },
  "verify-otp": {
    panelEyebrow: "XÁC THỰC EMAIL",
    panelTitle: "Chỉ còn một bước nữa",
    panelDescription:
      "Nhập mã OTP 6 chữ số từ email để kích hoạt tài khoản và bắt đầu học.",
    imageSrc:
      "https://images.unsplash.com/photo-1557200134-90327eece251?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Minh họa xác thực email",
  },
  "forgot-password": {
    panelEyebrow: "KHÔI PHỤC TÀI KHOẢN",
    panelTitle: "Quên mật khẩu?",
    panelDescription:
      "Chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến email đã đăng ký của bạn.",
    imageSrc:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Bảo mật tài khoản",
  },
  "reset-password": {
    panelEyebrow: "MẬT KHẨU MỚI",
    panelTitle: "Đặt lại mật khẩu",
    panelDescription:
      "Chọn mật khẩu mạnh để bảo vệ portfolio và dữ liệu học tập của bạn.",
    imageSrc:
      "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Khóa bảo mật kỹ thuật số",
  },
  "magic-login": {
    panelEyebrow: "LIÊN KẾT PHỤ HUYNH",
    panelTitle: "Xác nhận kết nối với học viên",
    panelDescription:
      "Hoàn tất bước này để theo dõi tiến độ học tập và nhận thông báo từ OboxSTEAM.",
    imageSrc:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Phụ huynh và học viên",
  },
};
