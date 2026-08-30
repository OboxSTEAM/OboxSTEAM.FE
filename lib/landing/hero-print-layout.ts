/**
 * Fixed photo-print scatter for the hero desk.
 * Edit positions / rotate / slide here — no per-load randomness.
 * Keep prints in the outer band so the center text stays clear.
 */

import { landingImage } from "./assets";

export type HeroPrintLayout = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  zIndex: number;
  rotate: number;
  /** Absolute placement + breakpoint visibility. */
  className: string;
  /** Frame size (width + aspect). */
  frameClassName: string;
  /** Scroll slide-out (px) — push away from center. */
  slide: { x: number; y: number };
};

export const HERO_PRINTS: HeroPrintLayout[] = [
  {
    id: "classroom",
    src: landingImage("hero/classroom.jpg"),
    alt: "Lớp học STEAM",
    width: 1080,
    height: 720,
    zIndex: 12,
    rotate: -9,
    className: "top-[6%] left-[-4%] sm:left-[-1%] sm:top-[8%]",
    frameClassName: "w-[min(52vw,20rem)] sm:w-[min(34vw,22rem)] aspect-[3/2]",
    slide: { x: -150, y: -95 },
  },
  {
    id: "robot",
    src: landingImage("hero/robot.jpg"),
    alt: "Robot Pepper trong không gian STEAM",
    width: 980,
    height: 653,
    zIndex: 14,
    rotate: 7,
    className: "top-[4%] right-[-5%] sm:right-[0%] sm:top-[6%] hidden sm:block",
    frameClassName: "w-[min(32vw,20rem)] aspect-[3/2]",
    slide: { x: 160, y: -75 },
  },
  {
    id: "iot",
    src: landingImage("hero/iot.jpg"),
    alt: "Bo mạch và thí nghiệm IoT",
    width: 900,
    height: 600,
    zIndex: 11,
    rotate: 11,
    className: "top-[36%] left-[-8%] md:left-[-2%] hidden md:block",
    frameClassName: "w-[min(28vw,17rem)] aspect-[3/2]",
    slide: { x: -170, y: 28 },
  },
  {
    id: "play",
    src: landingImage("hero/play.jpg"),
    alt: "Trẻ em chơi và khám phá",
    width: 640,
    height: 960,
    zIndex: 13,
    rotate: -6,
    className: "top-[30%] right-[-6%] lg:right-[-1%] hidden lg:block",
    frameClassName: "w-[min(20vw,14rem)] aspect-[2/3]",
    slide: { x: 155, y: 40 },
  },
  {
    id: "coding",
    src: landingImage("hero/coding.jpg"),
    alt: "Học sinh lập trình cùng nhau",
    width: 960,
    height: 540,
    zIndex: 15,
    rotate: 5,
    className: "bottom-[8%] left-[-4%] sm:left-[1%] sm:bottom-[10%]",
    frameClassName: "w-[min(54vw,21rem)] sm:w-[min(36vw,23rem)] aspect-[16/9]",
    slide: { x: -140, y: 120 },
  },
  {
    id: "playful",
    src: landingImage("hero/playful.png"),
    alt: "Niềm vui khám phá ngoài trời",
    width: 1171,
    height: 781,
    zIndex: 16,
    rotate: -8,
    className: "bottom-[6%] right-[-4%] sm:right-[1%] sm:bottom-[8%]",
    frameClassName: "w-[min(50vw,19rem)] sm:w-[min(32vw,21rem)] aspect-[3/2]",
    slide: { x: 145, y: 115 },
  },
  {
    id: "pencil",
    src: landingImage("hero/pencil.jpg"),
    alt: "Bút chì trên bàn học",
    width: 548,
    height: 820,
    zIndex: 17,
    rotate: 14,
    className: "bottom-[20%] right-[16%] hidden xl:block",
    frameClassName: "w-[min(14vw,10rem)] aspect-[2/3]",
    slide: { x: 75, y: 105 },
  },
  {
    id: "classroom2",
    src: landingImage("hero/classroom2.jpg"),
    alt: "Hoạt động lớp học STEAM",
    width: 900,
    height: 600,
    zIndex: 10,
    rotate: -4,
    className: "top-[40%] left-[4%] hidden xl:block",
    frameClassName: "w-[min(17vw,12.5rem)] aspect-[3/2]",
    slide: { x: -100, y: 48 },
  },
];
