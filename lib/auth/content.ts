/**
 * Auth panel copy and mock imagery — swap `imageSrc` when final assets are ready.
 */
export type AuthPageKey =
  | "login"
  | "register"
  | "verify-otp"
  | "forgot-password"
  | "reset-password";

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
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea986?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Gradient ánh sáng trừu tượng",
  },
  register: {
    panelEyebrow: "BẮT ĐẦU MIỄN PHÍ",
    panelTitle: "Tạo tài khoản học viên",
    panelDescription:
      "Tham gia cộng đồng trẻ em Việt khám phá khoa học, công nghệ và sáng tạo mỗi ngày.",
    imageSrc:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop",
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
};
