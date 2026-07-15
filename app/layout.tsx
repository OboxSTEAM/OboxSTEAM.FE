import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Nunito } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { SITE } from "@/lib/landing/content";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OboxSTEAM — Học STEAM, Xây Portfolio, Chinh phục Du học",
  description:
    "Nền tảng học STEAM trải nghiệm dành cho trẻ em Việt Nam. Học qua dự án thực tế, nhận chứng chỉ quốc tế và tự động tạo Portfolio AI sẵn sàng cho hồ sơ đại học nước ngoài.",
  keywords: ["STEAM", "edtech", "học trực tuyến", "portfolio du học", "robotics", "AI", "trẻ em"],
  metadataBase: new URL("https://oboxsteam.website"),
  openGraph: {
    title: "OboxSTEAM — Học STEAM, Xây Portfolio, Chinh phục Du học",
    description:
      "Nền tảng học STEAM trải nghiệm dành cho trẻ em Việt Nam. Học qua dự án thực tế và tự động tạo Portfolio AI cho hồ sơ đại học.",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: SITE.logoUrl,
        width: 512,
        height: 512,
        alt: "OboxSTEAM Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OboxSTEAM",
    description: "Học STEAM — Xây Portfolio — Chinh phục Du học",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
