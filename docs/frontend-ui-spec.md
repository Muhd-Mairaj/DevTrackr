# DevTrackr Frontend UI Spec

**The canonical reference for all AI agents working on the DevTrackr frontend.**
If a UI decision is not covered here, follow the closest existing pattern in `frontend/src/components` and note the gap. Do not invent new tokens, fonts, or component styles.

**How to use this document:**

1. Read section 11 (Always / Never cheat sheet) first. It is the fastest way to avoid a violation.
2. Read the section relevant to the work: tokens before colors, components before markup, copy before writing strings.
3. Section 2 (Token system) is the only source of truth for values. Components never hardcode raw colors, radii, or spacings.
4. When in doubt, match the existing components in `frontend/src/components` rather than creating new ones.

---

## 1. Design principles

DevTrackr is a **logbook**: a structured, verifiable record of what a developer built, when, and for how long. The UI is the digital version of that record.

- **Ledger structure.** Dense rows, hairline rules, day-stamp page headers, and monospace data columns. Order carries meaning: chronology is the content.
- **GitHub-forward register.** Neutral gray palette, flat status chips, dense rows, functional motion only. Familiar to every developer; the product must never be the thing the user has to think about.
- **Data speaks in mono.** Timestamps, durations, hashes, IDs, and counts are set in IBM Plex Mono with tabular figures so columns align.
- **One voice in copy.** Plain verbs, sentence case, no filler, no em dashes. Errors explain and direct. Empty states invite action.
- **i18n-ready from day one.** No user-visible string is hardcoded in a component (section 8).

---

## 2. Token system

Source of truth lives in `frontend/src/index.css` as CSS custom properties in `:root` (light) and `.dark` (dark), mapped through Tailwind v4 `@theme`. Hex values below are normative; oklch values are the exact equivalents to use in the stylesheet.

### 2.1 Color: light mode

| Token | Hex | oklch | Use |
|---|---|---|---|
| `background` | `#F6F8FA` | `oklch(0.9782 -0.0013 -0.0032)` | Page background |
| `card` | `#FFFFFF` | `oklch(1 0 0)` | Raised surfaces: cards, panels, inputs |
| `foreground` | `#1F2328` | `oklch(0.2542 -0.0031 -0.0107)` | Primary text |
| `muted-foreground` | `#656D76` | `oklch(0.531 -0.0055 -0.0163)` | Secondary text, meta, captions |
| `border` / `rule` | `#D0D7DE` | `oklch(0.8758 -0.0046 -0.0114)` | Hairlines, table rules, panel borders |
| `edge` | `#AFB8C1` | `oklch(0.7783 -0.0061 -0.0151)` | Strong borders: secondary buttons, inputs, selects, tags |
| `primary` | `#0969DA` | `oklch(0.5399 -0.0413 -0.1861)` | Primary buttons, links, active states, focus |
| `primary-foreground` | `#FFFFFF` | `oklch(1 0 0)` | Text on primary |
| `destructive` / `error` | `#CF222E` | `oklch(0.5517 0.1866 0.0851)` | Errors, destructive actions, "Failed" chips |
| `success` | `#1A7F37` | `oklch(0.5244 -0.1188 0.0741)` | "Synced", "Active", positive states |
| `warning` | `#9A6700` | `oklch(0.5542 0.0302 0.1129)` | "Pending", warnings |
| `ring` | `#0969DA` | (primary) | Focus rings |

Chart palette (`chart-1..6`): `#0969DA` blue, `#1A7F37` green, `#CF222E` red, `#8250DF` purple, `#9A6700` amber, `#1B7C83` teal.

### 2.2 Color: dark mode

| Token | Hex | oklch | Use |
|---|---|---|---|
| `background` | `#0D1117` | `oklch(0.1763 -0.0028 -0.0137)` | Page background |
| `card` | `#161B22` | `oklch(0.2202 -0.0036 -0.0153)` | Raised surfaces |
| `foreground` | `#E6EDF3` | `oklch(0.9425 -0.0049 -0.0099)` | Primary text |
| `muted-foreground` | `#9198A1` | `oklch(0.6769 -0.0041 -0.015)` | Secondary text |
| `border` / `rule` | `#30363D` | `oklch(0.33 -0.0045 -0.0142)` | Hairlines, rules, panel borders |
| `edge` | `#444C56` | `oklch(0.4132 -0.0054 -0.0189)` | Strong borders |
| `primary` | `#4493F8` | `oklch(0.6632 -0.0412 -0.1641)` | Primary buttons, links, focus |
| `primary-foreground` | `#FFFFFF` | `oklch(1 0 0)` | Text on primary |
| `destructive` / `error` | `#F85149` | `oklch(0.6651 0.1824 0.0928)` | Errors, destructive actions |
| `success` | `#3FB950` | `oklch(0.6951 -0.1493 0.1022)` | Positive states |
| `warning` | `#D29922` | `oklch(0.7196 0.0245 0.138)` | Warnings |

