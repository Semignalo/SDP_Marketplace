---
name: SDP Marketplace
description: A curated multi-vendor marketplace — confident, warm, unhurried.
colors:
  ink: "#1a1a1a"
  ink-soft: "#333333"
  ink-muted: "#6b6b6b"
  ink-faint: "#a3a3a3"
  paper: "#ffffff"
  paper-soft: "#fafafa"
  paper-warm: "#f5f5f5"
  line: "#e5e5e5"
  line-strong: "#d4d4d4"
  accent: "#b5562f"
  accent-hover: "#96431f"
  accent-soft: "#f5e6df"
  rating: "#f5b400"
  rating-soft: "#fdf0d5"
  state-success: "#15803d"
  state-warning: "#a16207"
  state-danger: "#b91c1c"
  state-info: "#1d4ed8"
typography:
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  heading:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.25em"
rounded:
  sm: "3px"
  default: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.default}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.default}"
    padding: "0 20px"
    height: "44px"
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
  badge-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-hover}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: SDP Marketplace

## 1. Overview

**Creative North Star: "The Curated Rack"**

SDP is a boutique rack, not a warehouse aisle. Every brand on it earned its spot, and the interface should feel like someone with taste already did the sorting — quiet confidence, not a sales floor shouting for attention. The palette stays close to ink-on-paper; one warm terracotta accent carries all the personality the system allows itself, and it's spent deliberately: a sale badge, a focus ring, a primary action. Nothing else competes with it.

This system explicitly rejects the generic "AI marketplace template" look: no gradient text, no eyebrow label stamped above every section, no identical card grids repeated back to back. It also rejects the opposite failure — sterile minimalism with no pulse. The rack is curated, not empty. Warmth comes from the accent, the type voice (the bold-then-italic-light flourish), and restraint, never from clutter or saturation.

**Key Characteristics:**
- Ink-on-paper neutrals carry 90%+ of every screen; terracotta is rare and intentional
- Flat surfaces at rest; shadow only appears as a response to hover/interaction
- One typographic flourish (bold heading, then italic-light continuation) used sparingly, never as a tic
- Density stays calm even as the catalog grows — whitespace is structural, not optional

## 2. Colors

Ink-on-paper neutrals with a single warm accent. The system is Restrained on the commitment axis: terracotta covers a deliberately small percentage of any screen.

### Primary
- **Burnt Terracotta** (`#b5562f`): the marketplace's one carried color. Primary buttons, sale badges, focus states, links that need to stand out from default ink. Never used for body text or large fills.
- **Deep Terracotta** (`#96431f`): hover/active state for terracotta elements. Always darker, never lighter — hover deepens, it doesn't brighten.
- **Clay Whisper** (`#f5e6df`): the tint version of terracotta, used only as a badge background paired with Deep Terracotta text (never paired with full-strength Burnt Terracotta text — contrast fails there).

### Neutral
- **Near-Black Ink** (`#1a1a1a`): default body text, primary button fills, default icon color.
- **Soft Ink** (`#333333`): hover state for ink-filled buttons; secondary text where Near-Black would be too heavy.
- **Muted Graphite** (`#6b6b6b`): secondary copy, captions, vendor names, helper text. This is the floor for body text — anything lighter risks failing the 4.5:1 contrast minimum on Pure Paper.
- **Faint Graphite** (`#a3a3a3`): placeholder text and disabled icons only. Never used for content the user must read to complete a task.
- **Pure Paper** (`#ffffff`): default page background, card fills, primary button text.
- **Soft Paper** (`#fafafa`): secondary surface, e.g. modal footers, subtly recessed panels.
- **Warm Paper** (`#f5f5f5`): image placeholder backgrounds, skeleton-loading fill, the "empty frame" color before a real image loads.
- **Hairline Grey** (`#e5e5e5`): default border/divider color.
- **Strong Hairline** (`#d4d4d4`): border color on hover, or where a divider needs to read slightly more present.

### Named Rules
**The Rare Accent Rule.** Terracotta appears on primary CTAs, sale badges, and focus rings only — never as a section background, a large fill, or decoration. If you're reaching for terracotta a third time on the same screen, stop and ask whether ink would do the job.

**The Darken-on-Hover Rule.** Every interactive color state gets darker on hover/active, never lighter. Soft Ink, Deep Terracotta — the pattern holds across the whole system.

### Semantic colors (state vocabulary)
- **Forest Confirm** (`#15803d`): success states, confirmations.
- **Amber Caution** (`#a16207`): warnings, pending states.
- **Signal Red** (`#b91c1c`): errors, destructive actions, low-stock badges.
- **Trust Blue** (`#1d4ed8`): informational states.
- **Rating Gold** (`#f5b400`) / **Gold Whisper** (`#fdf0d5`): star ratings only. Never repurposed as a generic warning or highlight color — it's reserved for the review/rating system so it keeps a single, recognizable meaning.

## 3. Typography

**Body & Display Font:** Inter (with `system-ui, -apple-system, Segoe UI, sans-serif` fallback)

**Character:** One family carries the whole system — confident and unfussy, not a display/body pairing. The voice comes from weight and italics, not from a second typeface.

### Hierarchy
- **Heading** (700, 24–60px depending on context, 1.2 line-height, -0.01 to -0.02em tracking): section titles, hero headlines. Hero scales up to `text-6xl` (clamp territory) but never beyond; product/dashboard headings stay fixed-rem.
- **Body** (400, 14–16px, 1.5 line-height): paragraph copy, descriptions. Cap prose at 65–75ch.
- **Label** (700, 10px, uppercase, 0.25em tracking — the `eyebrow` token): small-caps section labels. Reserved for sections that genuinely need a category marker, not a default stamped above every heading.

