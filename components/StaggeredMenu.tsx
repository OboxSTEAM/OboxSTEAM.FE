"use client";

import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import type { LucideIcon } from "lucide-react";

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  /** Section label — rendered when the group changes from the previous item. */
  group?: string;
  /** Muted subtext shown below the label. */
  description?: string;
  /** Pin to panel footer with emphasized styling (e.g. logout). */
  footer?: boolean;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  isFixed: boolean;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  showHeader?: boolean;
  open?: boolean;
  onToggle?: () => void;
  externalToggleRef?: RefObject<HTMLElement | null>;
  panelHeader?: ReactNode;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = "right",
  colors = ["#F5F5F0", "#EDEDE8"],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = "/src/assets/logos/reactbits-gh-white.svg",
  menuButtonColor = "#fff",
  openMenuButtonColor = "#fff",
  changeMenuColorOnOpen = true,
  accentColor = "#5227FF",
  isFixed = false,
  closeOnClickAway = true,
  showHeader = true,
  open: controlledOpen,
  onToggle,
  externalToggleRef,
  panelHeader,
  onMenuOpen,
  onMenuClose,
}: StaggeredMenuProps) => {
  const isControlled = controlledOpen !== undefined && onToggle !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const openRef = useRef(open);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);

  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const textWrapRef = useRef<HTMLSpanElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(["Menu", "Close"]);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;

      if (!panel) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(
          preContainer.querySelectorAll(".sm-prelayer"),
        ) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === "left" ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }

      if (showHeader) {
        const plusH = plusHRef.current;
        const plusV = plusVRef.current;
        const icon = iconRef.current;
        const textInner = textInnerRef.current;
        if (!plusH || !plusV || !icon || !textInner) return;

        gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
        gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
        gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
        gsap.set(textInner, { yPercent: 0 });

        if (toggleBtnRef.current) {
          gsap.set(toggleBtnRef.current, { color: menuButtonColor });
        }
      }
    });
    return () => ctx.revert();
  }, [menuButtonColor, position, showHeader]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(
      panel.querySelectorAll(".sm-panel-itemEnter, .sm-panel-groupLabel"),
    ) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"),
    ) as HTMLElement[];
    const socialTitle = panel.querySelector(
      ".sm-socials-title",
    ) as HTMLElement | null;
    const socialLinks = Array.from(
      panel.querySelectorAll(".sm-socials-link"),
    ) as HTMLElement[];

    const offscreen = position === "left" ? -100 : 100;
    const layerStates = layers.map((el) => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 100, rotate: 4 });
    if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as string]: 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.35, ease: "power4.out" },
        i * 0.05,
      );
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.05 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.05 : 0);
    const panelDuration = 0.45;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime,
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;

      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.55,
          ease: "power4.out",
          stagger: { each: 0.06, from: "start" },
        },
        itemsStart,
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: "power2.out",
            ["--sm-num-opacity" as string]: 1,
            stagger: { each: 0.08, from: "start" },
          },
          itemsStart + 0.1,
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;

      if (socialTitle) {
        tl.to(
          socialTitle,
          { opacity: 1, duration: 0.5, ease: "power2.out" },
          socialsStart,
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: { each: 0.08, from: "start" },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: "opacity" });
            },
          },
          socialsStart + 0.04,
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();

    const offscreen = position === "left" ? -100 : 100;

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        const itemEls = Array.from(
          panel.querySelectorAll(".sm-panel-itemEnter, .sm-panel-groupLabel"),
        ) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 100, rotate: 4 });

        const numberEls = Array.from(
          panel.querySelectorAll(
            ".sm-panel-list[data-numbering] .sm-panel-item",
          ),
        ) as HTMLElement[];
        if (numberEls.length) {
          gsap.set(numberEls, { ["--sm-num-opacity" as string]: 0 });
        }

        const socialTitle = panel.querySelector(
          ".sm-socials-title",
        ) as HTMLElement | null;
        const socialLinks = Array.from(
          panel.querySelectorAll(".sm-socials-link"),
        ) as HTMLElement[];
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

        busyRef.current = false;
      },
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    if (!showHeader) return;

    const icon = iconRef.current;
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!icon || !h || !v) return;

    spinTweenRef.current?.kill();

    if (opening) {
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .to(h, { rotate: 45, duration: 0.5 }, 0)
        .to(v, { rotate: -45, duration: 0.5 }, 0);
    } else {
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: "power3.inOut" } })
        .to(h, { rotate: 0, duration: 0.35 }, 0)
        .to(v, { rotate: 90, duration: 0.35 }, 0)
        .to(icon, { rotate: 0, duration: 0.001 }, 0);
    }
  }, [showHeader]);

  const animateColor = useCallback(
    (opening: boolean) => {
      if (!showHeader) return;

      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.18,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen, showHeader],
  );

  React.useEffect(() => {
    if (!showHeader || !toggleBtnRef.current) return;

    if (changeMenuColorOnOpen) {
      const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
      gsap.set(toggleBtnRef.current, { color: targetColor });
    } else {
      gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor, showHeader]);

  const animateText = useCallback((opening: boolean) => {
    if (!showHeader) return;

    const inner = textInnerRef.current;
    if (!inner) return;

    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? "Menu" : "Close";
    const targetLabel = opening ? "Close" : "Menu";
    const cycles = 3;

    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === "Menu" ? "Close" : "Menu";
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });

    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;

    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: "power4.out",
    });
  }, [showHeader]);

  const requestClose = useCallback(() => {
    if (isControlled) {
      if (openRef.current) onToggle?.();
      return;
    }
    if (openRef.current) {
      openRef.current = false;
      setInternalOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [
    isControlled,
    onToggle,
    onMenuClose,
    playClose,
    animateIcon,
    animateColor,
    animateText,
  ]);

  const requestOpen = useCallback(() => {
    if (isControlled) {
      if (!openRef.current) onToggle?.();
      return;
    }
    if (!openRef.current) {
      openRef.current = true;
      setInternalOpen(true);
      onMenuOpen?.();
      playOpen();
      animateIcon(true);
      animateColor(true);
      animateText(true);
    }
  }, [
    isControlled,
    onToggle,
    onMenuOpen,
    playOpen,
    animateIcon,
    animateColor,
    animateText,
  ]);

  const toggleMenu = useCallback(() => {
    if (openRef.current) {
      requestClose();
    } else {
      requestOpen();
    }
  }, [requestClose, requestOpen]);

  const closeMenu = useCallback(() => {
    requestClose();
  }, [requestClose]);

  const prevControlledOpenRef = useRef(open);

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    if (!isControlled) return;

    const wasOpen = prevControlledOpenRef.current;
    if (open && !wasOpen) {
      onMenuOpen?.();
      playOpen();
      animateIcon(true);
      animateColor(true);
      animateText(true);
    } else if (!open && wasOpen) {
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
    prevControlledOpenRef.current = open;
  }, [
    open,
    isControlled,
    onMenuOpen,
    onMenuClose,
    playOpen,
    playClose,
    animateIcon,
    animateColor,
    animateText,
  ]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedPanel = panelRef.current?.contains(target);
      const clickedInternalToggle = toggleBtnRef.current?.contains(target);
      const clickedExternalToggle = externalToggleRef?.current?.contains(target);

      if (!clickedPanel && !clickedInternalToggle && !clickedExternalToggle) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu, externalToggleRef]);

  const handleItemActivate = useCallback(
    (item: StaggeredMenuItem) => {
      if (item.onClick) {
        item.onClick();
        closeMenu();
        return;
      }
      closeMenu();
    },
    [closeMenu],
  );

  const mainItems = items?.filter((item) => !item.footer) ?? [];
  const footerItems = items?.filter((item) => item.footer) ?? [];

  const groupedSections: Array<{ label: string; items: StaggeredMenuItem[] }> = [];
  for (const item of mainItems) {
    const label = item.group ?? "";
    const prev = groupedSections[groupedSections.length - 1];
    if (prev?.label === label) {
      prev.items.push(item);
    } else {
      groupedSections.push({ label, items: [item] });
    }
  }

  const itemClassName =
    "sm-panel-item relative text-[#2D2D2D] font-semibold text-base cursor-pointer tracking-tight transition-[background,color] duration-150 ease-linear flex items-center gap-3 w-full text-left bg-transparent border-0 no-underline rounded-lg px-2.5 py-2.5";

  const footerItemClassName =
    "sm-panel-footerItem relative w-full cursor-pointer rounded-xl border border-[#E94B3C]/25 bg-[#E94B3C]/8 px-4 py-3.5 text-left font-semibold text-[#E94B3C] transition-[background,border-color] duration-150 ease-linear flex items-center gap-3 no-underline hover:bg-[#E94B3C]/14 hover:border-[#E94B3C]/40";

  const renderItemContent = (item: StaggeredMenuItem, compact = false) => {
    const Icon = item.icon;
    return (
      <>
        <span className="sm-panel-itemEnter inline-block min-w-0 flex-1 [transform-origin:50%_100%] will-change-transform">
          <span className="sm-panel-itemLabel block leading-snug">{item.label}</span>
          {item.description && !compact ? (
            <span className="sm-panel-itemDesc mt-0.5 block text-sm font-normal leading-snug text-[#6B6B6B]">
              {item.description}
            </span>
          ) : null}
        </span>
        {Icon ? (
          <Icon
            className="sm-panel-itemIcon size-5 shrink-0 text-[var(--sm-accent,#E94B3C)]"
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : null}
      </>
    );
  };

  const renderNavItem = (
    item: StaggeredMenuItem,
    idx: number,
    className: string,
    compact = false,
  ) => (
    <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={`${item.label}-${idx}`}>
      {item.onClick ? (
        <button
          type="button"
          className={className}
          aria-label={item.ariaLabel}
          data-index={idx + 1}
          onClick={() => handleItemActivate(item)}
        >
          {renderItemContent(item, compact)}
        </button>
      ) : (
        <a
          className={className}
          href={item.link}
          aria-label={item.ariaLabel}
          data-index={idx + 1}
          onClick={() => handleItemActivate(item)}
        >
          {renderItemContent(item, compact)}
        </a>
      )}
    </li>
  );

  return (
    <div
      className={`sm-scope z-[60] ${isFixed ? "fixed top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none" : "w-full h-full"}`}
      aria-hidden={open ? undefined : true}
    >
      <div
        className={
          (className ? `${className} ` : "") +
          "staggered-menu-wrapper pointer-events-none relative w-full h-full z-40"
        }
        style={
          accentColor
            ? ({ ["--sm-accent" as string]: accentColor } as React.CSSProperties)
            : undefined
        }
        data-position={position}
        data-open={open || undefined}
      >
        <div
          ref={preLayersRef}
          className="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]"
          aria-hidden="true"
        >
          {(() => {
            const raw =
              colors && colors.length ? colors.slice(0, 4) : ["#F5F5F0", "#EDEDE8"];
            const arr = [...raw];
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2);
              arr.splice(mid, 1);
            }
            return arr.map((c, i) => (
              <div
                key={i}
                className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
                style={{ background: c }}
              />
            ));
          })()}
        </div>

        {showHeader ? (
          <header
            className="staggered-menu-header absolute top-0 left-0 w-full flex items-center justify-between p-[2em] bg-transparent pointer-events-none z-20"
            aria-label="Main navigation header"
          >
            <div
              className="sm-logo flex items-center select-none pointer-events-auto"
              aria-label="Logo"
            >
              <img
                src={logoUrl || "/src/assets/logos/reactbits-gh-white.svg"}
                alt="Logo"
                className="sm-logo-img block h-8 w-auto object-contain"
                draggable={false}
                width={110}
                height={24}
              />
            </div>

            <button
              ref={toggleBtnRef}
              className={`sm-toggle relative inline-flex items-center gap-[0.3rem] bg-transparent border-0 cursor-pointer font-medium leading-none overflow-visible pointer-events-auto ${
                open ? "text-black" : "text-[#e9e9ef]"
              }`}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="staggered-menu-panel"
              onClick={toggleMenu}
              type="button"
            >
              <span
                ref={textWrapRef}
                className="sm-toggle-textWrap relative inline-block h-[1em] overflow-hidden whitespace-nowrap w-[var(--sm-toggle-width,auto)] min-w-[var(--sm-toggle-width,auto)]"
                aria-hidden="true"
              >
                <span
                  ref={textInnerRef}
                  className="sm-toggle-textInner flex flex-col leading-none"
                >
                  {textLines.map((l, i) => (
                    <span className="sm-toggle-line block h-[1em] leading-none" key={i}>
                      {l}
                    </span>
                  ))}
                </span>
              </span>

              <span
                ref={iconRef}
                className="sm-icon relative w-[14px] h-[14px] shrink-0 inline-flex items-center justify-center [will-change:transform]"
                aria-hidden="true"
              >
                <span
                  ref={plusHRef}
                  className="sm-icon-line absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2 [will-change:transform]"
                />
                <span
                  ref={plusVRef}
                  className="sm-icon-line sm-icon-line-v absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2 [will-change:transform]"
                />
              </span>
            </button>
          </header>
        ) : null}

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 flex h-full flex-col overflow-hidden bg-[#FAFAF5] z-10 backdrop-blur-[12px] pointer-events-auto border-l border-[#E5E5E0]"
          style={{ WebkitBackdropFilter: "blur(12px)" }}
          data-compact={showHeader ? undefined : true}
          aria-hidden={open ? undefined : true}
        >
          <div className="sm-panel-inner flex min-h-0 flex-1 flex-col">
            {panelHeader ? (
              <div className="sm-panel-header shrink-0">{panelHeader}</div>
            ) : null}

            <div className="sm-panel-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
              {groupedSections.length ? (
                groupedSections.map((section, sectionIdx) => (
                  <section
                    className="sm-panel-section rounded-xl border border-[#E5E5E0] bg-white p-2 shadow-sm"
                    key={`${section.label}-${sectionIdx}`}
                    aria-label={section.label || undefined}
                  >
                    {section.label ? (
                      <h3 className="sm-panel-sectionTitle sm-panel-groupLabel m-0 px-2 pb-1 pt-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B] [transform-origin:50%_100%] will-change-transform">
                        {section.label}
                      </h3>
                    ) : null}
                    <ul
                      className="sm-panel-list list-none m-0 p-0 flex flex-col gap-0.5"
                      role="list"
                      data-numbering={displayItemNumbering || undefined}
                    >
                      {section.items.map((it, idx) =>
                        renderNavItem(it, sectionIdx * 100 + idx, itemClassName),
                      )}
                    </ul>
                  </section>
                ))
              ) : (
                <ul
                  className="sm-panel-list list-none m-0 p-0 flex flex-col gap-0.5"
                  role="list"
                  aria-hidden="true"
                >
                  <li className="sm-panel-itemWrap relative overflow-hidden leading-none">
                    <span className={itemClassName}>
                      <span className="sm-panel-itemEnter inline-block [transform-origin:50%_100%] will-change-transform">
                        No items
                      </span>
                    </span>
                  </li>
                </ul>
              )}
            </div>

            {footerItems.length > 0 ? (
              <div className="sm-panel-footer mt-auto shrink-0 border-t border-[#E5E5E0] pt-4">
                <ul className="list-none m-0 flex flex-col gap-2 p-0" role="list">
                  {footerItems.map((it, idx) =>
                    renderNavItem(it, 900 + idx, footerItemClassName, true),
                  )}
                </ul>
              </div>
            ) : null}

            {displaySocials && socialItems && socialItems.length > 0 ? (
              <div
                className="sm-socials mt-auto pt-8 flex flex-col gap-3"
                aria-label="Social links"
              >
                <h3 className="sm-socials-title m-0 text-base font-medium [color:var(--sm-accent,#ff0000)]">
                  Socials
                </h3>
                <ul
                  className="sm-socials-list list-none m-0 p-0 flex flex-row items-center gap-4 flex-wrap"
                  role="list"
                >
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link text-[1.2rem] font-medium text-[#111] no-underline relative inline-block py-[2px] transition-[color,opacity] duration-300 ease-linear"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <style>{`
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 2em; background: transparent; pointer-events: none; z-index: 20; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-logo-img { display: block; height: 32px; width: auto; object-fit: contain; }
.sm-scope .sm-toggle { position: relative; display: inline-flex; align-items: center; gap: 0.3rem; background: transparent; border: none; cursor: pointer; color: #e9e9ef; font-weight: 500; line-height: 1; overflow: visible; }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid #ffffffaa; outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-line:last-of-type { margin-top: 6px; }
.sm-scope .sm-toggle-textWrap { position: relative; margin-right: 0.5em; display: inline-block; height: 1em; overflow: hidden; white-space: nowrap; width: var(--sm-toggle-width, auto); min-width: var(--sm-toggle-width, auto); }
.sm-scope .sm-toggle-textInner { display: flex; flex-direction: column; line-height: 1; }
.sm-scope .sm-toggle-line { display: block; height: 1em; line-height: 1; }
.sm-scope .sm-icon { position: relative; width: 14px; height: 14px; flex: 0 0 14px; display: inline-flex; align-items: center; justify-content: center; will-change: transform; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1.3; padding-bottom: 0.08em; }
.sm-scope .sm-icon-line { position: absolute; left: 50%; top: 50%; width: 100%; height: 2px; background: currentColor; border-radius: 2px; transform: translate(-50%, -50%); will-change: transform; }
.sm-scope .sm-line { display: none !important; }
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: clamp(280px, 32vw, 380px); height: 100%; background: #FAFAF5; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; padding: 6em 2em 2em 2em; overflow: hidden; z-index: 10; border-left: 1px solid #E5E5E0; }
.sm-scope .staggered-menu-panel[data-compact] { padding: 5rem 1.5rem 1.25rem 1.5rem; }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; border-left: none; border-right: 1px solid #E5E5E0; }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: clamp(280px, 32vw, 380px); pointer-events: none; z-index: 5; }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1rem; min-height: 0; }
.sm-scope .sm-panel-body { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; min-height: 0; overflow-y: auto; }
.sm-scope .sm-panel-section { background: #FFFFFF; border: 1px solid #E5E5E0; border-radius: 0.75rem; padding: 0.5rem; box-shadow: 0 1px 2px rgba(45, 45, 45, 0.04); }
.sm-scope .sm-panel-sectionTitle { margin: 0; padding: 0.125rem 0.5rem 0.375rem; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6B6B6B; }
.sm-scope .sm-panel-footer { margin-top: auto; flex-shrink: 0; padding-top: 1rem; border-top: 1px solid #E5E5E0; }
.sm-scope .sm-panel-footerItem { width: 100%; display: flex; align-items: center; gap: 0.75rem; border-radius: 0.75rem; border: 1px solid rgba(233, 75, 60, 0.25); background: rgba(233, 75, 60, 0.08); padding: 0.875rem 1rem; font-weight: 600; color: #E94B3C; text-decoration: none; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
.sm-scope .sm-panel-footerItem .sm-panel-itemIcon { color: #E94B3C; opacity: 1; }
.sm-scope .sm-panel-footerItem:hover { background: rgba(233, 75, 60, 0.14); border-color: rgba(233, 75, 60, 0.4); }
.sm-scope .sm-panel-footerItem:focus-visible { outline: 2px solid var(--sm-accent, #E94B3C); outline-offset: 2px; }
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 1rem; font-weight: 500; color: var(--sm-accent, #ff0000); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity 0.3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: 0.35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, #ff0000); outline-offset: 3px; }
.sm-scope .sm-socials-link { font-size: 1.2rem; font-weight: 500; color: #111; text-decoration: none; position: relative; padding: 2px 0; display: inline-block; transition: color 0.3s ease, opacity 0.3s ease; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-title { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; text-transform: uppercase; }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.sm-scope .sm-panel-item { position: relative; color: #2D2D2D; font-weight: 600; cursor: pointer; line-height: 1.35; letter-spacing: -0.01em; transition: background 0.15s, color 0.15s; display: flex; align-items: center; gap: 0.75rem; text-decoration: none; border-radius: 0.5rem; padding: 0.625rem 0.5rem; }
.sm-scope .sm-panel-itemEnter { display: inline-block; will-change: transform; transform-origin: 50% 100%; }
.sm-scope .sm-panel-itemLabel { display: block; }
.sm-scope .sm-panel-itemDesc { display: block; margin-top: 0.125rem; font-size: 0.875rem; font-weight: 400; line-height: 1.35; color: #6B6B6B; }
.sm-scope .sm-panel-groupLabel { display: block; will-change: transform; transform-origin: 50% 100%; }
.sm-scope .sm-panel-itemIcon { flex-shrink: 0; opacity: 0.75; transition: opacity 0.15s, color 0.15s; }
.sm-scope .sm-panel-item:hover { background: #F5F5F0; color: #2D2D2D; }
.sm-scope .sm-panel-item:hover .sm-panel-itemIcon { opacity: 1; }
.sm-scope .sm-panel-item:focus-visible { outline: 2px solid var(--sm-accent, #E94B3C); outline-offset: 2px; }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: 0.1em; right: 3.2em; font-size: 18px; font-weight: 400; color: var(--sm-accent, #ff0000); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
@media (max-width: 1024px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; } .sm-scope .staggered-menu-wrapper[data-open] .sm-logo-img { filter: invert(100%); } }
@media (max-width: 640px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; } .sm-scope .staggered-menu-wrapper[data-open] .sm-logo-img { filter: invert(100%); } }
      `}</style>
    </div>
  );
};

export default StaggeredMenu;
