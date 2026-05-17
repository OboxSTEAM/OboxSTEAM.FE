/**
 * content.ts — Static typed content for the landing page.
 * Edit text here without touching JSX. All copy is in Vietnamese.
 */

export const SITE = {
  name: "OboxSTEAM",
  tagline: "Khám phá. Sáng tạo. Tỏa sáng.",
  logoUrl: "https://oboxsteam-bucket.s3.ap-southeast-1.amazonaws.com/obox-logo.png",
} as const;

export const NAV_LINKS = [
  { label: "Chương trình", href: "#programs" },
  { label: "STEAM", href: "#steam" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Phụ huynh", href: "#parents" },
  { label: "Về chúng tôi", href: "#about" },
] as const;

export const HERO = {
  eyebrow: "STEAM · 2026 · BETA",
  headlineStatic: "Khám phá. ",
  rotatingWords: ["Sáng tạo.", "Tỏa sáng.", "Bứt phá.", "Khám phá."],
  subheadline:
    "Nền tảng học STEAM trải nghiệm dành cho trẻ em Việt Nam — nơi mỗi bài học tạo ra một tác phẩm, và mỗi tác phẩm xây nên một hành trình du học.",
  ctaPrimary: { label: "Đăng ký miễn phí", href: "/register" },
  ctaSecondary: { label: "Khám phá chương trình", href: "/courses" },
} as const;

export type SteamCategory = "science" | "technology" | "engineering" | "arts" | "mathematics";

export const STEAM_CATEGORIES: Array<{
  key: SteamCategory;
  letter: string;
  label: string;
  color: string;
  textColor: string;
  description: string;
}> = [
  {
    key: "science",
    letter: "S",
    label: "Science",
    color: "#E94B3C",
    textColor: "#ffffff",
    description: "Khoa học — khám phá thế giới qua thí nghiệm và đặt câu hỏi tại sao.",
  },
  {
    key: "technology",
    letter: "T",
    label: "Technology",
    color: "#7CB342",
    textColor: "#ffffff",
    description: "Công nghệ — xây dựng công cụ của tương lai bằng code và sáng tạo.",
  },
  {
    key: "engineering",
    letter: "E",
    label: "Engineering",
    color: "#4FC3F7",
    textColor: "#ffffff",
    description: "Kỹ thuật — giải quyết vấn đề thực tế bằng thiết kế và kiến trúc.",
  },
  {
    key: "arts",
    letter: "A",
    label: "Arts",
    color: "#FDD835",
    textColor: "#2D2D2D",
    description: "Nghệ thuật — biểu đạt ý tưởng qua thiết kế, âm nhạc và sáng tác.",
  },
  {
    key: "mathematics",
    letter: "M",
    label: "Mathematics",
    color: "#7E57C2",
    textColor: "#ffffff",
    description: "Toán học — tìm quy luật ẩn trong mọi thứ và giải mã thế giới.",
  },
];

export const TRUST_LOGOS: Array<{ node: React.ReactNode; title: string }> = [];

export const TRUST_PARTNERS = [
  "Trường Quốc tế BVIS",
  "VinSchool",
  "Trường Nguyễn Tất Thành",
  "Eureka Education",
  "The STEAM Lab",
  "Academy of Science",
  "FPT Education",
  "iSchool Vietnam",
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    label: "Khám phá",
    title: "Chọn chương trình STEAM phù hợp",
    description:
      "Duyệt qua hàng chục chương trình trải nghiệm được thiết kế theo chuẩn quốc tế, phù hợp với độ tuổi và định hướng của con.",
    color: "#E94B3C",
    tone: "science" as SteamCategory,
  },
  {
    step: "02",
    label: "Học & Tạo",
    title: "Học qua dự án thực tế",
    description:
      "Con học online và offline, tham gia lab thực hành, được Mentor dẫn dắt — mọi bước học đều tạo ra bằng chứng học tập thật.",
    color: "#7CB342",
    tone: "technology" as SteamCategory,
  },
  {
    step: "03",
    label: "Tỏa sáng",
    title: "Portfolio du học tự động hóa",
    description:
      "AI tổng hợp toàn bộ hành trình học thành một microsite Portfolio cá nhân — sẵn sàng gửi cho các trường đại học quốc tế.",
    color: "#4FC3F7",
    tone: "engineering" as SteamCategory,
  },
];