Chart palette (dark): `#4493F8` blue, `#3FB950` green, `#F85149` red, `#D2A8FF` purple, `#D29922` amber, `#39C5CF` teal.

### 2.3 Rules

- Components use only semantic Tailwind classes (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). Raw hex appears only in `index.css`.
- Status chips use the semantic colors from 2.1/2.2. Meaning is fixed: green = active/synced/success, gray = inactive/neutral, amber = pending/warning, red = failed/error/destructive, blue = informational (e.g. "AI ready").
- Light and dark are the same structure. Every element that exists in light mode exists in dark mode with the mapped token.

### 2.4 Shape and space

| Token | Value | Use |
|---|---|---|
| `--radius` | `0.375rem` (6px) | Buttons, inputs, cards, panels |
| `--radius-sm` | `3px` | Chips, tags, stamps |
| `--radius-lg` | `0.75rem` (12px) | Dialogs, popovers |
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 | All margins and paddings |
| Section gaps | 24px (32px between major blocks) | Page rhythm |
| Content width | `max-w-6xl` (1152px), centered | All pages |
| Nav height | 48px | Top nav |

### 2.5 Dark mode strategy

Class-based: `.dark` on the root element flips the CSS variables (existing shadcn pattern). Default follows the system preference; a manual toggle in the nav is planned. No per-page dark overrides.

---

## 3. Typography

| Role | Face | Weight | Notes |
|---|---|---|---|
| Body and UI | Schibsted Grotesk | 400 / 500 / 600 / 700 | Buttons, labels, cards, tables, forms |
| Headings | Schibsted Grotesk | 600 / 700 | No serif display face exists in this design |
| Data and code | IBM Plex Mono | 400 / 500 | Timestamps, durations, hashes, IDs, mono labels |

Self-hosted via `@fontsource/schibsted-grotesk` and `@fontsource/ibm-plex-mono`. No CDN fonts: DevTrackr is self-hosted and must work offline.

### Type scale

| Class | Size | Use |
|---|---|---|
| `text-xs` | 12px | Labels, hints |
| `text-[13px]` | 13px | Body default in dense surfaces |
| `text-sm` | 14px | Default UI size |
| `text-base` | 16px | Card titles, nav wordmark size |
| `text-xl` | 20px | Section headings |
| `text-2xl` | 24px | Page title (`h1`) |
| `text-4xl` | 32px | Rare, large moments (login title) |

### Rules

- **Tabular figures** on every numeral (`font-variant-numeric: tabular-nums`), mono and body.
- **Mono uppercase labels** (9.5px to 11px, letter-spacing 0.08em to 0.14em) for: day-stamp dates, table headers, chips, tags, panel meta. Uppercase is reserved for these; sentences are never uppercase.
- Headings and the wordmark use `tracking-tight` (`-0.01em`).
- Body line height 1.45; headings 1.3. Description text lines stay under ~70 characters.
- Dates: `THU · 31 JUL 2026` (day-stamp) and `2026-07-31` (tabular data). Durations: always `HH:MM`.

---

## 4. Component inventory

Every component: purpose, variants, tokens, and do-not rules. Status chips and tags are described in 4.3.

### 4.1 Buttons

Variants: `primary` (primary bg, white text), `secondary` (transparent, `edge` border), `ghost` (no border, muted text), `destructive` (error bg, white text). Sizes: default, `sm`, `icon`. Disabled at 45% opacity.

- Label is the action verb in sentence case: "New project", "Save changes", "Connect GitHub". Never "Submit".
- Destructive actions use `destructive`; a destructive confirm inside a dialog is a small destructive button.
- The action name is carried through the flow: button "Delete" produces toast "Project deleted".

### 4.2 Forms

Inputs: `card` background, `edge` border, `--radius`, focus ring is a 2px `ring` outline with 1px offset.

- Label (600 weight, 11.5px) above input, hint below in muted 11px.
- Error: `edge` border becomes `error` color; message below in error color with a warning glyph, never just the border.
- Selects use the same shell with a chevron glyph.
- Toggle and checkbox: checked = `primary`. Toggle knob is white, 16px on a 34x20 track.
- All forms use react-hook-form + zod (existing setup); messages come from the central strings module (section 8).

### 4.3 Status chips and tags

