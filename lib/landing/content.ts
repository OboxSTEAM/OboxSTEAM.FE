/**
 * content.ts — Static typed content for the lean 5-section landing page.
 * Edit text here without touching JSX. All copy is in Vietnamese.
 */

export const SITE = {
  name: "OboxSTEAM",
  tagline: "Khám phá. Sáng tạo. Tỏa sáng.",
  logoUrl: "https://oboxsteam-bucket.s3.ap-southeast-1.amazonaws.com/obox-logo.png",
} as const;

export const NAV_LINKS = [
  { label: "STEAM", href: "#steam" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Chương trình", href: "#programs" },
] as const;

export const HERO = {
  eyebrow: "OBOX STEAM × INTRODUCTION 2026",
  headlineStatic: "Khám phá.",
  /** 3 verbs only, each ≤ 8 characters per styling rule. */
  rotatingWords: ["Sáng tạo.", "Tỏa sáng.", "Bứt phá."],
  subheadline:
    "Nền tảng STEAM trải nghiệm cho trẻ em Việt — mỗi bài học tạo ra một tác phẩm, mỗi tác phẩm dựng nên một hành trình du học.",
  ctaPrimary: { label: "Đăng ký miễn phí", href: "/register" },
  ctaSecondary: { label: "Khám phá chương trình", href: "/courses" },
  /** 3:4 portrait, like the Tizi brand-introduction figure. Replace with real photo. */
  imageSrc: "https://picsum.photos/seed/obox-hero-portrait/900/1200",
} as const;

export type SteamCategory = "science" | "technology" | "engineering" | "arts" | "mathematics";

export const STEAM_CATEGORIES: Array<{
  key: SteamCategory;
  letter: string;
  label: string;
  color: string;
  textColor: string;
  description: string;
  /** 4:3 thumbnail for strip section. Replace with real photo. */
  imageSrc?: string;
}> = [
  {
    key: "science",
    letter: "S",
    label: "Science",
    color: "#E94B3C",
    textColor: "#ffffff",
    description: "Khám phá thế giới qua thí nghiệm và đặt câu hỏi tại sao.",
    imageSrc: "https://picsum.photos/seed/steam-science/600/450",
  },
  {
    key: "technology",
    letter: "T",
    label: "Technology",
    color: "#7CB342",
    textColor: "#ffffff",
    description: "Xây dựng công cụ tương lai bằng code và sáng tạo.",
    imageSrc: "https://picsum.photos/seed/steam-tech/600/450",
  },
  {
    key: "engineering",
    letter: "E",
    label: "Engineering",
    color: "#4FC3F7",
    textColor: "#ffffff",
    description: "Giải quyết vấn đề thực bằng thiết kế và kiến trúc.",
    imageSrc: "https://picsum.photos/seed/steam-eng/600/450",
  },
  {
    key: "arts",
    letter: "A",
    label: "Arts",
    color: "#FDD835",
    textColor: "#2D2D2D",
    description: "Biểu đạt ý tưởng qua thiết kế, âm nhạc và sáng tác.",
    imageSrc: "https://picsum.photos/seed/steam-arts/600/450",
  },
  {
    key: "mathematics",
    letter: "M",
    label: "Mathematics",
    color: "#7E57C2",
    textColor: "#ffffff",
    description: "Tìm quy luật ẩn trong mọi thứ và giải mã thế giới.",
    imageSrc: "https://picsum.photos/seed/steam-math/600/450",
  },
];

export const UNIVERSE_SECTION = {
  eyebrow: "AI PORTFOLIO · CÔNG NGHỆ ĐỘC QUYỀN",
  headline: "Mỗi học viên có một vũ trụ STEAM riêng.",
  subheadline:
    "AI của OboxSTEAM tự động thu thập bằng chứng học tập — ảnh, video, đánh giá Mentor — và tạo ra microsite Portfolio cá nhân cho hồ sơ du học.",
  features: [
    {
      iconName: "ScanFace",
      label: "Nhận dạng khuôn mặt AI",
      desc: "Tự động gắn thẻ học viên trong ảnh lớp học",
    },
    {
      iconName: "Video",
      label: "Video highlight AI",
      desc: "Cắt ghép video 9:16 cá nhân từ footage lớp học",
    },
    {
      iconName: "PenLine",
      label: "Tóm tắt phản ánh AI",
      desc: "Biến nhật ký học tập thành văn viết trau chuốt",
    },
    {
      iconName: "Globe",
      label: "Subdomain cá nhân",
      desc: "Portfolio tại tên.obox.id — chia sẻ mọi lúc",
    },
  ],
  ctaLabel: "Xem Portfolio mẫu",
  ctaHref: "/portfolio/demo",
};

export const FEATURED_PROGRAMS = [
  {
    id: "robotics-ai",
    title: "Robotics & AI cơ bản",
    category: "technology" as SteamCategory,
    duration: "12 tuần",
    ageGroup: "9–12 tuổi",
    description:
      "Lập trình robot thực tế, học Machine Learning qua trò chơi và xây dựng dự án AI đầu tiên.",
    color: "#7CB342",
    /** 4:3 course thumbnail. Replace with real photo. */
    imageSrc: "https://picsum.photos/seed/prog-robotics/400/300",
  },
  {
    id: "green-science",
    title: "Khoa học Xanh",
    category: "science" as SteamCategory,
    duration: "8 tuần",
    ageGroup: "7–10 tuổi",
    description:
      "Thí nghiệm môi trường, nghiên cứu sinh thái và thiết kế giải pháp cho biến đổi khí hậu.",
    color: "#E94B3C",
    /** 4:3 course thumbnail. Replace with real photo. */
    imageSrc: "https://picsum.photos/seed/prog-science/400/300",
  },
  {
    id: "creative-coding",
    title: "Creative Coding & Design",
    category: "arts" as SteamCategory,
    duration: "10 tuần",
    ageGroup: "10–14 tuổi",
    description:
      "Kết hợp lập trình với nghệ thuật thị giác để tạo animation, game và tác phẩm số.",
    color: "#FDD835",
    /** 4:3 course thumbnail. Replace with real photo. */
    imageSrc: "https://picsum.photos/seed/prog-arts/400/300",
  },
  {
    id: "math-logic",
    title: "Toán tư duy & Lập trình",
    category: "mathematics" as SteamCategory,
    duration: "16 tuần",
    ageGroup: "11–15 tuổi",
    description:
      "Toán ứng dụng, thuật toán và bài toán thực tế — con đường vào các trường top.",
    color: "#7E57C2",
    /** 4:3 course thumbnail. Replace with real photo. */
    imageSrc: "https://picsum.photos/seed/prog-math/400/300",
  },
];

export const FINAL_CTA = {
  headline: "Sẵn sàng bắt đầu hành trình STEAM?",
  subheadline: "Đăng ký miễn phí hôm nay — không cần thẻ tín dụng.",
  ctaPrimary: { label: "Bắt đầu miễn phí", href: "/register" },
  ctaSecondary: { label: "Xem demo Portfolio", href: "/portfolio/demo" },
};