### Named Rules
**The Earned Label Rule.** The uppercase tracked label (`tracking-eyebrow`) is a device, not a default. Apply it to at most 2–3 sections per page — the ones where a category marker actually helps orientation. A heading can stand on its own weight and size without one.

**The One Flourish Rule.** The bold-heading-then-italic-light-continuation pattern (e.g. "The brands you want — *finally, in one place.*") is the system's single signature typographic move. Use it once or twice per page, never as a section-by-section tic.

## 4. Elevation

Flat by default. Surfaces sit at rest with no shadow; a soft shadow (`shadow-card`) appears only on cards holding content, and deepens (`shadow-hover`) purely as a response to hover or active interaction — never as ambient decoration on static elements.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.04)`): default resting shadow for cards and panels — barely perceptible, just enough to lift content off the page.
- **Hover** (`0 2px 6px rgba(0,0,0,.06), 0 10px 24px rgba(0,0,0,.06)`): the response state when a card/element is interactive and hovered.

### Named Rules
**The Response-Only Rule.** Shadow strength only ever increases in response to interaction (hover, active, modal-open). A static, non-interactive surface never carries the "hover" shadow weight.

## 5. Components

### Buttons
- **Shape:** 4px radius (`rounded`), pill (`9999px`) used selectively for hero CTAs only, not as the default button shape.
- **Primary:** Near-Black Ink fill, Pure Paper text, Soft Ink on hover/active. The default action everywhere.
- **Accent:** Burnt Terracotta fill, used only when an action needs to stand apart from the default ink button (rare; most CTAs should stay primary/ink).
- **Secondary / Outline / Ghost:** Pure Paper fill with ink border (secondary), Hairline Grey border (outline), or no border/fill at rest (ghost) — all resolve to ink text, all darken or fill on hover.
- **Hover / Focus:** 200ms ease-soft transition; focus-visible gets a 2px Near-Black Ink ring with 2px offset on Pure Paper.

### Badges
- **Style:** Uppercase, bold, wide tracking, small (10px), `rounded-sm` (3px) corners — never pill-shaped, to keep them visually distinct from buttons.
- **Accent variant:** Clay Whisper background with Deep Terracotta text — used exclusively for sale/discount badges (`-20%`), never for generic tags.
- **Danger variant:** Solid Signal Red fill — reserved for low-stock and urgent states.

### Cards / Containers
- **Corner Style:** 8px radius (`rounded-lg`).
- **Background:** Pure Paper.
- **Shadow Strategy:** Card shadow at rest; Hover shadow only when `interactive` is set and the card is hovered.
- **Border:** None by default — depth comes from shadow, not border.
- **Internal Padding:** 20px default, 24–32px for larger feature cards.

### Inputs / Fields
- **Style:** Pure Paper fill, Hairline Grey border, 4px radius, 44px height.
- **Focus:** Border shifts to Near-Black Ink — no glow, no ring on the input itself (the ring lives on buttons/links via `focus-visible`).
- **Error:** Border shifts to Signal Red; helper text below in the same red.

### Navigation
- Eyebrow-style labels (uppercase, tracked) are acceptable in nav/breadcrumb contexts where they're functional wayfinding, not decorative section markers.

### Motion & Feedback
- **Wishlist / like toggle:** a single scale "pop" (1 → 1.3 → 1, 250ms, ease-out-quint) plays only on the click that changes the state — never on mount, never repeating. Conveys "saved," not decoration.
- **Horizontal shelves** (featured brands, best-rated row): `scroll-snap` with `snap-start` children turns a plain overflow-scroll into a deliberate shelf the user can flick through, not a default behavior.
- **Image hover zoom** (`scale-105`, 500ms, ease-soft): the one entrance-adjacent motion this system allows, reserved for hover on product/editorial imagery — never on page load.

### Named Rules
**The Earned Motion Rule.** Motion conveys a state change (saved, hovered, scrolled) or it doesn't ship. No orchestrated page-load reveals, no fade-and-rise on scroll for every section — that choreography is itself an AI tell. Every transition respects `prefers-reduced-motion`: durations collapse to instant, not removed silently.

## 6. Do's and Don'ts

### Do:
- **Do** keep terracotta to primary actions, sale badges, and focus states — the Rare Accent Rule.
- **Do** darken on hover/active for every interactive color (Soft Ink, Deep Terracotta) — never lighten.
- **Do** keep shadows flat at rest, response-only on hover (Card → Hover).
- **Do** cap the uppercase tracked label to 2–3 sections per page (the Earned Label Rule) — it is a device, not a default.
- **Do** maintain 4.5:1 contrast minimum for body text; Muted Graphite (`#6b6b6b`) on Pure Paper is the floor, don't go lighter for "elegance."

### Don't:
- **Don't** stamp an uppercase tracked eyebrow label above every section — this is the exact AI-template tell PRODUCT.md flags as an anti-reference.
- **Don't** repeat the same product-grid section structure back-to-back more than once on a single page (identical card grids ban).
- **Don't** use gradient text, side-stripe borders, or glassmorphism as decoration — none of these exist in this system and none should be introduced.
- **Don't** use Rating Gold for anything other than the star-rating system — it has one meaning and keeps it.
- **Don't** use Faint Graphite (`#a3a3a3`) for any text the user needs to read to complete a task — placeholders and disabled states only.
- **Don't** introduce a second display typeface. Inter carries the whole system; voice comes from weight/italics, not a second family.
- **Don't** add orchestrated page-load animations (staggered fade-and-rise on every scrolled section) — the Earned Motion Rule reserves motion for real state changes.
- **Don't** ship any transition or animation without a `prefers-reduced-motion` fallback — it's a global rule in `index.css`, not a per-component decision.