**Status chips** (the "stamps", now flat): mono uppercase 9.5px, letter-spacing 0.12em, 3px radius, tinted background at ~10% of the color, colored text. No rotation, no double border. Tint formula: `color-mix(in oklab, <color> 10%, transparent)`.

- Semantics are fixed (section 2.3): `Synced`/`Active` = success green, `Pending` = warning amber, `Failed` = error red, `AI ready` = informational blue, `Inactive` = neutral gray.
- Chips describe states only. Do not invent new colors; use the five semantic slots.

**Tags** (categories such as `toggl`, `github`, `backend`): neutral chip, tinted `ink` at ~7%, ink-colored text, 3px radius. Tags never carry semantic color.

### 4.4 Tabs and segmented control

Tabs: hairline bottom border, active tab has 2px `primary` underline and foreground color. Segmented control: tinted track (ink 6%), active segment on `card` with subtle shadow.

### 4.5 Cards

- **Project card**: title (600, 14px), description (12px muted), footer with mono timestamp line, hairline top border. Status chip in the header row.
- **Connection card**: provider monogram tile (26px, ink 6% tint, mono), name + mono sub-line, right side holds the status chip or a small secondary "Connect" button.
- **Stat card / KPI strip**: three or four cells separated by hairline rules; number in mono 500 with tabular figures, label in 11px muted below.

### 4.6 Data table

Dense, GitHub-style. Header row: mono uppercase 9.5px muted labels with hairline bottom rule. Cells: 12.5px, hairline rules, row hover tint at `link` 4% with no box-shadow. Mono cells for hashes, dates, durations. Sortable headers get a small arrow glyph (lucide).

### 4.7 Ledger rows (signature)

Grid of columns: time range (mono, muted) / duration (mono, 500) / hash (mono, `link` color) / description (500, truncated) / optional tag. Hairline separators. Hover: `link` 4% tint plus a 2px `link` inset left rule.

- Row padding 8px 12px. On mobile the row reflows: time + duration on the first line, description on the second (section 5.5).
- Rows render only the columns configured for the logbook (4.9).

### 4.8 Expandable composite row

For days with multiple entries compressed behind an AI summary (or any grouped entry).

- Collapsed: ledger row showing the day or time range, total duration, the AI summary clamped to one or two lines, a count chip ("3 entries"), and a chevron.
- Expanded: the individual entry rows appear beneath, indented 20px under the summary line, each as a normal ledger row. A subtle left rule (edge color) marks the group.
- Chevron rotates; the expansion animates ~200ms height transition.
- While the summary is being generated: summary text is replaced by a skeleton line.

### 4.9 Column manager

The logbook customization surface for one project, opened from the project page header. Its config is stored per project on the backend (`GET/PUT /projects/{id}/columns`); Settings no longer hosts it. It controls both the in-app logbook table and the output logbook document.

- One row per column: drag handle, inline-editable name input, mono type label (TIME / DURATION / SOURCE / DESCRIPTION / CUSTOM), remove button.
- "Add column" opens a small choice of column types. Built-in columns (time, duration, source, description) can be renamed but not removed; custom columns can be removed.
- At least one column must remain.
- Rule: the logbook table renders exactly the configured columns in the configured order; new or renamed columns appear in the output logbook the same way.

### 4.10 Progress

Track 6px, `ink` 8% tint background, fill in `primary`, mono label to the right ("12.5h / 15h · 83%"). Used for weekly goals and similar targets.

### 4.11 Alerts, toasts, empty states, skeletons

- **Error alert**: tinted error background at 8%, error-tinted border, bold error-colored lead ("Sync failed.") then a plain reason and the fix. Never an apology, never vague.
- **Toast**: card surface, `edge` border, soft shadow, success glyph in success color for confirmations. One line. Appears top-center, ~200ms slide.
- **Empty state**: centered, dashed `edge` border box; mono glyph or icon; title (600, 13px); one guidance line in muted; optional primary small button.
- **Skeleton**: ink 8% tint blocks, 4px radius, pulse. Used for loading data surfaces. Spinners only for in-flight mutations (save, connect).

### 4.12 Dialog

**Sizing:** Content-sized, never full-viewport. Default max-width `max-w-md` (448px); form dialogs with multiple fields may use `max-w-lg` (512px). On viewports narrower than 448px, `max-w-[calc(100%-2rem)]` keeps a 2rem edge guard so the dialog never touches the screen edges.

**Surface:** `card` background, `radius-lg` (12px), `border-border` hairline, shadow. Overlay is `foreground` at 25% (`bg-foreground/25`). Content area padded 24px (`p-6`). Close button at top-right, 16px from each edge.

