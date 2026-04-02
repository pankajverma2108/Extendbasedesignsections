# Vibe House Design Handoff

This file is a complete handoff for the next agent session.

The user is currently in the VS Code Codex extension and plans to switch to Antigravity to continue refining the design with another agent. This summary is meant to accelerate that handoff, but it is not a substitute for reading the live code. The next agent must first gather fresh codebase context from the actual files before making edits.

## User Request In This Chat

The user asked me to continue from the previous context and keep pushing the live booking flow closer to the exported design references.

Primary goals from this chat:

- continue working from the existing `context.md`
- use the exported design guideline files as the visual source of truth
- preserve existing booking and pre-arrival functionality
- improve the design fidelity of the live pages, not just the imported reference components
- then update `context.md` into a strong handoff prompt for another agent

The user explicitly said they will continue refining the design in another editor/agent setup and wanted this handoff to be complete.

## Important Instruction For The Next Agent

Before editing anything, first gather fresh codebase context directly from the repo.

Minimum required reading before changes:

1. Read this `context.md` fully.
2. Read the current live implementations:
   - `components/booking/booking-detail-page.tsx`
   - `components/booking/pre-arrival-page.tsx`
   - `components/booking/booking-shell.tsx`
   - `app/bookings/[eri]/page.tsx`
   - `app/bookings/[eri]/pre-arrival/page.tsx`
   - `app/globals.css`
   - `content/rooms.ts`
3. Read the exported design guideline markdown files and inspect their assets:
   - `public/design-guidelines/booking-details/Booking_Details.md`
   - `public/design-guidelines/pre-arrival/pre-arrival.md`
4. Review the reference-only imported Figma export components:
   - `src/imports/VhdsgnBookingDetailsVibrant.tsx`
   - `src/imports/VhdsgnPreArrivalSetupVibrant.tsx`

Do not rely on this summary alone.

## What Was Already True Before This Chat

From the earlier repo state and previous handoff:

- functionality had already been prioritized ahead of pixel-perfect design matching
- the exported folders under `public/design-guidelines/` were already established as the visual source of truth
- booking/property logic had already been debugged earlier
- room card amenities had already been intentionally kept frontend-mapped rather than backend-driven
- booking calendar reset behavior had already been fixed
- the pre-arrival KYC flow was already functionally working
- nested-button and related interaction issues in the KYC flow had already been addressed before this chat

## What I Changed In This Chat

### 1. Booking Detail Page Restyle

File edited:

- `components/booking/booking-detail-page.tsx`

What I changed:

- replaced the more generic booking summary presentation with a custom, more expressive layout aligned to the booking-details reference direction
- added a custom top navigation/header treatment
- converted the confirmation section into a poster or ticket-like composition
- reorganized the page into stronger visual panels for confirmation, stay details, payment details, and next steps
- preserved the real booking data wiring for:
  - room summary
  - room number
  - stay dates
  - booking status
  - amount paid
  - guest slot counts
  - KYC progress
- kept navigation behavior intact for:
  - returning to bookings
  - going to pre-arrival setup

Presentation-only visual additions:

- generated access passcode
- generated locker code
- QR-like access visual

Important note:

- those values are not real backend security credentials
- they are presentation-layer derived from `ezeeReservationId` to better match the design language

### 2. Pre-Arrival Page Restyle

File edited:

- `components/booking/pre-arrival-page.tsx`

What I changed:

- moved the page away from the generic shell presentation into a dedicated custom layout
- added a top bar and a more visual progress treatment inspired by the pre-arrival references
- translated the exported design language into the real live KYC flow instead of inventing fake product behavior
- preserved all working flow logic for:
  - auth gating
  - booking linking
  - KYC slot loading
  - slot switching
  - adding a slot
  - deleting a slot
  - document upload
  - OCR
  - edit state and field updates
  - validation
  - KYC submission
- reorganized the screen into visual sections such as:
  - ID verification
  - traveler details
  - house rules / confirmation
  - guest slots / active traveler

Important note:

- the mission/progress treatment is frontend-derived from current page state
- it is not backend-provided workflow state

### 3. Small Cleanup / Correction

- fixed the earlier malformed text issue in the pre-arrival screen heading area during the redesign pass

### 4. Verification Performed

I ran targeted lint for the two edited screens:

```bash
npm run lint -- components/booking/booking-detail-page.tsx components/booking/pre-arrival-page.tsx
```

That targeted lint check passed after the edits.

## Files Most Relevant Now

Core live files:

- `components/booking/booking-detail-page.tsx`
- `components/booking/pre-arrival-page.tsx`
- `components/booking/booking-shell.tsx`
- `app/bookings/[eri]/page.tsx`
- `app/bookings/[eri]/pre-arrival/page.tsx`
- `app/globals.css`
- `content/rooms.ts`

Useful supporting files:

- `lib/cx-api.ts`
- `.env.local`
- `.env.production`

Design reference sources:

- `public/design-guidelines/booking-details/`
- `public/design-guidelines/pre-arrival/`
- `public/design-guidelines/event-booking/`
- `public/design-guidelines/guest-dashboard/`

Reference-only imported design files already in repo:

