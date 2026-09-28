# DevTrackr Frontend UI Spec

> **Superseded (Daybook).** The canonical design system is now [`design.md`](../design.md)
> at the repository root: genre modern-minimal, warm-paper light-first, Schibsted Grotesk +
> IBM Plex Mono, a masthead + transport-dock shell, and document-style pages. This v3
> "Instrument Console" spec is kept for history only. Build against `design.md`.

**Version 3.0, the "Instrument Console" identity.** This replaces the v2 "Signal" reskin in full. v2 changed the paint; v3 changes the machine: navigation, home, and the signature surface are all new. If a decision is not covered here, follow the closest existing pattern in `frontend/src/components` and note the gap. Do not invent new tokens, fonts, or component styles.

**How to use this document:**

1. Read section 13 (Always / Never cheat sheet) first.
2. Read section 2 (tokens) before any color or shape, section 4 (brand) before chrome, section 5 (shell) before any page, section 6 before markup, section 10 before writing copy.
3. Section 2 is the only source of truth for values. Components never hardcode raw colors, radii, or spacings.
4. When in doubt, match existing components rather than creating new ones.

---

## 1. What changed and why

v2 was a reskin: same top nav, same date header, same KPI strip, same card grid, same table, new paint. v3 is a rebrand of the product's structure.

- **Navigation is a rack, not a bar.** A persistent left sidebar (desktop) plus a command palette (`Cmd/Ctrl-K`) replace the top nav. On mobile, a bottom tab bar replaces it.
- **Home is a live console, not a dashboard.** The first screen answers "what am I tracking right now": a running-session hero, a today timeline, a portfolio readout, and a project rack. No card grid, no KPI strip.
- **The signature surface is a time-lane, not a table.** A project's default view renders entries as bars on a 24-hour ruler, day by day. The table survives as the day-grouped **Ledger** view for editing and export.
- **The brand mark is a signal trace.** A measurement glyph, not a dial.

The product's job is unchanged: it is a precision instrument for measuring developer work.

### 1.1 Design principles

- **Instrument, not dashboard.** The interface is a console: rack, readouts, lanes, lamps. It looks calibrated, not decorated.
- **One signal.** A single lime accent marks the one live or primary thing. Everything else is ink, panel, or hairline.
- **Readouts, not labels.** Every number, time, and duration is mono with tabular figures and sits in a ruled readout.
- **Structure before surface.** A module earns its frame; nothing floats, nothing is a pill, nothing is a soft shadow except dialogs.
- **One voice in copy.** Plain verbs, sentence case, no filler, no em dashes.

---

## 2. Token system

Source of truth lives in `frontend/src/index.css` as CSS custom properties in `:root` (light, "Paper") and `.dark` (dark, "Console"), mapped through Tailwind v4 `@theme inline`.

Dark is the designed-for mode. Both modes ship and must be equally resolved.

### 2.1 Color: light mode, "Paper"

| Token | Hex | Use |
|---|---|---|
| `background` | `#F3F5EE` | Page canvas |
| `card` | `#FFFFFF` | Modules, inputs, dialogs |
| `foreground` | `#12160D` | Primary text, ink |
| `muted` | `#E9EDE1` | Recessed tracks, hovers, skeletons |
| `muted-foreground` | `#5B6552` | Secondary text, meta, labels |
| `border` | `#DCE1D2` | Hairlines, module edges, rules |
| `edge` | `#8A9679` | Control outlines (3:1 on card) |
| `primary` / `signal` | `#A3E014` | The one live or primary thing |
| `primary-foreground` | `#10150C` | Ink on signal |
| `ring` | `#5F8A00` | Focus ring |
| `destructive` | `#B42318` | Errors, destructive |
| `success` | `#3F6B00` | Positive states |
| `warning` | `#8A5A00` | Pending, warnings |
| `info` | `#1D4ED8` | Informational |
| `sidebar` | `#ECEFE4` | Sidebar bezel, one step from canvas |
| `brand-ink` | `#10150C` | Logo tile, constant |
| `brand-paper` | `#F3F5EE` | Logo trace bed, constant |

