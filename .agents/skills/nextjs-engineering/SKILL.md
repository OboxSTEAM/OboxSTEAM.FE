---
description: OboxSTEAM Next.js engineering standards — stack, patterns, security
name: nextjs-engineering
---

# OboxSTEAM — Next.js Engineering

Edtech platform standards. **Visual design:** `styling-rule.mdc`. **Domain/routes/roles:** `context.mdc` when relevant.

---

## Stack

Next.js App Router · TypeScript · Tailwind + shadcn/ui (Radix) · Redux Toolkit (global auth, UI shell) · Zod · **pnpm only** · Jest + RTL · Lucide (sparingly)

**Data:** RSC + Server Actions first; RTK Query/React Query only when client cache/interactivity needs it.

**UI:** Extend shadcn via composition; scaffold/update primitives via project MCP; match `components/ui` patterns.

---

## Before coding

1. **Review** — Use **Codegraph MCP** for TS/TSX context, call paths, and blast radius; `<CODE_REVIEW>` when non-trivial.
2. **Plan** — `<PLANNING>` for multi-step work; preserve names/literals unless change required; `::CONVENTION_NAME::` for new patterned names.
3. **Implement** — Small increments; quick verification hints.
4. **Secure** — `<SECURITY_REVIEW>` for auth, input, secrets, PII.

Prefer concepts over code when sufficient; ask on ambiguity; brief trade-offs when choices matter.

### Code intelligence (Codegraph MCP)

Project MCP server: `codegraph` (`.codegraph/` index). Default for indexed source — faster and includes callers/callees grep cannot follow.

| Intent | Tool |
|--------|------|
| How does X work? / survey area / symbols before an edit | `codegraph_explore` |
| What breaks if I change this? | `codegraph_callers` |
| One symbol or file + dependency trail | `codegraph_node` |
| Locate a symbol by name | `codegraph_search` |

- One `codegraph_explore` call usually replaces a search → read → grep loop.
- Do **not** re-verify Codegraph source with grep; re-read only files in a staleness banner after your edit.
- Grep/Read when Codegraph does not index the file (configs, `.md`, env) or the index is unavailable.

---

## Code style

Functional TypeScript (no classes); auxiliary verbs (`isLoading`, `canSubmit`); early returns; custom error types at API/UI boundaries.

**Layout:** exported component → subcomponents → helpers → types; folders `kebab-case`; comments only for non-obvious logic; JSDoc on exports when types aren’t enough.

---

## Next.js & React

- Default **Server Components**; minimize `'use client'`, `useEffect`, `useState`.
- Dynamic `import()` for heavy/below-fold client code; `next/image` (WebP, dimensions, lazy); mobile-first; colocate routes under `app/`.
- Reduce client JS, avoid fetch waterfalls, stream where useful; `prefers-reduced-motion` for motion (see styling guide).

---

## State, forms, data

- Redux: lean; slices under `store/` or feature folders; don’t duplicate RSC-fetched data.
- Forms: Zod + react-hook-form (`zodResolver`); validate client **and** server (Server Actions / API).
- Normalize API responses at boundaries; typed selectors/hooks.

### Client fetch + skeleton loading (filter/pagination lists)

Use when a **client leaf** refetches on filter, sort, or pagination (RSC seeds first page; client owns subsequent queries).

| Piece | Location | Role |
|-------|----------|------|
| Min delay | `lib/ui/min-skeleton-delay.ts` — `DEFAULT_MIN_SKELETON_MS` (420), `waitMinSkeleton()` | Prevent skeleton flash on fast responses |
| Hook | `hooks/use-client-fetch.ts` — `useClientFetch()` | Fetch + min skeleton + retain stale data on error |
| Skeleton UI | Colocated component matching final layout (e.g. `ReviewSkeletonList`, `ProgramGrid` loading) | Same structure as loaded content |

**Pattern**

1. RSC page passes `initialData` for the default query; client `useState` holds query params.
2. `useClientFetch({ enabled: !isDefaultQuery, initialData, fetcher, deps: [query, …], onError })`.
3. On filter/sort/page change: call `markLoading()` **then** update query state.
4. Render skeleton when `isLoading`; hide pagination while loading.
5. Debounced search: keep skeleton visible while pending (`isLoading || isSearchPending`).

Do **not** copy the wait/finish boilerplate per feature — extend the hook or `min-skeleton-delay` if new behavior is needed.

