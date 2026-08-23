/**
 * CTA desk prints — sit close behind the headline (like the Majetos sample),
 * not far corner scatter. Modest tilt; text overlays them (z-40).
 *
 * Avoid CSS translate on the motion node — GSAP owns transform.
 */

export type CtaPrintLayout = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  zIndex: number;
  rotate: number;
  className: string;
  frameClassName: string;
  slide: { x: number; y: number };
  priority?: boolean;
};

export const CTA_PRINTS: CtaPrintLayout[] = [
  {
    id: "class2",
    src: "/images/cta/class2.jpg",
    alt: "Hoạt động lớp học sáng tạo",
    width: 800,
    height: 1200,
    zIndex: 12,
    rotate: -3,
    /** Portrait — left, tucked under the bold lines */
    className: "bottom-[6%] left-[-4%] sm:left-[2%] sm:bottom-[8%] hidden sm:block",
    frameClassName: "w-[min(26vw,13.5rem)] aspect-[2/3]",
    slide: { x: -90, y: 70 },
  },
  {
    id: "class1",
    src: "/images/cta/class1.jpg",
    alt: "Học sinh thực hành STEAM",
    width: 1200,
    height: 800,
    zIndex: 11,
    rotate: 2,
    /** Landscape — right, near “BẮT ĐẦU” */
    className: "top-[16%] right-[3%] hidden sm:block lg:right-[calc(50%-26rem)]",
    frameClassName: "w-[min(32vw,16.5rem)] aspect-[3/2]",
    slide: { x: 100, y: -50 },
    priority: true,
  },
  {
    id: "class3",
    src: "/images/cta/class3.jpg",
    alt: "Dự án STEAM của học viên",
    width: 1200,
    height: 800,
    zIndex: 13,
    rotate: -4,
    /** Larger bottom-right — crops off the edge like the sample */
    className: "bottom-[-5%] right-[-6%] sm:right-[-2%]",
    frameClassName: "w-[min(55vw,21rem)] sm:w-[min(38vw,23rem)] aspect-[3/2]",
    slide: { x: 110, y: 90 },
    priority: true,
  },
];