**Structure — canonical pattern:** Every DevTrackr dialog uses the shared `AppDialog` component (`frontend/src/components/ui/app-dialog.tsx`). Consumer components never assemble their own dialog chrome from the Radix primitives directly. `AppDialog` provides:

1. Title (`text-base font-semibold tracking-tight`) — what this dialog does
2. Description (`text-xs leading-relaxed text-muted-foreground`) — the consequence, stated plainly
3. Free body content — form fields or nothing (confirm dialogs have no body)
4. Footer — right-aligned, secondary "Cancel" on the left and the action button on the right

**Variants:**

- **Confirm dialog:** Title + description only (no body). The action button calls `onAction` on click. Used for destructive confirms like "Delete project" — the action button uses the `destructive` variant.
- **Form dialog:** Title + description + form fields in the body. The form element carries an `id`, passed as `formId` to `AppDialog`, so the footer's action button submits the form via `type="submit"`.

**Footer buttons:** Cancel is always `variant="secondary"`. The action button is `variant="default"` by default (the primary-styled button), `variant="destructive"` for destructive actions. While pending, the action button shows a `Loader2` spinner and both buttons are disabled. Button labels are sentence case and describe the action: "Create project", "Delete project", "Save changes".

**Do not:** hardcode dialog chrome in consumer components, use a dialog without an `AppDialog` wrapper, set a fixed width or height on a dialog, or omit the description even for confirm dialogs (it carries the consequence).

### 4.13 Day-stamp header and nav

- **Day-stamp header**: mono uppercase 10.5px, letter-spacing 0.14em, muted color, text `THU · 31 JUL 2026`, followed by a hairline rule that extends to the content edge. Opens every page (4.14).
- **Nav**: 48px, sticky, `card` background, hairline bottom border. Wordmark + mark left, tabs (Projects, Logbook, Insights, Settings) beside, user email (mono, muted) and sign-out right.

---

## 5. Layout patterns

### 5.1 Page anatomy rule

Every page follows the same order:

1. Day-stamp header (4.13)
2. Heading (`h1`, 24px, 600) + one muted subtitle line
3. Primary action on the right of the heading row (or a header action area)
4. Content, composed from the patterns below

### 5.2 Composable patterns

- **Card grid**: 3 columns -> 2 -> 1 at breakpoints. Used for project cards and similar collections.
- **Ledger panel**: card surface with a header row (title + mono meta right) and ledger rows inside. The default for entry lists.
- **Data table**: inside a card when the surface needs sorting and denser columns.
- **KPI strip**: the 3-4 cell stat strip for summary numbers.
- **Centered auth card**: single card centered on the background, wordmark above it. Used for login.

### 5.3 Decided page blueprints

| Page | Blueprint |
|---|---|
| Projects (`/`) | Day-stamp, heading + "New project" primary, KPI strip, card grid |
| Project detail (`/projects/:projectId`) | Day-stamp, project heading with meta, paginated ledger table rendering exactly the configured columns with a configure slot, row edit/delete, mono page ruler pagination |
| Login | Wordmark, centered card with the sign-in form |
| Settings | Single column: profile fields, connection cards (Toggl / GitHub / AI provider) |

### 5.4 Undecided pages

The logbook and insights pages are not yet fixed. When building them, compose from the patterns in 5.2 following the anatomy rule in 5.1. Keep the ledger panel as the default surface for entry lists.

### 5.5 Responsive behavior

Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280.

- Card grids collapse to 1 column.
- Ledger rows reflow: time + duration on the first line, description below (tag moves to the end of the first line).
- Tables scroll horizontally inside their card, or the page switches to ledger rows.
- Nav tabs scroll horizontally rather than wrap.
- All touch targets at least 44px.
- The design is built mobile-first: compose the mobile layout first, then add columns.

---

## 6. States and errors

Every data surface defines three states:

- **Loading**: skeleton rows matching the final shape (4.11).
- **Empty**: the empty-state pattern with a single clear next action (4.11).
- **Error**: error alert at the top of the surface, with the reason and the fix, plus a retry where the operation is repeatable (4.11).