---

## API layer (`lib/api/`)

Backend responses use a shared envelope: `{ isSuccess, value, error }`, with `value` often `{ code, message, data? }`. Keep that shape DRY via `lib/api/schemas.ts` (`createApiResponseSchema`, `createApiValueSchema`, `apiValueMessageOnlySchema`).

### Folder layout (scale by domain)

```text
lib/api/
  client.ts              # apiFetch, apiFetchParsed, assertApiSuccess, getApiBaseUrl
  schemas.ts             # envelope factories only — no domain entities
  create-endpoint.ts     # createApiPost for POST + envelope routes
  errors.ts              # ApiRequestError (HTTP), ApiResponseError (isSuccess: false)
  index.ts               # public barrel
  <domain>/              # e.g. auth/, courses/
    schemas.ts           # response entities + *ValueSchema / *ResponseSchema
    index.ts             # endpoint functions (createApiPost or custom fetch)
lib/validations/
  <domain>.ts            # request + form schemas (user-facing rules, Vietnamese messages)
  index.ts
lib/api/entities/        # optional — shared DTOs used by multiple domains (e.g. user)
```

### Zod responsibilities

| Layer | Location | Purpose |
|-------|----------|---------|
| **Request / form** | `lib/validations/<domain>.ts` | Rules shared by UI and API (`registerSchema`, `loginSchema`). Import in RHF and `createApiPost({ input })`. |
| **Response** | `lib/api/<domain>/schemas.ts` | Parse JSON from backend; catch contract drift. Export schemas; derive types with `z.infer`. |
| **Envelope** | `lib/api/schemas.ts` | Single definition of wrapper shape — do not copy per endpoint. |

- **One source of truth:** prefer `z.infer<typeof schema>` over duplicate manual interfaces.
- **Validate at boundaries:** forms, Server Actions, and every `lib/api/*` call — never trust client-only checks.
- **DRY:** define each rule once (email format, API envelope, `RegisteredUser` shape). Reuse across forms and endpoints; extract to `lib/api/entities/` when a DTO appears in 2+ domains.
- **Don’t over-abstract:** use `createApiPost` for similar POST routes; use explicit `apiFetchParsed` for GET/PATCH, uploads, or custom headers. Avoid mega-helpers until repetition is real (~8+ similar endpoints).

### Adding an endpoint

1. Request schema in `lib/validations/<domain>.ts` if a form or Server Action sends it.
2. Response entity + `*ValueSchema` in `lib/api/<domain>/schemas.ts`.
3. Function in `lib/api/<domain>/index.ts` via `createApiPost` or `apiFetchParsed`.
4. Re-export from `lib/api/index.ts` and `lib/validations/index.ts` when public.

### Errors

- `ApiRequestError` — non-2xx HTTP.
- `ApiResponseError` — HTTP OK but `isSuccess: false` or missing `value` (map `error.message` for UI; no stack/internal IDs to users).

### User-facing errors (toasts)

Use **Sonner** (`components/ui/sonner`, `<Toaster />` in `AppProviders`) with the shared three-part model in `lib/errors/`:

- `AppErrorState`: `title` (what happened) · `reason` (why) · `action` (what to do)
- `resolveAppError(error, context)` — normalize API/Zod/network errors
- `showAppError(state)` · `showAppErrorFromUnknown(error, context)` · `showAppSuccess({ title, description? })`
- UI: `components/errors/app-error-toast.tsx` (destructive) · `app-success-toast.tsx`

Pass an `AppErrorContext` per feature (`auth.login`, `auth.register`, …) for tailored copy. Do not show stack traces or internal IDs.

### Later (large API surface)

OpenAPI codegen (`openapi-zod-client`, `orval`) is acceptable when Swagger is the source of truth. Until then, hand-written Zod per domain is the standard.

---

## Security & ops

Validate/sanitize all input; no client-only trust. No secrets in client bundles. Auth: secure cookies/headers, least privilege. User-facing errors without stacks/internal IDs. Server logs: meaningful, no PII/tokens.

---

## Testing & delivery

RTL: behavior and a11y, not implementation details. Extend shared components (`CourseCard`, `CategoryBadge`, …) over duplicates.

**Ship:** focused, lint-clean, typed, verifiable diffs — correct, secure, consistent with OboxSTEAM patterns.

