---
name: styling-rule
description: UI Styling Guide & Ruleset. Load when working on colors, typography, UI components, layout, and visual design.
globs: "**/*.{ts,tsx}"
---

# TripTogether - UI Styling Guide & Ruleset

## Overview

OboxSTEAM is a modern STEAM learning platform designed to inspire children to explore Science, Technology, Engineering, Arts, and Mathematics with curiosity and creativity. The platform combines course learning (like Coursera) with a portfolio builder to help students design their study abroad journey.

---

## Brand Personality

- **Curious**: Encourages exploration and asking "why?"
- **Playful**: Learning should be fun and engaging
- **Empowering**: Students build their own knowledge journey
- **Modern**: Clean, contemporary design that feels fresh
- **Inclusive**: Welcoming to all learners regardless of background

---

## Color Palette

Derived from the OboxSTEAM logo featuring a colorful pinwheel/telescope design.

### Primary Brand Colors

- **Obox Red** (#E94B3C): Primary CTAs, Science category, alerts
- **Obox Green** (#7CB342): Success states, Technology category, progress indicators
- **Obox Yellow** (#FDD835): Highlights, Arts category, achievements and celebrations
- **Obox Cyan** (#4FC3F7): Links, Engineering category, informational elements
- **Obox Purple** (#7E57C2): Mathematics category, premium features

### Neutral Colors

- **Cream** (#FAFAF5): Primary background color, matches logo background warmth
- **Off-White** (#F5F5F0): Card backgrounds, alternate sections
- **Warm Gray** (#6B6B6B): Body text
- **Charcoal** (#2D2D2D): Headings, primary text
- **White** (#FFFFFF): Cards, modals, clean spaces

### Semantic Token Mapping

- background: Cream
- foreground: Charcoal
- card: White
- card-foreground: Charcoal
- primary: Obox Red
- primary-foreground: White
- secondary: Off-White
- secondary-foreground: Charcoal
- muted: Off-White
- muted-foreground: Warm Gray
- accent: Obox Cyan
- accent-foreground: White
- destructive: Obox Red
- border: #E5E5E0 (light warm gray)
- ring: Obox Cyan
- radius: 1rem (16px for that friendly, rounded feel)

### STEAM Category Colors

Each discipline should use its designated color for category badges, progress bars, and accents:
- Science: Obox Red
- Technology: Obox Green
- Engineering: Obox Cyan
- Arts: Obox Yellow
- Mathematics: Obox Purple

---

## Typography

### Font Families

- **Headings**: Nunito - A rounded, friendly sans-serif that conveys warmth and approachability. Suitable for a children's learning platform.
- **Body**: Inter - Excellent readability for extended reading, clean and modern.
- **Code/Data**: JetBrains Mono - For any code snippets or data displays in STEM courses.

### Type Scale

- **Display**: 4rem (64px), line-height 1.1, weight 800. Use for hero headlines.
- **H1**: 3rem (48px), line-height 1.2, weight 700. Page titles.
- **H2**: 2.25rem (36px), line-height 1.25, weight 700. Section headings.
- **H3**: 1.5rem (24px), line-height 1.3, weight 600. Subsection headings.
- **H4**: 1.25rem (20px), line-height 1.4, weight 600. Card titles.
- **Body Large**: 1.125rem (18px), line-height 1.6. Intro paragraphs.
- **Body**: 1rem (16px), line-height 1.6. Standard body text.
- **Body Small**: 0.875rem (14px), line-height 1.5. Captions, metadata.
- **Caption**: 0.75rem (12px), line-height 1.4. Timestamps, labels.

### Typography Guidelines

- Use text-balance on headlines to prevent awkward line breaks
- Headings should feel bold and confident without being aggressive
- Body text prioritizes comfort for young readers doing extended reading
- Maintain generous line-height (1.5-1.6) for readability

---

## Spacing System

Based on an 8px grid. Use Tailwind's spacing scale:
- space-1 (4px): Tight spacing within components
- space-2 (8px): Small gaps between related elements
- space-3 (12px): Compact component padding
- space-4 (16px): Default spacing
- space-6 (24px): Section padding, card padding
- space-8 (32px): Large gaps between sections
- space-12 (48px): Major section breaks
- space-16 (64px): Page section separation
- space-24 (96px): Hero section vertical spacing

---

## Border Radius

Rounded, friendly shapes matching the playful brand:
- Small (8px): Buttons, inputs, badges
- Medium (12px): Small cards, dropdown menus
- Large (16px): Course cards, content containers
- Extra Large (24px): Hero sections, feature cards, modals
- Full (9999px): Pills, avatars, circular badges

---

## Iconography

### Philosophy

Use icons sparingly and purposefully. The design should rely primarily on typography, color, and whitespace rather than icons. Icons should enhance understanding, not decorate.

### When to Use Icons

- Navigation items (keep minimal)
- Action buttons where text alone is ambiguous
- Status indicators (success, error, progress)
- Category identification when space is limited

### When NOT to Use Icons

- Decorative filler
- Every list item or menu option
- Where text alone is clear enough
- Multiple icons in close proximity (creates visual noise)

### Icon Library

Use Lucide React exclusively. Choose icons that are:
- Simple and recognizable
- Consistent in visual weight (2px stroke)
- 20px or 24px size for most uses
- Category-colored only when representing STEAM subjects

### Recommended Lucide Icons for Key Actions

- Navigation: Menu, X, ChevronRight, ArrowLeft
- User: User, Settings, LogOut
- Learning: BookOpen, Play, CheckCircle, Clock
- Portfolio: FolderOpen, FileText, Download, Share2
- Progress: Trophy, Star, TrendingUp
- Search and Filter: Search, Filter, SlidersHorizontal

---

## Component Design Principles

### Cards

Course cards and content cards are the primary building blocks. They should:
- Use white backgrounds with subtle box shadows (not borders)
- Have generous padding (24px)
- Display a small colored accent (top border or badge) indicating STEAM category
- Include clear visual hierarchy: thumbnail, title, description, metadata, CTA
- Lift slightly on hover (translateY -4px) with shadow increase
- Use 16px border radius for that friendly feel

### Buttons

- **Primary**: Solid Obox Red background, white text. Used for main CTAs like "Start Learning" or "Sign Up"
- **Secondary**: Off-White background, Charcoal text. For secondary actions
- **Outline**: Transparent with border, for tertiary actions
- **Ghost**: No background, text only with subtle hover state. For navigation and subtle actions
- **Category buttons**: Use the relevant STEAM category color for category-specific CTAs

All buttons should have:
- Minimum height of 44px (accessibility)
- Horizontal padding of 24px minimum
- 8px border radius
- Subtle scale (1.02) and brightness increase on hover
- Clear focus rings for keyboard navigation

### Navigation

Header should be:
- Sticky with backdrop blur effect
- Clean and minimal with logo on left
- Primary navigation links centered or to the right of logo
- User avatar and notifications on far right
- Cream/transparent background becoming solid on scroll

Mobile navigation:
- Hamburger menu triggering full-screen overlay
- Large touch targets (minimum 44px)
- Clear visual hierarchy in menu items

### Progress Indicators

Critical for a learning platform. Display progress using:
- Horizontal progress bars with category colors
- Circular progress rings for overall completion
- Step indicators for multi-part courses
- Numerical percentages alongside visual progress
- Checkmarks for completed items (use Lucide Check or CheckCircle)

### Forms and Inputs

- Large, comfortable input fields (minimum 48px height)
- Clear labels above inputs (not placeholder-only)
- Helpful hint text below inputs
- Cyan focus rings
- Red for error states with clear error messages
- Green checkmarks for validated fields

---

## STEAM Category System

Each discipline has a distinct identity through color and concept, not icons:

### Science (Red)
- Theme: Experimentation and discovery
- Visual approach: Use red accents, consider subtle molecular or bubble patterns in backgrounds
- Tone: Curious, questioning, exploratory

### Technology (Green)  
- Theme: Innovation and building
- Visual approach: Use green accents, consider pixel or circuit-inspired subtle patterns
- Tone: Creative, forward-thinking, constructive

### Engineering (Cyan)
- Theme: Problem-solving and construction
- Visual approach: Use cyan accents, consider blueprint or geometric patterns
- Tone: Logical, methodical, hands-on

### Arts (Yellow)
- Theme: Expression and creativity
- Visual approach: Use yellow accents, consider organic or painterly subtle textures
- Tone: Expressive, imaginative, free

### Mathematics (Purple)
- Theme: Logic and patterns
- Visual approach: Use purple accents, consider graph or number-inspired subtle patterns
- Tone: Precise, pattern-seeking, analytical

---

## Page Descriptions

### Homepage

The homepage should immediately communicate the platform's purpose and inspire exploration.

**Hero Section**: Full-width section with cream background. Large display headline like "Discover. Create. Achieve." with a supporting subheadline about building STEAM journeys. Two CTAs: primary "Get Started Free" button and secondary "Explore Courses" button. The hero can incorporate the brand's geometric pattern elements from the background asset as decorative borders or subtle background textures.

**Featured Categories**: A section showing the five STEAM categories. Each category is represented by its color and a brief description. Clicking leads to filtered course listings. This should feel like choosing an adventure path.

**Popular Courses**: A grid of 4-8 course cards showcasing diverse subjects. Each card shows thumbnail, title, category badge (colored), brief description, and student count.

**How It Works**: Simple 3-step explanation of the platform: 1) Explore courses 2) Build your portfolio 3) Achieve your goals. Use minimal illustration or the brand mascots if appropriate.

**Social Proof**: Brief testimonials from students or parents. Keep it authentic and age-appropriate.

**CTA Section**: Final call-to-action encouraging sign-up with the value proposition reinforced.

### Course Catalog

A browseable, filterable listing of all courses.

**Header**: Page title "Explore Courses" with a prominent search input.

**Filters**: Horizontal filter bar or sidebar with options for:
- STEAM category (all five, with category colors)
- Age group (6-8, 9-12, 13+)
- Difficulty level (Beginner, Intermediate, Advanced)
- Duration (Short, Medium, Long)
- Sort by (Popular, Newest, Highest Rated)

**Course Grid**: Responsive grid of course cards. 1 column on mobile, 2 on tablet, 3-4 on desktop. Each card includes thumbnail, category badge, title, short description, rating, student count, and a CTA.

**Empty State**: If filters return no results, show a friendly message encouraging broader search with a clear way to reset filters.

### Course Detail Page

Dedicated page for a single course with all enrollment information.

**Hero**: Course thumbnail or video preview, title, category badge, instructor name, rating, enrollment count, and primary "Start Course" or "Continue Learning" button.

**Overview Tab**: Course description, learning objectives, prerequisites, what students will create.

**Curriculum Tab**: Expandable list of modules and lessons. Show completed items with checkmarks, current item highlighted, locked items for sequential courses.

**Reviews Tab**: Student reviews and ratings with filtering options.

**Sidebar**: Sticky sidebar (on desktop) with enrollment CTA, course details (duration, difficulty, certificate info), and share options.

### Portfolio Builder

Where students construct their study abroad application portfolio.

**Profile Section**: Photo upload area, name, age, grade level, dream school input, and personal bio textarea.

**STEAM Journey**: Visual progress display showing completion percentage in each of the five categories. Use horizontal progress bars in category colors. Show total courses completed per category.

**Achievements**: Grid or horizontal scroll of earned badges and certificates. Each shows the achievement name, date earned, and related course. Include a way to view/download certificates.

**Projects Section**: Gallery of student-created projects. Each project card shows thumbnail, title, description, related courses/skills, and date. Include an "Add Project" action for uploading new work.

**Export/Share**: Options to generate a PDF portfolio or share a public portfolio link for university applications.

### Student Dashboard

The logged-in student's home base.

**Welcome Header**: Personalized greeting with student name and a motivational message.

**Continue Learning**: Prominent section showing in-progress courses with progress bars. Quick resume functionality.

**Recommended Courses**: AI-suggested courses based on interests and history.

**Weekly Goals**: Progress toward weekly learning goals. Use progress rings or bars.

**Recent Achievements**: Latest badges or certificates earned with celebratory styling (but not overwhelming).

**Quick Links**: Access to portfolio, saved courses, settings.

---

## Animation and Motion

### Principles

- **Purposeful**: Animations guide attention and provide feedback, never just decoration
- **Subtle**: Light, gentle movements that delight without distracting
- **Quick**: Interaction animations under 200ms, transitions under 300ms
- **Respectful**: Honor prefers-reduced-motion media query

### Standard Animations

- **Button hover**: Slight scale (1.02) and brightness increase over 150ms
- **Card hover**: Lift effect (translateY -4px) with shadow increase over 200ms
- **Page transitions**: Fade with subtle upward slide over 300ms
- **Progress bars**: Fill animation with ease-out timing over 500ms
- **Modal entrance**: Fade in with scale from 0.95 over 200ms
- **Achievement unlock**: Gentle bounce with optional confetti over 600ms

### Loading States

- Use skeleton loaders matching content layout
- Subtle pulse animation on skeletons
- Avoid spinner overuse - skeletons are preferred for content areas
- Client filter/pagination refetches: use `useClientFetch` + `DEFAULT_MIN_SKELETON_MS` (420ms min visibility) — see `nextjs-engineering-rule.mdc` *Client fetch + skeleton loading*

---

## Imagery Guidelines

### Photography

When using photos of students:
- Show diverse children engaged in active learning
- Bright, well-lit, natural settings
- Collaborative and curious moments
- Colors should complement the brand palette

### Illustrations

- The brand mascots (from bg.jpg) can be used sparingly for empty states, onboarding, and celebrations
- Geometric patterns from brand assets can be used as decorative borders or background textures
- Keep illustrations supportive, not dominant

### Placeholder Strategy

During development, use placeholder images with dimensions specified. Prefer geometric placeholder backgrounds over generic stock photos.

---

## Responsive Design

### Breakpoints

- Mobile: Below 640px
- Tablet: 640px to 1024px
- Desktop: Above 1024px
- Large Desktop: Above 1280px

### Mobile Considerations

- Single column layouts
- Hamburger navigation
- Larger touch targets (minimum 44px)
- Simplified filters (collapsible or modal-based)
- Bottom navigation bar for key actions (optional)

### Tablet Considerations

- Two-column grids where appropriate
- May show partial navigation or hamburger depending on content
- Sidebar filters collapse to horizontal or modal

### Desktop Considerations

- Full navigation visible
- Multi-column grids (3-4 cards)
- Sticky sidebars where helpful
- More information density acceptable

---

## Accessibility Requirements

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text. All brand colors have been selected to meet contrast requirements on cream backgrounds.
- **Focus States**: Visible focus rings using cyan accent color on all interactive elements.
- **Keyboard Navigation**: Full keyboard accessibility for all features.
- **Screen Readers**: Semantic HTML, proper heading hierarchy, ARIA labels where needed, alt text on all meaningful images.
- **Motion Sensitivity**: Respect prefers-reduced-motion by reducing or removing animations.
- **Touch Targets**: Minimum 44x44px for all interactive elements.

### Child-Friendly Considerations

- Simple, clear language throughout
- Visual feedback for all actions
- Celebratory (but not overwhelming) feedback for achievements
- Progress indicators to maintain motivation
- Parent/guardian access options for younger users

---

## Dark Mode (Future Enhancement)

When implementing dark mode:
- Background: #1A1A1A
- Foreground: #FAFAFA  
- Card: #2D2D2D
- Muted: #3D3D3D
- Border: #3D3D3D
- Brand colors adjusted for dark backgrounds with slightly increased saturation and lightness

---

## Brand Assets Reference

- **Primary Logo**: logo.jpg - Colorful pinwheel/telescope design with five colored pieces (red, green, yellow, cyan, purple) on cream background
- **Pattern Background**: bg.jpg - Geometric border pattern with STEAM mascot characters

Logo usage rules:
- Minimum height: 32px
- Clear space equal to one puzzle piece height
- Do not rotate, stretch, recolor, or add effects
- Use on light backgrounds (cream or white)

---

## Implementation Notes

### Recommended Stack

- Framework: Next.js with App Router
- Styling: Tailwind CSS with custom design tokens defined in globals.css
- Components: shadcn/ui as base, customized to match brand
- Icons: Lucide React (use sparingly)
- Animations: CSS transitions for simple effects, Framer Motion for complex sequences
- Charts: Recharts for progress visualizations and analytics

### Key Custom Components to Build

- CourseCard: Reusable card for course listings
- CategoryBadge: Small colored badge indicating STEAM category
- ProgressBar: Horizontal progress with category color support
- ProgressRing: Circular progress for dashboard overviews
- AchievementCard: Display for earned badges and certificates
- PortfolioSection: Modular sections for portfolio builder

---

*This design system prioritizes clarity, warmth, and inspiration. The goal is to make students feel curious and capable, not overwhelmed by visual complexity.*

**Version**: 1.1  
**Last Updated**: May 2026  
**Brand**: OboxSTEAM

---

## Surface Hierarchy

Four named surface modes — only one may be used at a time in a given section:

| Token | Color | Usage |
|-------|-------|-------|
| `surface-cream` | `#FAFAF5` | Default for all sections unless specified |
| `surface-white` | `#FFFFFF` | Cards and modal layers on cream |
| `surface-off-white` | `#F5F5F0` | Alternating sections for gentle visual rhythm |
| `surface-charcoal` | `#2D2D2D` | **Max one per page** — the cinematic "STEAM Universe" moment |

Rules:
- All sections default to `surface-cream`.
- `surface-charcoal` may only appear once per page. It is the dramatic contrast moment.
- Never stack `surface-charcoal` sections back-to-back.
- On `surface-charcoal`, text color flips to `#FAFAF5`; use the white/cream logo variant (see Logo on Dark Background section).

---

## Display Typography Stance

Extends the base type scale for large-format, poster-style layouts:

### Poster Display
- Font: Nunito 800
- Size: `clamp(3rem, 8vw, 7rem)` — fluid, fills the viewport width gracefully
- Tracking: `tracking-tight` (`-0.025em`)
- Leading: `0.95` — tighter than the base scale for maximum visual impact
- Alignment: `text-balance` to prevent widow lines

### Eyebrow Chip
- Font: JetBrains Mono 12px
- Case: UPPERCASE
- Letter-spacing: `0.18em`
- Shape: pill (`rounded-full`)
- Background: Off-White `#F5F5F0` on light surfaces; White/10 on `surface-charcoal`
- Use: precedes a headline to set category, date, or status context (e.g. "STEAM · 2026 · BETA")

### Word-Cycle Rule
When using `RotatingText` inside a headline:
- Cycle 3–4 verbs only, each ≤ 8 characters.
- Approved word sets: `["Khám phá", "Sáng tạo", "Tỏa sáng", "Bứt phá"]` (Vietnamese) / `["Discover", "Build", "Share", "Achieve"]` (English).
- Animation: 3D rotate/flip transition, 2.5s interval.

---

## STEAM Palette Combinations

Approved gradient and color-pair combinations for sections, badges, and decorative elements. Never invent new combinations outside this list.

| Name | Colors | Allowed In |
|------|--------|------------|
| Warm pair | Red → Yellow | Hero skeleton, Science/Arts dual badges |
| Cool pair | Cyan → Purple | Engineering/Math features, footer tint |
| Growth pair | Green → Cyan | Technology/Engineering progress bars |
| Full STEAM rainbow | Red → Green → Cyan → Yellow → Purple | Hero decoration only (corner marks, logo ring) |
| Charcoal + Full STEAM | Dark bg + rainbow tint | `surface-charcoal` Aurora shader section only |

The rainbow gradient in CSS (for hero decoration):
```css
linear-gradient(135deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)
```

---

## Image Slot System

Every visual zone on the landing page is a reserved `ImageSlot` component. This decouples layout from real photography — images can be dropped in later without changing component structure.

### Canonical Aspect Ratios — Standard Set

| Ratio | Tailwind class | Primary uses |
|-------|---------------|--------------|
| `16:9` | `aspect-video` | Hero banners, "How it Works" step thumbnails, cinematic section banner |
| `1:1` | `aspect-square` | Mentor / student / parent portraits, testimonial avatars |
| `4:3` | `aspect-[4/3]` | Course card thumbnails, program cards, STEAM strip insets |
| `3:4` | `aspect-[3/4]` | Role cards (For Parents / For Schools / For Mentors), tall editorial portraits |

### ImageSlot Component Contract

Props:
```ts
type ImageSlotProps = {
  ratio: "16:9" | "1:1" | "4:3" | "3:4";
  src?: string;        // optional; shows skeleton when absent
  alt: string;
  tone?: "science" | "technology" | "engineering" | "arts" | "mathematics" | "neutral";
  className?: string;
  sizes?: string;      // next/image sizes hint
};
```

Behaviour:
- **With `src`**: renders `next/image` with `fill`, `sizes`, and `object-cover`.
- **Without `src` in development**: renders a dashed 2px border in the `tone` STEAM color, with a centred label `"16:9 · drop image here"` in `font-mono text-xs`.
- **Without `src` in production**: renders a solid Off-White rectangle, no label.
- The outer `<div>` carries the aspect-ratio class and `relative overflow-hidden rounded-2xl`.

### Image Naming Convention
Place real images under `public/images/` using the pattern:
```
public/images/{section}-{slot}-{descriptor}.webp
```
Example: `public/images/hero-main-classroom.webp`

---

## Motion Library — React Bits Mapping

All components are installed from the `@react-bits` registry, TypeScript + Tailwind variant (`-TS-TW`).

### Landing Page Zone → Component

| Zone | Component | Notes |
|------|-----------|-------|
| Navigation | `PillNav` | Sliding pill indicator |
| Hero word-cycle | `RotatingText` | 3D flip, 2.5s interval |
| Hero supporting copy | `SplitText` | Staggered character entrance |
| Cinematic shader | `Aurora` | **Charcoal section only**; tinted with STEAM rainbow |
| Section scroll reveals | `AnimatedContent` + `ScrollReveal` | Fade + upward slide, threshold 0.2 |
| Impact stats | `CountUp` | Ease-out, triggers on scroll into view |
| "Why OboxSTEAM" bento | `MagicBento` | 3 expanding tiles |
| Partner school strip | `LogoLoop` | Continuous marquee, pause on hover |
| STEAM category cards | `TiltedCard` | 3D tilt on pointer |
| Featured programs | `CardSwap` | Animated stack swap |
| Portfolio showcase | `ChromaGrid` | Grayscale → color on hover |
| Role cards | `SpotlightCard` | Cursor-gradient illumination |
| CTA border | `BorderGlow` | Mesh-gradient glow tracking cursor |
| CTA click delight | `ClickSpark` | Particle burst on button click |
| Shiny labels | `ShinyText` | Metallic sheen on eyebrow chips |

### Forbidden on This Page

The following React Bits components must **not** be used on any page targeting children and parents (too edgy, distracting, or inaccessible):

`BlobCursor`, `GhostCursor`, `TargetCursor`, `Crosshair`, `Hyperspeed`, `LetterGlitch`, `FaultyTerminal`, `DecryptedText`, `EvilEye`, `ASCIIText`, `DarkVeil`, `Dither`, `FaultyTerminal`

---

## Reduced-Motion Fallback Policy

Every animated component must degrade gracefully for users with `prefers-reduced-motion: reduce`.

### Implementation Pattern

```tsx
"use client";
import { useEffect, useState } from "react";

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduce;
}

// Usage in a section:
export function UniverseSection() {
  const reduce = useReducedMotion();
  return reduce ? <StaticUniverseSection /> : <AuroraUniverseSection />;
}
```

### Shader / WebGL Components
- `Aurora` → static gradient `background: linear-gradient(135deg, ...)` using STEAM rainbow.
- `CardSwap` → static grid of cards, no animation.
- `TiltedCard` → flat card, `transform: none`.

### Text Animation Components
- `RotatingText` → static text showing the first word only.
- `SplitText` → text visible immediately, no stagger.
- `CountUp` → static final number, no count animation.

---

## Logo on Dark Background

Single exception to the existing "light backgrounds only" logo rule:

In `surface-charcoal` sections, display the OboxSTEAM logo with a **white overlay applied via CSS** (`filter: brightness(0) invert(1)`) or use a pre-exported white variant. The coloured pinwheel pieces should remain visible against dark; only the wordmark (if separate) goes white.

Specific rules:
- Same minimum height (32px) and clear-space (one puzzle-piece-height) apply.
- Logo must appear at the top of the charcoal section, not as background decoration.
- Do not add drop shadows or glows to the logo itself on dark backgrounds — the `Aurora` shader behind it provides visual depth.
