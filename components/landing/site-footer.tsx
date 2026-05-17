import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { SITE, STEAM_CATEGORIES } from "@/lib/landing/content";

const FOOTER_LINKS = {
  "Chương trình": [
    { label: "Tất cả chương trình", href: "/courses" },
    { label: "Robotics & AI", href: "/courses/robotics-ai" },
    { label: "Khoa học Xanh", href: "/courses/green-science" },
    { label: "Creative Coding", href: "/courses/creative-coding" },
    { label: "Toán tư duy", href: "/courses/math-logic" },
  ],
  "Nền tảng": [
    { label: "Portfolio AI", href: "/portfolio" },
    { label: "Học trực tuyến", href: "/learn" },
    { label: "Chứng chỉ", href: "/certificates" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  "Về chúng tôi": [
    { label: "Giới thiệu", href: "/about" },
    { label: "Mentor", href: "/mentors" },
    { label: "Tuyển dụng", href: "/careers" },
    { label: "Liên hệ", href: "/contact" },
  ],
};

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#2D2D2D] text-[#FAFAF5]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand block */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Image
                src={SITE.logoUrl}
                alt="OboxSTEAM logo"
                width={40}
                height={40}
                className="object-contain brightness-0 invert"
              />
              <span className="font-heading font-bold text-lg text-white">OboxSTEAM</span>
            </Link>
            <p className="text-sm text-[#FAFAF5]/60 leading-relaxed max-w-xs">
              Nền tảng học STEAM trải nghiệm — nơi mỗi bài học tạo ra một tác phẩm, mỗi tác phẩm xây nên hành trình du học.
            </p>

            {/* STEAM colour strip */}
            <div className="flex gap-1.5 mt-6">
              {STEAM_CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: cat.color }}
                  aria-label={cat.label}
                />
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-heading font-semibold text-sm text-white mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#FAFAF5]/60 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-white/10 mb-6" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAFAF5]/40">
          <p>© {year} OboxSTEAM. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
