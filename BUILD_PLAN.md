# Vibe House Full Build Plan

## 1) Product Goal
Build a visually distinct, mobile-first hospitality web app that converts discovery traffic into bookings while supporting profile, stay management, and event-driven engagement.

## 2) Delivery Principles
- Use static, repo-owned assets for all core UI imagery and icons.
- Avoid runtime dependency on docs/reference folders like `guidelines/`.
- Keep API usage focused on dynamic business data (availability, pricing, inventory), not presentation assets.
- Mobile-first implementation with desktop parity.
- Every major section must have fallback UI states (loading, empty, error).

## 3) Information Architecture
- Home
- Property
- Rooms/Availability
- Events
- About/Social
- Policies
- Auth (Guest)
- CX Profile
- My Stay / Bookings

## 4) Phase Plan

### Phase A: Foundation Hardening (In Progress)
- Lock repo references to static assets in `public/`.
- Eliminate UI references to `guidelines/` paths.
- Consolidate icon/image assets and normalize naming conventions.
- Replace custom extra scrollbar with themed browser-native scrollbar.

### Phase B: Discovery & Conversion Surfaces
- Hero + booking intent entry.
- Rooms grid with richer media previews and detail popup.
- Events + social proof + testimonials.
- Strong CTA rhythm across page sections.

### Phase C: Auth & Guest Identity
- Phone OTP sign-in flow.
- Social auth options.
- Session lifecycle handling (restore/logout).
- Guest identity merge rules (new vs returning).

### Phase D: CX Profile
- Core profile fields (name, phone, email, preferences).
- Travel/stay preferences and add-on defaults.
- KYC readiness panel and status states.
- Companion/guest list management.

### Phase E: Booking Lifecycle
- Search/availability with date + inventory logic.
- Room selection and add-on composition.
- Booking summary and payment handoff.
- Confirmation and booking retrieval.

### Phase F: Post-Booking Experience
- My Stay dashboard (upcoming/active/past).
- Modification/cancellation requests.
- Check-in readiness and on-property quick actions.
- Event pass linking and support requests.

## 5) Technical Workstreams

### UI/Frontend
- Next.js App Router, section-based composition.
- Reusable cards, modal patterns, and motion primitives.
- Themed scrollbar and branded interaction states.

### Data Integration
- Keep dynamic API calls for events/availability/pricing.
- Keep visual assets static and versioned in repo.
- Add adapters for API payload normalization.

### Performance
- Responsive image sizing and lazy loading.
- Avoid unnecessary hydration for static sections.
- Keep modal galleries lightweight.

### Quality
- Lint + type checks on every major patch.
- Component-level visual QA on mobile + desktop breakpoints.
- Fallback behavior for null/empty API payloads.

## 6) Asset Strategy
- Canonical location: `public/images/` and `src/assets/`.
- No UI-time reads from `guidelines/`.
- Room galleries defined by room slug in code for consistency.
- Icons bundled as repo assets with explicit import paths.

## 7) Current Sprint Execution Checklist
- [x] Create full build plan markdown.
- [ ] Replace extra left custom scrollbar with browser-native themed scrollbar.
- [ ] Upgrade room cards to support multiple static images.
- [ ] Ensure three room cards use distinct image sets.
- [ ] Make room popup gallery use static room image sets from working assets.
- [ ] Validate no runtime UI dependency on `guidelines/` remains.

## 8) Definition of Done for Current Sprint
- Browser native scrollbar is themed and no duplicate custom scrollbar is visible.
- Room cards show multi-image previews and distinct media per room.
- Room detail popup uses static repo-owned room gallery images.
- App compiles cleanly and passes lint.
- Updated code paths reference only repo-owned asset locations.