Error copy formula: **bold lead** (what failed, in the interface's voice) + plain reason + the fix. Example: "Sync failed. Toggl returned 401. Check your credentials and reconnect."

Errors never: apologize, use exclamation marks, or leave the user without a next step.

---

## 7. Copy and voice

- Plain verbs, sentence case, no filler.
- A control says exactly what happens when used: "Save changes", "Connect GitHub", "Delete project".
- The action keeps the same name through the flow: "Publish" produces "Published", "Delete" produces "Project deleted".
- Users manage things they recognize: "time sources", "logbook columns", not implementation names.
- Empty screens are invitations to act, not dead ends.
- Dates and durations follow the formats in section 3. Numeric ranges use en dashes (`09:41–11:05`).

### 7.1 No em dashes (hard rule)

Em dashes are not allowed anywhere in the frontend codebase, including code comments and docs that live in `frontend/`. If a sentence seems to need one, rephrase the sentence. Use a comma, a colon, or two sentences instead.

---

## 8. i18n conventions (Tolgee-ready)

No user-visible string is hardcoded in a component. All copy lives in a single central strings module (`frontend/src/lib/strings.ts`), exported as typed keys.

- Strings are semantic and complete: never assemble sentences from fragments, never reuse a fragment across two sentences.
- Use placeholders (ICU-style) for values: `entries_count: "{count} entries"`. No string concatenation for grammar.
- Dates, durations, and numbers go through centralized formatters (the same mono/tabular formats as section 3), never ad-hoc `toLocaleString` calls.
- Icons and SVGs carry no translatable text. `aria-label`s also live in the strings module.
- When Tolgee is introduced, extraction is mechanical: keys map one-to-one.

---

## 9. Motion and accessibility

### 9.1 Allowed motion

- Hover transitions: 150-200ms ease-out.
- Expandable composite rows: 200ms height transition, chevron rotates.
- Toasts: 200ms slide.
- Skeleton pulse for loading.
- Nothing else. No scroll-triggered reveals, no parallax, no bounce, no floating elements. The product is a working instrument, not a marketing page.

### 9.2 Accessibility

- `prefers-reduced-motion` disables all non-essential animation.
- Visible focus: 2px `ring` outline, 1px offset, on every interactive element.
- Contrast: all text combos meet WCAG AA in both modes (the token pairs in section 2 are chosen to pass).
- Icon-only buttons carry an `aria-label`.
- Semantic HTML: real buttons, real tables for data, real headers for headings.
- Keyboard: dialogs trap focus and close on Escape; expandable rows toggle on Enter/Space.

---

## 10. Logo and wordmark (provisional)

The final logo is not designed yet. Until then, a provisional mark is used, defined once as an SVG component (`frontend/src/components/logo-mark.tsx`):

- 24x24 rounded square, 6px radius, `primary` background.
- Two white ruled lines (top and middle, 1.6px stroke, rounded caps), a shorter second line, a white-ringed dot in the bottom-right as the "stamp" accent.
- Wordmark: "DevTrackr" in Schibsted Grotesk 600, `tracking-tight`.

Guardrails for the real logo:

- Must read at 16px (favicon) and in monochrome.
- Must hold up in both modes against `background` and `card`.
- Lives as a single component; swapping it touches one file.

---

## 11. Always / Never cheat sheet

### Always

- Use semantic tokens from section 2; never raw values in components.
- Open every page with the day-stamp header, then heading, then actions.
- Mono + tabular figures for times, durations, hashes, IDs, counts.
- Status chips for states, using the five semantic colors.
- Sentence case; action verbs on buttons; same action name through the flow.
- Define loading (skeleton), empty (CTA), and error (reason + fix) states for every data surface.
- Route every user-visible string through the central strings module.
- Add a visible focus ring and respect `prefers-reduced-motion`.
- Test at 1-column mobile width before claiming a layout is done.
- Match existing components in `frontend/src/components` before building new ones.

### Never

- No em dashes anywhere in the frontend codebase. Rephrase instead.
- No hardcoded user-visible strings in components.
- No raw hex outside `index.css`.
- No serif display face, no rotated stamps, no decorative motion.
- No new tokens, fonts, or colors without updating this document.
- No "Submit" button labels, no apology in errors, no exclamation marks in errors.
- No uppercase sentences; uppercase is reserved for mono labels.
- No fixed-height or non-scrolling page content on mobile.

---

## 12. Implementation map

| Concern | Location |
|---|---|
| Color, radius, font tokens | `frontend/src/index.css` (`:root` and `.dark`) |
| Fonts | `@fontsource/schibsted-grotesk`, `@fontsource/ibm-plex-mono` in `package.json` + imports in `index.css` |
| Base components | `frontend/src/components/ui/*` (button, card, badge, input, form, tabs, dialog, app-dialog, ...) |
| App components | `frontend/src/components/*` (`app-nav`, `project-card`, ...) |
| Strings | `frontend/src/lib/strings.ts` |
| Logo mark | `frontend/src/components/logo-mark.tsx` |
| Theme | `.dark` class on root; system default, manual toggle later |