Charts: `#5F8A00`, `#A3E014`, `#8A5A00`, `#B42318`, `#1D4ED8`, `#0F766E`.

### 2.2 Color: dark mode, "Console"

| Token | Hex | Use |
|---|---|---|
| `background` | `#070906` | Page canvas, near-black |
| `card` | `#11160D` | Modules, inputs, dialogs |
| `foreground` | `#E9EEE0` | Primary text |
| `muted` | `#1A2114` | Recessed tracks, hovers |
| `muted-foreground` | `#9AA58C` | Secondary text |
| `border` | `#252E1B` | Hairlines, module edges |
| `edge` | `#5C6B45` | Control outlines (3:1 on card) |
| `primary` / `signal` | `#C6F24E` | The one live or primary thing |
| `primary-foreground` | `#070906` | Ink on signal |
| `ring` | `#C6F24E` | Focus ring |
| `destructive` | `#F0685A` | Errors |
| `success` | `#C6F24E` | Positive states (signal doubles as success) |
| `warning` | `#E0A94B` | Warnings |
| `info` | `#6BA8F5` | Informational |
| `sidebar` | `#0C100A` | Sidebar bezel, one step from canvas |
| `brand-ink` | `#10150C` | Logo tile, constant |
| `brand-paper` | `#E9EEE0` | Logo trace bed, constant |

Charts: `#C6F24E`, `#E0A94B`, `#F0685A`, `#6BA8F5`, `#39D0C4`, `#C4A2FF`.

### 2.3 Semantic rules

- Components use only semantic Tailwind classes. Raw hex appears only in `index.css`.
- Meaning is fixed: lime = signal / live / active / success, amber = pending / warning, red = failed / error / destructive, blue = informational, gray = inactive / neutral.
- One signal-filled action per view. The running session lamp is the only other standing signal.
- Light and dark share structure; every element maps.

### 2.4 Shape, space, elevation

| Token | Value | Use |
|---|---|---|
| `--radius` | `0.25rem` (4px) | Controls |
| `--radius-sm` | `0.125rem` (2px) | Lamps, tags, ticks |
| `--radius-md` | `0.375rem` (6px) | Modules, panels, table shells |
| `--radius-lg` | `0.5rem` (8px) | Dialogs, palette |
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 | Margins and paddings |
| Content width | `max-w-[1180px]`, centered in the main column | All pages |
| Sidebar width | 248px (`w-62`), desktop `lg+` | Left rack |
| Status bar | 44px | Top strip of the main column |
| Mobile tab bar | 56px | Bottom, mobile only |

**Elevation.** A hard 1px lip, never a soft blur, on controls and modules (`shadow-xs`, which maps to `0 1px 0 0 var(--border)`). Dialogs and the palette are the only soft shadows.

### 2.5 Dark mode strategy

Class-based `.dark` on the root, existing shadcn pattern. Default follows system; the control in the rack footer cycles system / dark / light. No per-page overrides.

---

## 3. Typography

| Role | Face | Weights | Notes |
|---|---|---|---|
| UI, headings | Space Grotesk | 400 / 500 / 600 / 700 | Labels, modules, controls, titles |
| Data, readouts | JetBrains Mono | 400 / 500 / 700 | Times, durations, counts, IDs, mono labels |

Self-hosted via `@fontsource/space-grotesk` and `@fontsource/jetbrains-mono`. No CDN fonts.

### 3.1 Scale

| Class | Size | Use |
|---|---|---|
| `text-[10px]` | 10px | Mono labels, lamps, ticks, tags |
| `text-xs` | 12px | Meta, hints |
| `text-[13px]` | 13px | Dense body, table cells |
| `text-sm` | 14px | Default UI |
| `text-base` | 16px | Module titles |
| `text-xl` | 20px | Section headings, readout numbers |
| `text-2xl` | 24px | Page titles |
| `text-4xl` | 36px | The running-session elapsed clock only |

### 3.2 Rules