- `src/imports/VhdsgnBookingDetailsVibrant.tsx`
- `src/imports/VhdsgnPreArrivalSetupVibrant.tsx`

Those imported files are not the live route implementation. They are useful visual references.

## Design State After My Changes

### Booking Detail Page

Current state:

- much closer to the exported booking-details direction than it was before
- no longer using the more generic “product app” presentation
- still not a pixel-perfect match

Likely remaining refinement areas:

- spacing precision
- typography fidelity
- exact sticker/cutout/card geometry
- shadow treatment and layering
- desktop composition polish
- mobile breakpoint behavior
- whether the generated passcode / locker / QR visuals should stay as-is, be refined, or later be replaced by real data if the product eventually supports that

### Pre-Arrival Page

Current state:

- materially closer to the vibrant exported pre-arrival direction
- still not a full exact match
- functional KYC flow remains intact

Likely remaining refinement areas:

- section spacing and rhythm
- typography scale and hierarchy
- card proportions
- image/icon usage from exported assets
- sticker / polaroid visual fidelity
- mobile layout polish
- desktop composition balance
- progress-strip styling and wording

## Product And Engineering Decisions To Preserve

These are important. The next agent should not accidentally undo them.

### Property Context

- booking docs require `property_id` early
- runtime guessing late in checkout was previously removed as the primary approach
- current property context is driven by env/config, not by ad hoc business-logic hardcoding

Expected current value:

```env
NEXT_PUBLIC_PROPERTY_ID=prop-bandra-001
```

### API Base URL

Expected current value:

```env
NEXT_PUBLIC_API_BASE_URL=https://vibehousebackend-production.up.railway.app
```

### Room Card Amenities

- do not reintroduce backend-driven room amenities
- amenities/features remain frontend-mapped by design
- backend still provides live availability/pricing/title data

Relevant file:

- `lib/cx-api.ts`

### Booking Calendar Behavior

- when a full date range already exists, clicking a new date should start a fresh range

Relevant files:

- `components/marketing/widgets/booking-widget.tsx`
- `components/marketing/property.tsx`

### Pre-Arrival Behavior

- auth gating must remain intact
- slot management must remain intact
- upload must remain intact
- OCR must remain assistive, not required for submission
- validation must remain intact
- KYC submission behavior must remain intact

## Known Repo State

At the time of this handoff, the following files were already modified in the worktree:

- `components/booking/booking-detail-page.tsx`
- `components/booking/pre-arrival-page.tsx`
- `context.md`
- `next-env.d.ts`

Important note:

- I did not intentionally work on `next-env.d.ts` in this chat
- if it remains modified, treat it as unrelated user/workspace state unless inspection proves otherwise
- do not revert unrelated dirty files unless the user explicitly asks

## What The Next Agent Should Focus On

The next step is design refinement and polish, not functional re-architecture.

Recommended focus:

- compare the live pages directly against the exported booking-details and pre-arrival references
- close the remaining fidelity gap in spacing, hierarchy, imagery, and layout composition
- improve responsive behavior on both mobile and desktop
- preserve all current booking and KYC behavior while refining visuals

Do not:

- replace live flows with static mockup-only UI
- break auth gating, slot management, upload, OCR, validation, or submission
- reintroduce backend-driven room amenities
- assume this summary is enough without re-reading the code

## Prompt Base For The Antigravity Agent

Use or adapt the following:

You are continuing a live design-refinement pass in the Vibe House repo. First gather full codebase context before editing anything. Read `context.md` completely, then inspect the current live implementations in `components/booking/booking-detail-page.tsx`, `components/booking/pre-arrival-page.tsx`, `components/booking/booking-shell.tsx`, `app/bookings/[eri]/page.tsx`, `app/bookings/[eri]/pre-arrival/page.tsx`, `app/globals.css`, and `content/rooms.ts`. Then read the exported design guideline markdown and inspect assets in `public/design-guidelines/booking-details` and `public/design-guidelines/pre-arrival`. Also review the reference-only imported files `src/imports/VhdsgnBookingDetailsVibrant.tsx` and `src/imports/VhdsgnPreArrivalSetupVibrant.tsx`. The user asked to keep refining the design fidelity of the live booking detail and pre-arrival pages while preserving all existing functionality. In the last pass, those two live pages were significantly restyled to better match the exported references, while keeping booking data wiring and the full KYC flow functional. Continue from that state. Do not break auth gating, booking linking, slot loading, slot switching, add/delete slot, upload, OCR, validation, or submission. Do not reintroduce backend-driven room amenities. Treat the exported design guidelines as the visual source of truth, but adapt them to the real product behavior instead of inventing fake features. Focus on spacing, typography, card/sticker/cutout fidelity, responsive behavior, and overall polish.

## Short Version

What the user asked:

- continue from the prior context
- improve the live booking detail and pre-arrival screens visually
- preserve functionality
- prepare a strong handoff for another agent

What I did:

- redesigned `components/booking/booking-detail-page.tsx`
- redesigned `components/booking/pre-arrival-page.tsx`
- preserved booking and KYC functionality
- verified targeted lint for those two files
- rewrote `context.md` into a full handoff for the next agent

Bottom line:

Preserve behavior. Re-read the code. Refine fidelity.
