/**
 * content.ts — Static typed content for the lean 5-section landing page.
 * Edit text here without touching JSX. All copy is in Vietnamese.
 */

export const SITE = {
  name: "OboxSTEAM",
  tagline: "Khám phá. Sáng tạo. Tỏa sáng.",
  logoUrl: "https://oboxsteam-bucket.s3.ap-southeast-1.amazonaws.com/logo/obox-logo.png",
} as const;

export const NAV_LINKS = [
  { label: "STEAM", href: "#steam" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Chương trình", href: "#programs" },
] as const;

export const HERO = {
  eyebrow: "OBOX STEAM × INTRODUCTION 2026",
  headlineStatic: "Khám phá.",
  rotatingWords: ["Sáng tạo.", "Tỏa sáng.", "Bứt phá."],
  subheadline:
    "Nền tảng STEAM trải nghiệm cho trẻ em Việt — mỗi bài học tạo ra một tác phẩm, mỗi tác phẩm dựng nên một hành trình du học.",
  ctaPrimary: { label: "Đăng ký miễn phí", href: "/register" },
  ctaSecondary: { label: "Khám phá chương trình", href: "/courses" },
  imageSrc: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
} as const;

export type SteamCategory = "science" | "technology" | "engineering" | "arts" | "mathematics";

export const STEAM_CATEGORIES: Array<{
  key: SteamCategory;
  letter: string;
  label: string;
  color: string;
  textColor: string;
  description: string;
  imageSrc?: string;
}> = [
  {
    key: "science",
    letter: "S",
    label: "Science",
    color: "#E94B3C",
    textColor: "#ffffff",
    description: "Khám phá thế giới qua thí nghiệm và đặt câu hỏi tại sao.",
    imageSrc: "https://images.unsplash.com/photo-1630959305606-3123a081dada?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    key: "technology",
    letter: "T",
    label: "Technology",
    color: "#7CB342",
    textColor: "#ffffff",
    description: "Xây dựng công cụ tương lai bằng code và sáng tạo.",
    imageSrc: "https://images.unsplash.com/photo-1717347424091-08275b73c918?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    key: "engineering",
    letter: "E",
    label: "Engineering",
    color: "#4FC3F7",
    textColor: "#ffffff",
    description: "Giải quyết vấn đề thực bằng thiết kế và kiến trúc.",
    imageSrc: "https://images.unsplash.com/photo-1581092163144-b7ae3c00adbc?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    key: "arts",
    letter: "A",
    label: "Arts",
    color: "#FDD835",
    textColor: "#2D2D2D",
    description: "Biểu đạt ý tưởng qua thiết kế, âm nhạc và sáng tác.",
    imageSrc: "https://images.unsplash.com/photo-1548811579-017cf2a4268b?q=80&w=689&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    key: "mathematics",
    letter: "M",
    label: "Mathematics",
    color: "#7E57C2",
    textColor: "#ffffff",
    description: "Tìm quy luật ẩn trong mọi thứ và giải mã thế giới.",
    imageSrc: "https://images.unsplash.com/photo-1676302447092-14a103558511?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageSrc: "https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageSrc: "https://images.unsplash.com/photo-1582684666310-496927aa5663?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageSrc: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    imageSrc: "https://images.unsplash.com/photo-1648201637025-1c77b9be3013?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export const FINAL_CTA = {
  headline: "Sẵn sàng bắt đầu hành trình STEAM?",
  subheadline: "Đăng ký miễn phí hôm nay — không cần thẻ tín dụng.",
  ctaPrimary: { label: "Bắt đầu miễn phí", href: "/register" },
  ctaSecondary: { label: "Xem demo Portfolio", href: "/portfolio/demo" },
};