- Tabular figures on every numeral.
- Mono uppercase labels at 10px with 0.12em to 0.16em tracking for: section labels, module headers, lamps, tags, lane ticks, meta.
- Headings `tracking-tight`; page titles `-0.02em`.
- Dates `SUN · 27 SEP 2026` in readouts, `2026-09-27` in data. Durations `HH:MM`. Ranges use en dashes.

---

## 4. Brand

### 4.1 Mark, "signal trace"

One component, `frontend/src/components/logo-mark.tsx`, plus `frontend/src/components/brand-lockup.tsx` for mark + wordmark.

- An ink tile (`brand-ink`, radius 5, 0.5px `border`) carrying a lime **signal trace**: a flat baseline with two peaks, the polyline of measured activity. A paper dot marks the trace origin.
- Not a dial, not a stamp, not a letter in a box. It reads as a waveform at 16px and in monochrome.
- Wordmark: "DevTrackr" in Space Grotesk 700, `tracking-[-0.02em]`, with the mark to its left. The lockup sits at the top of the rack and above the auth module.
- Favicon mirrors the trace (`frontend/public/favicon.svg`).

### 4.2 Readout header

Every workspace page opens with a readout line, rendered by `frontend/src/components/day-stamp.tsx`.

- A 6px `signal` dot, the date in mono uppercase 10px with 0.16em tracking, then a tick rule to the content edge.
- Example: `● SUN · 27 SEP 2026 ─┊────┊────`.

### 4.3 Instrument rule

- `.tick-rule`: 1px `border` hairline with 1px ticks every 16px. Used as a section divider and inside the status bar.
- The page canvas is flat. No background grid or texture: the rail, hairlines, and modules carry the structure.

### 4.4 Signal lamp

The status primitive (`status-chip.tsx`): a 6px dot plus a mono uppercase label on a tint of its own color, 2px radius. Tones: lime (live/active/success), amber (pending), red (failed), blue (informational), gray (neutral). A running lamp pulses (`.signal-pulse`, off under reduced motion).

---

## 5. Shell and navigation

The shell lives in `frontend/src/routes/__root.tsx` and `frontend/src/components/nav/`.

### 5.1 Sidebar rack (desktop, `lg+`)

248px, fixed, full height, `sidebar` bezel with a right hairline. Top to bottom:

1. **Brand lockup** (`BrandLockup`), linking to `/console`.
2. **Primary nav** as a vertical rack. Items: Console (`/`), Settings (`/settings`). Each item is a full-width row: icon, label, and a 6px signal dot when active. Active row sits on `card` with a hairline and a left 2px signal rail.
3. **Now block** at the bottom of the nav: the current running session (project name, live elapsed clock, pause action) or a secondary "Start a session" action. This is the rack's anchor.
4. **Footer**: theme cycle, signed-in email (mono), sign out.

### 5.2 Status bar (main column)

44px sticky strip at the top of the main column: the current section name and readout date on the left; a **command trigger** button (search glyph plus `K` keycap), theme toggle, and the user cluster on the right. On mobile, the status bar also carries the brand lockup.

### 5.3 Command palette

`Cmd/Ctrl-K`, or a plain `K` when the focus is not in a field, opens a palette built on the shared `Dialog` primitives: a search field, then a grouped command list. Commands: Go to Console, Go to Settings, New project, New entry (when in a project), Toggle theme, Open keyboard shortcuts, Sign out. Arrow keys move selection, Enter runs, Escape closes. The palette is the primary keyboard navigation surface; new commands register through a small provider in `frontend/src/components/nav/command-palette.tsx`. The status-bar hint shows the platform modifier (`⌘K` on macOS, `Ctrl K` elsewhere).

### 5.4 Mobile

Below `lg`: no sidebar. A 56px bottom tab bar carries Console, New (opens the create-entry or create-project dialog), and Settings. The status bar stays. Touch targets at least 44px.

---

## 6. Modules and components

### 6.1 Module

`frontend/src/components/ui/panel.tsx` is the module primitive.