export const IMPACT_STATS = [
  { label: "Học viên", value: 2400, suffix: "+" },
  { label: "Chương trình STEAM", value: 48, suffix: "" },
  { label: "Đối tác trường học", value: 32, suffix: "" },
  { label: "Portfolio đã tạo", value: 1800, suffix: "+" },
] as const;

export const FEATURED_PROGRAMS = [
  {
    id: "robotics-ai",
    title: "Robotics & AI cơ bản",
    category: "technology" as SteamCategory,
    duration: "12 tuần",
    ageGroup: "9–12 tuổi",
    description: "Lập trình robot thực tế, học Machine Learning qua trò chơi và xây dựng dự án AI đầu tiên.",
    color: "#7CB342",
  },
  {
    id: "green-science",
    title: "Khoa học Xanh",
    category: "science" as SteamCategory,
    duration: "8 tuần",
    ageGroup: "7–10 tuổi",
    description: "Thí nghiệm môi trường, nghiên cứu sinh thái học và thiết kế giải pháp cho biến đổi khí hậu.",
    color: "#E94B3C",
  },
  {
    id: "creative-coding",
    title: "Creative Coding & Design",
    category: "arts" as SteamCategory,
    duration: "10 tuần",
    ageGroup: "10–14 tuổi",
    description: "Kết hợp lập trình với nghệ thuật thị giác để tạo ra animation, game và tác phẩm số.",
    color: "#FDD835",
  },
  {
    id: "math-logic",
    title: "Toán tư duy & Lập trình",
    category: "mathematics" as SteamCategory,
    duration: "16 tuần",
    ageGroup: "11–15 tuổi",
    description: "Toán ứng dụng, thuật toán và giải quyết bài toán thực tế — con đường vào các trường top.",
    color: "#7E57C2",
  },
];

export const PORTFOLIO_SHOWCASE_ITEMS = [
  {
    image: "https://i.pravatar.cc/300?img=1",
    title: "Nguyễn Minh Anh",
    subtitle: "Robotics & AI · 12 tuổi",
    handle: "@minhanhsteam",
    borderColor: "#7CB342",
    gradient: "linear-gradient(145deg,#7CB342 0%,#1a2e0a 100%)",
  },
  {
    image: "https://i.pravatar.cc/300?img=5",
    title: "Trần Bảo Châu",
    subtitle: "Creative Coding · 13 tuổi",
    handle: "@baochau.art",
    borderColor: "#FDD835",
    gradient: "linear-gradient(210deg,#FDD835 0%,#2e2a00 100%)",
  },
  {
    image: "https://i.pravatar.cc/300?img=9",
    title: "Lê Đức Khải",
    subtitle: "Green Science · 10 tuổi",
    handle: "@khai.science",
    borderColor: "#E94B3C",
    gradient: "linear-gradient(165deg,#E94B3C 0%,#2e0808 100%)",
  },
  {
    image: "https://i.pravatar.cc/300?img=15",
    title: "Phạm Thu Hà",
    subtitle: "Math & Logic · 14 tuổi",
    handle: "@thuha.math",
    borderColor: "#7E57C2",
    gradient: "linear-gradient(195deg,#7E57C2 0%,#1a0e2e 100%)",
  },
  {
    image: "https://i.pravatar.cc/300?img=22",
    title: "Vũ Hoàng Nam",
    subtitle: "Engineering · 11 tuổi",
    handle: "@hoangnam.eng",
    borderColor: "#4FC3F7",
    gradient: "linear-gradient(225deg,#4FC3F7 0%,#082832 100%)",
  },
  {
    image: "https://i.pravatar.cc/300?img=33",
    title: "Đinh Lan Anh",
    subtitle: "Creative Coding · 12 tuổi",
    handle: "@lananh.creates",
    borderColor: "#E94B3C",
    gradient: "linear-gradient(135deg,#E94B3C 0%,#2e0808 100%)",
  },
];

