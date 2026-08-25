/**
 * content.ts — Static typed content for the lean 5-section landing page.
 * Edit text here without touching JSX. All copy is in Vietnamese.
 */

export const SITE = {
  name: "OboxSTEAM",
  tagline: "Khám phá. Sáng tạo. Tỏa sáng.",
  logoUrl: "https://oboxsteam-bucket-main.s3.ap-southeast-1.amazonaws.com/Seed/Material/logo-obox.png",
} as const;

export const NAV_LINKS = [
  { label: "STEAM", href: "#steam" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Chương trình", href: "#programs" },
] as const;

export const HERO = {
  /** Two-line lockup — bold sans then italic serif, like the reference. */
  headlineLine1: "Con cứ sáng tạo,",
  headlineLine2: "OboxSTEAM dựng hành trình.",
  subheadline:
    "Học qua dự án thực tế, xây dựng Portfolio cho hành trình du học.",
  primaryCta: { label: "Đăng ký miễn phí", href: "/register" },
  secondaryCta: { label: "Xem chương trình", href: "#programs" },
  deskTextureSrc: "/images/hero/desk-texture.jpg",
} as const;


export const PARTNER_BRANDS = [
  {
    id: "mit",
    name: "MIT",
    href: "https://www.mit.edu",
    ariaLabel: "MIT Open Learning",
    className: "font-serif font-bold tracking-tight",
  },
  {
    id: "lego",
    name: "LEGO",
    href: "https://education.lego.com",
    ariaLabel: "LEGO Education",
    className: "font-heading font-black tracking-[0.2em]",
  },
  {
    id: "nasa",
    name: "NASA",
    href: "https://www.nasa.gov/stem",
    ariaLabel: "NASA STEM",
    className: "font-heading font-bold tracking-[0.35em]",
  },
  {
    id: "arduino",
    name: "Arduino",
    href: "https://www.arduino.cc/education",
    ariaLabel: "Arduino Education",
    className: "font-mono font-semibold tracking-tight",
  },
  {
    id: "scratch",
    name: "Scratch",
    href: "https://scratch.mit.edu",
    ariaLabel: "Scratch",
    className: "font-heading font-bold italic",
  },
  {
    id: "khan",
    name: "Khan Academy",
    href: "https://www.khanacademy.org",
    ariaLabel: "Khan Academy",
    className: "font-heading font-semibold tracking-tight",
  },
] as const;

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
  eyebrow: "PORTFOLIO · HÀNH TRÌNH CỦA CON",
  headline: "Học thật — kể lại thành một portfolio riêng.",
  subheadline:
    "OboxSTEAM gom ảnh lớp, clip buổi học và chứng chỉ vào một trang portfolio. Phụ huynh theo dõi được; con có hồ sơ mang đi nộp khi cần.",
  features: [
    {
      id: "face-detection",
      iconName: "ScanFace",
      tabLabel: "Ảnh lớp",
      label: "AI nhận diện khuôn mặt",
      desc: "Ảnh buổi học tự gắn đúng từng bạn",
      body: "Mentor chụp ảnh lớp xong là xong. AI nhận ra từng học viên và đưa ảnh vào portfolio của đúng người — không cần phụ huynh hay thầy cô cắt dán tay.",
      imageSrc: "/images/universe/face-detection.png",
      accent: "#E94B3C",
    },
    {
      id: "highlight-video",
      iconName: "Video",
      tabLabel: "Video",
      label: "Clip highlight cá nhân",
      desc: "Tách clip ngắn của từng bạn từ footage lớp",
      body: "Buổi lab dài được cắt thành clip ngắn của từng em. Xem nhanh trên điện thoại, hoặc gắn vào portfolio khi cần kể câu chuyện học tập.",
      imageSrc: "/images/universe/highlight-video.png",
      accent: "#7CB342",
    },
    {
      id: "certificates",
      iconName: "Award",
      tabLabel: "Chứng chỉ",
      label: "Chứng chỉ điện tử",
      desc: "Hoàn thành là có chứng chỉ để xác minh",
      body: "Xong chương trình, con nhận chứng chỉ điện tử kèm mã kiểm tra. Phụ huynh, trường hay hội đồng tuyển sinh đều mở link xác minh được — rồi đưa thẳng vào portfolio.",
      imageSrc: "/images/universe/certificate.png",
      accent: "#7E57C2",
    },
    {
      id: "personal-subdomain",
      iconName: "Globe",
      tabLabel: "obox.id",
      label: "Trang portfolio riêng",
      desc: "Một đường link tên.obox.id để chia sẻ",
      body: "Mỗi học viên có một trang mang tên mình trên obox.id. Gửi một link là đủ — không phải xuất PDF mới mỗi lần nộp hồ sơ.",
      imageSrc: "/images/universe/portfolio.png",
      accent: "#4FC3F7",
    },
  ] as const,
  ctaLabel: "Xem Portfolio mẫu",
  ctaHref: "/portfolio/demo",
};

export const CTA_DESK_SECTION = {
  /** Single-line caps lockup + italic serif support. */
  headline: "ĐÃ ĐẾN LÚC BẮT ĐẦU",
  headlineSupport: "hành trình STEAM cùng con",
  primaryCta: { label: "Đăng ký miễn phí", href: "/register" },
  secondaryCta: { label: "Xem chương trình", href: "#programs" },
  deskTextureSrc: "/images/hero/desk-texture.jpg",
} as const;

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