- `Panel`: `card` fill, `border` hairline, `--radius-md`, `shadow-xs`, `relative overflow-hidden`.
- `PanelHeader`: mono uppercase label left, mono meta right, bottom hairline, `px-4 py-2.5`.
- `PanelBody`: `p-4`; `p-0` for lanes and tables.
- `PanelTicks`: corner crosshairs, used on readout and empty modules only.

### 6.2 Buttons

Variants `default` (signal, one per view), `secondary`, `outline`, `ghost`, `link`, `destructive`. Sizes `xs`/`sm`/`default`/`lg`/`icon`. 1px lip, `active:translate-y-px`. Sentence-case action verbs, never "Submit".

### 6.3 Rack rows

The project rack row (the repurposed `projects/project-card.tsx`) is a full-width module row, not a card:

- Left: project name (600, 14px) over a mono meta line (repos count, updated).
- Middle: repo tags.
- Right: a status lamp, ghost edit/delete, and an "Open" link action.
- Hover: border lifts to `edge`. No grid.

### 6.4 Readout module

A ruled strip of 3-4 cells split by hairlines. Number in mono `text-xl` 500 tabular, label in 10px mono uppercase muted. Used for portfolio and per-project stats.

### 6.5 Lamps and tags

Unchanged from v2 in behavior: lamps for state, tags for category, both 10px mono uppercase, 2px radius. See 4.4.

### 6.6 Forms, dialogs, toasts, states

- Inputs: `card`, `edge`, `--radius`, 1px lip, focus ring.
- Dialogs: `AppDialog` only, `--radius-lg`, `shadow-lg`, overlay `brand-ink/55`. Consumer components never assemble dialog chrome.
- Toasts: `card`, `edge`, 1px lip, top-center.
- Loading: skeleton bars; empty: dashed frame with corner ticks and a signal-tinted icon; error: bold destructive lead plus reason and fix.

---

## 7. Signature surface: the time-lane

`frontend/src/components/entries/time-lane.tsx`. This is the product's calling card.

- A horizontal 24-hour ruler (00 to 24) with hour ticks; the current time marker is a 1px `signal` line with a lamp when the day is today.
- One lane per calendar day, newest first. Each lane has a mono day header (`MON · 22 SEP`) and a right-aligned total duration.
- Entries render as bars positioned by clock time and sized by duration: `signal` for the running entry, `info`-tinted for completed entries, `card` fill with a hairline otherwise. A bar shows its description when wide enough; clicking it opens the entry editor.
- The running entry extends to the current time and pulses.
- Empty lanes are omitted. A day with no entries never renders a lane.
- The lane is the default project view. The **Ledger** is a day-grouped record: a mono day header with the day total, then entry rows, each duration shown as a value plus a proportional micro-bar (signal while running). The Ledger is for edit, delete, export, and column configuration.
- **Activity** is two modules: linked repositories, and a 14-day tracked-activity strip built from the project's entries.
- **Notes** is a field-notes surface: a composer module plus ruled note rows with mono timestamps.

---

## 8. Pages

| Page | Blueprint |
|---|---|
| Console (`/`) | Readout header, **Now** module (running session or start CTA), **Today** lane, **Portfolio** readout, **Projects** rack, **Recent** activity |
| Project (`/projects/:projectId`) | Readout header, project title plus mono meta, module rail: **Timeline** (time-lane, default), **Ledger**, **Activity**, **Notes**. Header actions: Columns, Export CSV, New entry (the signal action) |
| Login (`/login`) | Centered auth module with the lockup, no shell chrome |
| Settings (`/settings`) | Readout header, connection modules (GitHub, future providers) |

### 8.1 Page anatomy

1. Readout header (4.2).
2. Title (`h1`, 24px, 600) plus one muted subtitle line or mono meta.
3. Action cluster right of the title.
4. Content modules.

### 8.2 Responsive

Breakpoints sm 640 / md 768 / lg 1024 / xl 1280. Below lg: sidebar becomes the bottom bar; rack rows stack name over meta over actions; time-lanes scroll horizontally with the ruler pinned; lanes stay one-day-per-row. Mobile-first composition.

