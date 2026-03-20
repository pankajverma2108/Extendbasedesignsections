# Vibe House Project Context Log

Last updated: 2026-03-19 (Asia/Calcutta)
Owner: `pankajverma2108`
Repo: `C:\Space\Vibehouse2\Extendbasedesignsections`
Primary branch: `main`
Remote: `https://github.com/pankajverma2108/Extendbasedesignsections.git`

---

## 1) Why this file exists

This is a long-form, transfer-friendly context file intended to let any new AI agent or engineer pick up work instantly without losing business, UX, architecture, or implementation history.

Goal:
- Preserve strategic context (business + product + feedback)
- Preserve technical context (stack + architecture + decisions)
- Preserve execution history (what changed, why, and what remains)
- Reduce re-discovery time if a new AI agent takes over

---

## 2) Product and business context summary

Primary source: `guidelines/Eval_ Vibe House Concept Note.md`

Working product definition:
- Vibe House is a social co-living / mixed-gender hostel brand.
- Core promise: social energy + safety + cleanliness + community.
- Brand line: "Stay. Mix. Repeat."

Target audience:
- Solo travelers, digital nomads, young professionals, first-time city visitors, weekend travelers.
- Typical age band: 18-35.

Business differentiators:
- Structured social evenings and events
- Safety standards and controlled rules
- Cleanliness as a hotel-level standard
- Strong mobile-first guest interface and staff operations stack

Commercial model emphasis in doc:
- Room revenue plus add-on upsell revenue
- Pre-arrival and during-stay commerce
- Extension flow monetization
- Operational SLA discipline and staff accountability

---

## 3) Core business-system requirements extracted from BRD

From the business doc (multiple BRD sections):
- Booking and guest linking via OTA + PMS data
- Pre-arrival upsell engine and add-on cart
- During-stay service engine
- Staff task dashboard with SLA timers and escalations
- Inventory control and shrinkage prevention
- Payment processing through Razorpay
- Post-payment folio sync to eZee PMS
- Smart lock integration path (MyGate requirements section)
- Data and analytics layer for revenue + operational KPIs

Critical transaction principle repeated in doc:
- Payment, folio update, inventory update, task creation, and SLA start must be coordinated to prevent leakage.

Database strategy from doc:
- SQL is positioned as source of truth for payments, inventory, bookings, SLAs, and audit trails.
- NoSQL/Document layer positioned for flexible content, logs, and personalization.
- Redis positioned for caching, hot reads, and timers.

---

## 4) Mobile feedback summary (from `guidelines/Mobile review.docx`)

Feedback points received:
- Booking CTA placement and urgency are weak on mobile.
- Hero center area should stay visually strong and action-focused.
- Add urgency signals near booking CTA.
  - Example notes: "Starting at 599 tonight", "Only XX beds left", "Book now for XX% off".
- Current black background is perceived as less appealing; white-background reference from `https://gostops.com/stay/home` was suggested for comparison.
- Font options need review.
- Too many colors / glow effects; simplify visual treatment.
- Mobile page flow is too long.

Current flow called out in feedback:
- Hero
- Safety
- Amenities
- Rooms
- Experience
- Events
- Reviews
- CTA again

Suggested leaner mobile flow:
- Hero + Header (Hostels, Partner with us, Contact us, Long Stays)
- Why Vibe House / Experience
- Room + Amenities
- Activities
- Reviews
- Secondary utility/promotional sections later

Interpretation:
- Shorter narrative path on mobile
- Stronger conversion hierarchy
- Reduced visual noise
- Clearer information architecture

---

## 5) Technical baseline before migration

Previous state (before latest work):
- Vite app
- React Router route setup
- Figma-generated artifacts in `src/imports`
- `figma:asset/...` references in legacy code
- Multiple page-level duplicated nav/footer structures
- Heavy inline arrays/content in page files
- Basic visual implementation but limited modular page composition

Legacy files still present in repo:
- `src/app/pages/*` (older Vite page implementations)
- `src/imports/*` (Figma export artifacts)

Note:
- These legacy areas are not part of new Next runtime path, but still exist as historical/generated residue.

---

## 6) Migration and architecture decisions taken

Major direction chosen:
- Move to Next.js App Router as production foundation.
- Keep scope marketing-first for this phase.
- Keep booking widget interactive only (local validation) with no real backend side effects in current phase.

What was implemented:
- Next.js app routes:
  - `/`
  - `/rooms`
  - `/events`
  - `/about`
  - `/policies/[type]`
  - `not-found`
- Shared app layout with unified nav/footer
- Centralized typed content modules (`content/*`)
- Reusable marketing components (`components/marketing/*`)
- Shared utility and visual primitives (`components/shared/*`, `components/ui/*`)
- Motion system via `motion/react` primitives and stagger/fade wrappers

---

## 7) Current runtime stack

Framework and runtime:
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS v4

UI and interaction:
- Radix-based shadcn-style primitives (`Button`, `Card`, `Accordion`)
- `motion` package for reveal/stagger/hover animations
- `embla-carousel-react` for hero carousel behavior

Config and build:
- `next.config.mjs`
- `tsconfig.json`
- `postcss.config.mjs` using `@tailwindcss/postcss`
- `app/globals.css` with Vibe House token-style classes

---

## 8) File-level architecture snapshot

Top-level runtime app:
- `app/layout.tsx`
- `app/page.tsx`
- `app/about/page.tsx`
- `app/events/page.tsx`
- `app/rooms/page.tsx`
- `app/policies/[type]/page.tsx`
- `app/not-found.tsx`