export const ROLES = [
  {
    key: "student",
    title: "Dành cho học viên",
    description:
      "Học qua dự án thực tế, nhận chứng chỉ quốc tế, và xây dựng Portfolio AI sẵn sàng cho đại học nước ngoài.",
    cta: "Bắt đầu học",
    href: "/register?role=student",
    tone: "technology" as SteamCategory,
    spotlightColor: "rgba(124, 179, 66, 0.3)" as const,
  },
  {
    key: "parent",
    title: "Dành cho phụ huynh",
    description:
      "Theo dõi tiến trình học của con theo thời gian thực, nhận báo cáo sau mỗi giai đoạn và đồng hành cùng hành trình du học.",
    cta: "Tìm hiểu thêm",
    href: "/register?role=parent",
    tone: "arts" as SteamCategory,
    spotlightColor: "rgba(253, 216, 53, 0.25)" as const,
  },
  {
    key: "mentor",
    title: "Dành cho Mentor",
    description:
      "Chia sẻ kiến thức chuyên môn, dẫn dắt thế hệ tiếp theo và xây dựng sự nghiệp giảng dạy trong hệ sinh thái STEAM.",
    cta: "Đăng ký Mentor",
    href: "/register?role=mentor",
    tone: "science" as SteamCategory,
    spotlightColor: "rgba(233, 75, 60, 0.25)" as const,
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "Con tôi học OboxSTEAM được 3 tháng và đã tự làm được app di động đầu tiên. Portfolio của con giờ ấn tượng hơn nhiều thứ tôi từng thấy.",
    author: "Chị Nguyễn Thu Hương",
    role: "Phụ huynh học viên 12 tuổi",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    quote:
      "Tôi đã xem qua nhiều nền tảng edtech nhưng OboxSTEAM là nơi duy nhất mà con tôi thực sự tạo ra thứ gì đó thật — không phải chỉ xem video.",
    author: "Anh Trần Văn Bình",
    role: "Phụ huynh học viên 10 tuổi",
    avatar: "https://i.pravatar.cc/150?img=52",
  },
  {
    quote:
      "Là giáo viên, tôi rất ấn tượng với cách OboxSTEAM cá nhân hoá hành trình học. Portfolio AI giúp học sinh tự tin khi nộp đơn du học.",
    author: "Cô Lê Phương Thảo",
    role: "Mentor Khoa học",
    avatar: "https://i.pravatar.cc/150?img=41",
  },
];

export const UNIVERSE_SECTION = {
  eyebrow: "AI PORTFOLIO · CÔNG NGHỆ ĐỘC QUYỀN",
  headline: "Mỗi học viên có một vũ trụ STEAM riêng.",
  subheadline:
    "Công nghệ AI của OboxSTEAM tự động thu thập bằng chứng học tập — hình ảnh, video, đánh giá của Mentor — và tạo ra một microsite Portfolio cá nhân hoá, sẵn sàng cho hồ sơ du học.",
  features: [
    { icon: "🤖", label: "Nhận dạng khuôn mặt AI", desc: "Tự động gắn thẻ học viên trong ảnh lớp học" },
    { icon: "🎬", label: "Video highlight AI", desc: "Cắt ghép video 9:16 cá nhân từ footage lớp học" },
    { icon: "✍️", label: "Tóm tắt phản ánh AI", desc: "Biến nhật ký học tập thành văn viết trau chuốt" },
    { icon: "🌐", label: "Subdomain cá nhân", desc: "Portfolio tại tên.obox.id — chia sẻ mọi lúc" },
  ],
  ctaLabel: "Xem Portfolio mẫu",
  ctaHref: "/portfolio/demo",
};

export const FINAL_CTA = {
  headline: "Sẵn sàng bắt đầu hành trình STEAM?",
  subheadline: "Đăng ký miễn phí hôm nay — không cần thẻ tín dụng.",
  ctaPrimary: { label: "Bắt đầu miễn phí", href: "/register" },
  ctaSecondary: { label: "Xem demo Portfolio", href: "/portfolio/demo" },
};

// Re-export React for the TRUST_LOGOS typing above
import type React from "react";