---

## 9. States and errors

Every data surface defines loading (skeleton), empty (single clear action), and error (reason plus fix, retry when repeatable). Error copy: **bold lead** + plain reason + the fix, never an apology, never an exclamation mark.

---

## 10. Copy and voice

Plain verbs, sentence case, no filler. Controls name the action ("New entry", "Start a session", "Save changes"). The action name is stable through the flow. Empty screens invite action. No em dashes anywhere in the frontend, including comments.

---

## 11. i18n

No hardcoded user-visible string. All copy lives in `frontend/src/ii8n/strings.ts` (re-exported by `frontend/src/i18n/strings.ts`). Semantic, complete strings; ICU placeholders for values; dates and durations through `frontend/src/lib/utils.ts` formatters. `aria-label`s live in the strings module. The v3 UI adds keys under `nav`, `console`, and `timeline`.

---

## 12. Motion and accessibility

- Hover and press 150ms; lane expansion 200ms; toast 200ms; skeleton pulse; running-lamp pulse (2s).
- `prefers-reduced-motion` disables all non-essential animation, including the lamp pulse.
- Visible 2px focus ring with 1px offset on every interactive element.
- Contrast: AA for text, 3:1 for control outlines, in both modes.
- Icon-only buttons carry `aria-label`s. Real buttons, real tables, real headers.
- Palette and dialogs trap focus and close on Escape; arrow keys move palette selection; lanes/rows toggle on Enter/Space.
- Do not rename or remove test-visible semantics (roles, accessible names, string keys) when restyling.

---

## 13. Always / Never

### Always

- Open workspace pages with the readout header, then the title, then actions.
- Put navigation in the rack and the palette, never in a top nav bar.
- Make the console answer "what am I tracking now" first.
- Use the time-lane as the project's default view; use the Ledger for edit/export.
- Use semantic tokens, mono tabular readouts, lamps for state, tags for category.
- One signal-filled action per view; signal accent only for live or primary.
- Use `Panel` modules and the machined 1px lip, soft shadow only on dialogs/palette.
- Define loading, empty, and error for every data surface; route every string through the strings module.
- Respect reduced motion and keep a visible focus ring.

### Never

- No top navigation bar. No card grid as the home. No KPI strip as the home.
- No em dashes anywhere in the frontend. Rephrase.
- No hardcoded user-visible strings; no raw hex outside `index.css`.
- No pill chips, no fully rounded buttons, no glassmorphism, no gradients, no neon glow.
- No soft drop shadows on modules or controls; dialogs and the palette only.
- No more than one signal-filled action per view.
- No new tokens, fonts, or colors without updating this document.
- No "Submit" labels, no apologies or exclamation marks in errors.
- No uppercase sentences; uppercase is for mono labels.
- No fixed-height or non-scrolling page content on mobile.
- No changing test-visible semantics (roles, accessible names, string keys) when restyling.

---

## 14. Implementation map

| Concern | Location |
|---|---|
| Tokens | `frontend/src/index.css` (`:root`, `.dark`, `@theme inline`) |
| Utilities `.tick-rule`, `.signal-pulse` | `frontend/src/index.css` |
| Shell and nav | `frontend/src/routes/__root.tsx`, `frontend/src/components/nav/*` (`app-sidebar`, `status-bar`, `command-palette`, `mobile-bar`, `theme-toggle`) |
| Brand | `frontend/src/components/logo-mark.tsx`, `frontend/src/components/brand-lockup.tsx`, `frontend/public/favicon.svg` |
| Modules and primitives | `frontend/src/components/ui/*` (`panel`, `button`, `input`, `label`, `tabs`, `dialog`, `app-dialog`, ...) |
| Console feed | `frontend/src/lib/console.ts` |
| Time-lane | `frontend/src/components/entries/time-lane.tsx` |
| Strings | `frontend/src/ii8n/strings.ts` (source), `frontend/src/i18n/strings.ts` (re-export) |
| Formatters | `frontend/src/lib/utils.ts` |