Reusable sections/components:
- `components/marketing/booking-widget.tsx`
- `components/marketing/hero-carousel.tsx`
- `components/marketing/home-sections.tsx`
- `components/marketing/navigation.tsx`
- `components/marketing/footer.tsx`
- `components/marketing/room-card.tsx`
- `components/marketing/event-card.tsx`
- `components/marketing/policy-toc.tsx`
- `components/marketing/section-heading.tsx`

Shared primitives:
- `components/shared/motion.tsx`
- `components/shared/image-with-fallback.tsx`
- `components/shared/star-border.tsx`
- `components/shared/star-border.module.css`

UI primitives (shadcn-style):
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/accordion.tsx`

Content as data:
- `content/site.ts`
- `content/home.ts`
- `content/rooms.ts`
- `content/events.ts`
- `content/about.ts`
- `content/policies.ts`
- `content/types.ts`

---

## 9) Reorderability and modularity state

Home page is now modular and reorder-friendly.

Mechanism:
- `content/home.ts` exports `homeSectionOrder`
- `components/marketing/home-sections.tsx` maps section IDs to section components
- `app/page.tsx` renders `HomeSections()`

Result:
- Reordering home sections is content/config-level, not JSX surgery.
- This supports fast mobile-flow experiments from feedback.

---

## 10) Booking widget scope in current phase

Current behavior:
- Date inputs with local validation
- CTA enabled only on valid date combination
- Navigation-based continuation (no transactional submit)

Not yet implemented:
- Availability API calls
- Order creation
- Payment initiation
- Webhook-driven confirmation
- PMS posting

This is intentional for marketing-first phase.

---

## 11) Animation and visual behavior status

Animation primitives added:
- `FadeIn`
- `Stagger`
- `StaggerItem`
- `FloatCard`

Applied across:
- Home sections
- About sections
- Events sections
- Policy content blocks
- Room/event cards and CTA zones

Visual strategy currently:
- Bold gradients, rotated cards, energetic accents
- Preserves existing brand tone while making components reusable

Potential tune-up based on feedback:
- Reduce color count on mobile
- Lower glow/noise intensity
- Simplify long scroll sections
- Improve CTA urgency language and placement

---

## 12) Git and push history relevant to this phase

Observed repo short history:
- `e363206` Migrate Vibe House to Next.js
- `e5e7cd3` Update files from Figma Make
- `2bf309c` Update files from Figma Make
- `abe49c3` Add files from Figma Make
- `6b1faf1` Initial commit

Push status:
- Commit was pushed to `origin/main`.
- Repo ready for Vercel import once account is created.

---

## 13) Deployment readiness notes

Verified previously:
- `npm run build` succeeded for current Next app
- Static routes generated for marketing pages and policy variants

Expected Vercel behavior:
- Auto-detect Next.js
- Build command: `next build` (default)
- No mandatory env vars for current marketing scope

---

## 14) Open risks and known follow-up items

Product/UX:
- Mobile hierarchy may still be too long vs reviewer expectation.
- Booking urgency messaging needs explicit copy and style pass.
- Background/contrast direction may need white-first variant testing.

Technical:
- Legacy generated code in `src/imports` remains in repository.
- Legacy Vite pages in `src/app/pages` remain as non-runtime residue.
- If desired, cleanup should be done carefully in separate commit.

Content:
- Some text values are placeholders and should be editorially finalized.
- Policy content may require legal review before production.

---

## 15) Suggested immediate backlog (non-code and code)

Non-code:
- Confirm brand visual direction for mobile against `gostops` reference.
- Finalize mobile-first section order and mandatory nav items.
- Lock CTA urgency copy guidelines.

Code (next likely implementation slice):
- Add a mobile-compressed home section order preset.
- Add CTA urgency ribbons/availability chips driven by content config.
- Add "light background variant" token mode for marketing pages.
- Clean legacy folders if approved:
  - `src/imports`
  - legacy `src/app/pages/*`

Integration later:
- Introduce API contracts for booking flow in separate phase.
- Preserve transactional and idempotency guarantees from BRD.

---

## 16) Handoff instructions for next AI agent

If another AI continues work, it should:
- Read this file first (`guidelines/context.md`).
- Read business doc second (`guidelines/Eval_ Vibe House Concept Note.md`).
- Read feedback doc third (`guidelines/Mobile review.docx`).
- Confirm current branch and latest pushed commit.
- Avoid reworking architecture blindly; build on modular sections and content-driven ordering.

If assigned mobile optimization:
- Start with `content/home.ts` and `components/marketing/home-sections.tsx`.
- Preserve reusable component boundaries.
- Keep booking widget logic phase-appropriate (no fake backend confirmations).

---

## 17) Working assumptions currently active

- Project phase is still marketing-first.
- Next.js App Router is authoritative runtime path.
- Booking/payment/PMS automation exists in BRD but is intentionally deferred from runtime implementation.
- Detailed context retention is a project requirement for AI handoffs.

---

## 18) Temporary artifacts note

While reading `Mobile review.docx`, helper extraction artifacts were created:
- `guidelines/Mobile review.zip`
- `guidelines/_mobile_review_extract/`
- `guidelines/_mobile_review_text.txt`

These are not needed for product runtime.
They can be removed in a cleanup step when permitted by tooling/policy.

---

## 19) Short plain-English project snapshot

Vibe House is being built as a high-energy, safety-first hostel product with strong operational rigor behind the scenes. The codebase has been migrated from Vite to Next.js and restructured around reusable, reorderable sections and content modules. The business design expects strict transactional handling for payments, inventory, folios, and SLAs, but current implementation intentionally focuses on marketing UX and frontend modularity. Mobile review feedback asks for a shorter, cleaner, more conversion-focused experience, which is now feasible due to the new modular architecture.
