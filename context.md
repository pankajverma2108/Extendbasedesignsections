# Vibehouse Handoff Context

## Current Goal

Stabilize the hero booking widget, restore the mobile nav menu background, and refine the amenities layout on the rooms PLP without regressing the already-working rooms PLP date picker.

## Current Blocking Issues

### 1. Hero date picker still not working

Current runtime error:

```text
forwardRef render functions accept exactly two parameters: props and ref.
Did you forget to use the ref parameter?
```

Source:

- `components/marketing/booking-widget.tsx`

Exact problem:

- `DateSummaryButton` was converted to `forwardRef`, but the render function currently only accepts `props`.
- React requires `forwardRef((props, ref) => ...)`.
- Because of that, the hero booking widget breaks before interaction works.

Recommended fix:

1. Update `DateSummaryButton` to accept both `props` and `ref`.
2. Pass `ref` to the underlying `<button ref={ref} ...>`.
3. Keep the trigger behavior aligned with the working implementation in `components/marketing/rooms-plp.tsx`.

Safe target implementation shape:

```tsx
const DateSummaryButton = forwardRef<HTMLButtonElement, DateSummaryButtonProps>(
  function DateSummaryButton(
    { className, dateRange, open, variant, ...props },
    ref,
  ) {
    return (
      <button ref={ref} {...props}>
        ...
      </button>
    )
  }
)
```

If that still feels brittle, the safer fallback is:

- remove the shared `DateSummaryButton` helper entirely for the hero trigger
- inline a native `<button>` directly inside `PopoverTrigger asChild`
- copy the exact trigger structure used by the working `DateRangePicker` in `components/marketing/rooms-plp.tsx`

### 2. Home hero should use rooms PLP date picker logic

Reference that is already working:

- `components/marketing/rooms-plp.tsx`
- component name: `DateRangePicker`

Working behavior there:

- local `open` state
- `Popover onOpenChange={setOpen} open={open}`
- `PopoverTrigger asChild` wrapping a native `button`
- `PopoverContent` with high z-index and dark panel styles
- `Calendar` rendered in range mode
- `setOpen(false)` after both dates are selected

The hero booking widget should mirror that pattern as closely as possible.

### 3. Mobile nav menu background is now worse

Relevant file:

- `components/marketing/mobile-staggered-menu.tsx`

What changed recently:

- overlay backdrop exists as:
  - `fixed inset-0 z-40 bg-black/65`
- menu container exists as:
  - `fixed inset-0 z-50 overflow-y-auto bg-[linear-gradient(...)] backdrop-blur-md`

Current user complaint:

- the background looks more broken/messed up than before
- screenshot suggests the menu composition no longer feels like a solid full-screen sheet

Likely cause:

- the extra blur/gradient treatment is fighting the card collage layout
- the old simpler solid background was probably closer to correct

Recommended rollback direction:

1. Revert the menu sheet background to a solid dark fill.
2. Keep only a simple dim backdrop behind it.
3. Avoid fancy blur/gradient on the main sheet until the layout is stable.

Suggested classes:

```tsx
<motion.aside className="fixed inset-0 z-50 bg-[#230F14]">
```

And keep the outer dim layer:

```tsx
<motion.div className="fixed inset-0 z-40 bg-black/65" />
```

### 4. Amenities section still needs polish

Relevant file:

- `components/marketing/rooms-plp.tsx`

Current state:

- layout was changed from simple icon/text items to boxed tiles
- user previously said it felt scattered
- latest screenshot still needs visual tightening/intentional spacing

Suggested direction:

1. Keep boxed tiles.
2. Use fewer columns on mobile.
3. Ensure consistent icon container size and line-height.
4. Limit label width and center each item.

Practical suggestion:

- mobile: `grid-cols-3`
- small desktop: `sm:grid-cols-4`
- larger desktop: `lg:grid-cols-5`
- use `max-w-[110px]` per tile if needed

## Important Files

### Booking / calendar

- `components/marketing/booking-widget.tsx`
- `components/marketing/rooms-plp.tsx`
- `components/ui/popover.tsx`
- `components/ui/calendar.tsx`
- `src/app/components/ui/calendar.tsx`
- `app/globals.css`

### Navigation

- `components/marketing/navigation.tsx`
- `components/marketing/mobile-staggered-menu.tsx`

### Supporting UI

- `components/shared/image-with-fallback.tsx`
- `components/ui/minimal-card.tsx`

## Things Already Done Earlier

These were already requested and are considered done unless they need regression fixes:

- event cards now show event detail pills instead of room category labels
- applies across home and events page
- Sunday card removed from events weekly lineup
- contact section removed from rooms PLP
- FAQ bottom border issue fixed
- mobile header background was adjusted to match desktop tone
- My Stay and Profile icons in mobile menu were enlarged
- `guidelines/events.html` was updated to reflect newer event card structure
- date picker moved out of sticky summary and placed under Availability on rooms PLP
- the raw `<img>` lint warning was suppressed in `components/shared/image-with-fallback.tsx`

## Current Booking Widget Structure

File:

- `components/marketing/booking-widget.tsx`

Notes:

- hero variant renders a popover date range picker
- CTA line currently says:
  - `Lock the dates now. Sort the rest when you get here.`
- calendar uses:
  - `Calendar`
  - `Popover`
  - `PopoverContent`
  - dark styling via `vh-calendar-dark`

Potentially safest next step:

- simplify the hero widget
- avoid abstraction until it is stable
- use one native button trigger in hero
- copy the rooms PLP interaction logic exactly

## Current Rooms PLP Date Picker Reference

File:

- `components/marketing/rooms-plp.tsx`

Reference function:

- `DateRangePicker`

This is the known-good implementation and should be treated as the source of truth.

## Requested Outcome

The next agent should:

1. Fix the `forwardRef` error in `components/marketing/booking-widget.tsx`.
2. Make the hero date picker open and function exactly like the rooms PLP date picker.
3. Restore a solid, clean mobile nav background in `components/marketing/mobile-staggered-menu.tsx`.
4. Tighten the amenities section layout in `components/marketing/rooms-plp.tsx`.
5. Run `npm run lint` after changes.

## Last Known Good Verification

- `npm run lint` passed before the broken `forwardRef` change.
- The rooms PLP date picker is working and layering correctly.
- The home hero date picker is the main unresolved booking issue.
