# OboxSTEAM — Frontend

> STEAM experiential learning platform with automated student Portfolio microsites for overseas university applications.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (`base-nova`) |
| State | Redux Toolkit 2 |
| Validation | Zod v4 |
| Forms | react-hook-form + @hookform/resolvers |
| Package manager | **pnpm** (do not use npm or yarn) |
| Icons | Lucide React |

---

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
OboxSTEAM.FE/
├── app/                        # Next.js App Router — folder = route
│   ├── (main)/                 # Main platform (header + footer layout)
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Homepage
│   │   ├── courses/            # Program catalog + detail pages
│   │   ├── dashboard/          # Student / parent dashboard
│   │   └── portfolio/          # Portfolio builder (authenticated)
│   ├── (auth)/                 # Login, register, role selection
│   ├── (portfolio-site)/       # Public student portfolio microsites
│   │   └── [username]/         # Rendered when subdomain is detected
│   ├── layout.tsx              # Root layout — fonts, providers
│   └── globals.css             # Tailwind imports + OboxSTEAM design tokens
│
├── components/
│   ├── ui/                     # shadcn primitives (add via MCP)
│   ├── providers/              # Redux store provider, future context providers
│   ├── layout/                 # Header, Footer, Sidebar
│   ├── course/                 # CourseCard, CategoryBadge, CurriculumList…
│   ├── portfolio/              # PortfolioSection, AchievementCard, ExportButton…
│   └── dashboard/              # ProgressRing, RecentActivity…
│
├── lib/
│   ├── api/                    # fetch wrappers for each backend domain
│   ├── validations/            # Shared Zod schemas (forms + API payloads)
│   ├── env.ts                  # Zod-validated env config
│   └── utils.ts                # cn() Tailwind class merger
│
├── store/
│   ├── slices/                 # Redux slices (auth, ui, …)
│   ├── hooks.ts                # Typed useAppDispatch / useAppSelector
│   └── index.ts                # configureStore + exported types
│
├── middleware.ts               # Subdomain → portfolio route rewrite
├── public/                     # Static assets (logo, og-image, …)
└── .cursor/                    # AI rules + MCP config (editor only)
    └── rules/
        ├── context.mdc         # Project domain context (load when needed)
        ├── nextjs-engineering-rule.mdc
        └── styling-rule.mdc
```

---

## Subdomain Architecture

Premium portfolio plans get a personal subdomain: `{name}.obox.id`.

```
Request: alex.obox.id
         ↓
middleware.ts          reads host header → extracts "alex"
         ↓
NextResponse.rewrite   → /portfolio-site/alex  (internal only)
         ↓
app/(portfolio-site)/[username]/page.tsx  fetches & renders Alex's portfolio
```

DNS: Wildcard `*.obox.id` → server. No per-student DNS record needed.

Standard plan uses path-based URLs: `obox.id/{student-id}`.

---

## Design System

Brand colors, typography, and component patterns are defined in `.cursor/rules/styling-rule.mdc` and applied as CSS variables in `app/globals.css`.

**STEAM category colors (Tailwind utilities):**

| Category | Utility | Hex |
|----------|---------|-----|
| Science | `bg-steam-science` | `#E94B3C` |
| Technology | `bg-steam-technology` | `#7CB342` |
| Engineering | `bg-steam-engineering` | `#4FC3F7` |
| Arts | `bg-steam-arts` | `#FDD835` |
| Mathematics | `bg-steam-mathematics` | `#7E57C2` |

**Fonts:** Nunito (headings) · Inter (body) · JetBrains Mono (code)

---

## Adding shadcn / React Bits Components

The project uses the shadcn MCP server. In Cursor, prompt directly:

```
Add the Card component from shadcn
Add the FadeContent component from React Bits
```

Or via CLI:

```bash
pnpm dlx shadcn@latest add card input form
```

The `components.json` already has the React Bits registry registered:

```json
"registries": {
  "@react-bits": "https://reactbits.dev/r/{name}.json"
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No (dev) | Backend API base URL |

Copy `.env.example` → `.env.local` and fill in values. Never commit `.env.local`.

---

## Scripts

```bash
pnpm dev        # dev server with Turbopack
pnpm build      # production build
pnpm start      # serve production build
pnpm lint       # ESLint (flat config, Next.js rules)
```

---

## Actors

| Role | Description |
|------|-------------|
| **Student** | Enrolls, learns, owns Portfolio |
| **Parent** | Pays, monitors child progress (linked sub-profile) |
| **Mentor** | Teaches, grades, uploads evidence |
| **Provider** | Partner education center; approves Mentors |
| **Manager** | OboxSTEAM platform quality control |
| **Admin** | System observer; manages all entities |
| **Guest** | Browses programs + views public portfolios |

---

## Content Hierarchy

```
Program
└── Curriculum Framework
    └── Module  (prerequisite-gated)
        └── Course  (theory + tasks)
            └── Activity  (atomic student task)
```