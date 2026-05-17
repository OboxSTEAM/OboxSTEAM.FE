import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oboxsteam-bucket.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
      {
        // Unsplash — STEAM / landing photography
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Placeholder images for layout testing — remove when real photos are added
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        // Avatar placeholders used by ChromaGrid portfolio and testimonials
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
