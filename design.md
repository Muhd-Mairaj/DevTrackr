# Design — DevTrackr

A locked design system for this app. Every surface reads this file before it is
built or changed. Do not regenerate it per page. Extend or amend it when the
system needs to grow.

The identity is **Daybook**: a developer's working journal. Warm paper, real
ruled hairlines, one ink-accent, and type that reads like a record rather than a
dashboard. It deliberately breaks from the previous "Signal" instrument-console
identity (lime on near-black, machined lips, tick rules, left sidebar rack).

## Genre

modern-minimal (developer tool / B2B). The register is Primer, Helios, Carbon:
calm surfaces, confident display type, one restrained accent, low-decoration.

## Macrostructure family

- **App pages**: *Workbench* — the working surface is the hero. Overview leads
  with the live session and today's lane; the project page is one continuous
  document with a sticky contents index. No tab strips, no dashboard of
  same-weight KPI cards.
- **Auth page**: *Split Studio* — brand on one side, the form on the other.

## Theme

Warm paper, light-first, with a real dark variant. All values live in
`frontend/src/index.css` as locked tokens (`var(--…)`). No inline hex anywhere
outside that file.

Light:

- `--background`    oklch(0.975 0.007 85)  · warm paper
- `--card`          oklch(0.995 0.003 85)  · leaf
- `--foreground`    oklch(0.235 0.014 65)  · ink
- `--muted`         oklch(0.945 0.008 85)
- `--muted-foreground` oklch(0.50 0.012 70)
- `--border`        oklch(0.90 0.009 85)   · rule
- `--input`/`--edge` oklch(0.63 0.014 70)  · control outline (≥3:1)
- `--primary`/`--signal` oklch(0.55 0.165 33) · coral ink
- `--primary-foreground` oklch(0.99 0.004 85)
- `--destructive`   oklch(0.52 0.20 27)
- `--success`       oklch(0.52 0.12 150)
- `--warning`       oklch(0.62 0.13 75)
- `--info`          oklch(0.52 0.14 250)
- `--ring`          = `--primary`

Dark mirrors the light hues: paper becomes warm ink `oklch(0.185 0.008 70)`,
leaf `oklch(0.225 0.009 70)`, ink text `oklch(0.94 0.008 85)`, and the coral
brightens to `oklch(0.72 0.15 38)`. Exact values are in `index.css`.

## Typography

- Display: **Schibsted Grotesk**, weight 600–700, style normal.
- Body: **Schibsted Grotesk**, weight 400–500.
- Mono: **IBM Plex Mono**, weight 400–600 (labels, numerals, code).
- Display tracking: `-0.02em` to `-0.03em`.
- Body measure: 60–72ch. Display max ~3.5rem in-app.
- Headings are always roman. Emphasis comes from weight and the accent, never
  from italics or gradient text.
- Mono is reserved for data (times, durations, counts, dates, status, path
  labels). Prose stays in Schibsted.

## Spacing

Tailwind v4 4pt scale. Sections separate with `--space-lg` (2rem) or more;
labels sit close to what they label. Use named Tailwind steps, never magic
pixels.

## Motion

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out`), durations 150–260ms.
- One authored moment: the live lamp pulse (`.live-pulse`). Reveals are off;
  the page is composed at load.
- Reduced-motion fallback: the pulse is disabled under
  `prefers-reduced-motion: reduce`.

## Microinteractions

- Hover states are chromatic-quiet: a faint ink wash, a hairline that darkens.
- Focus is a 2px accent ring with a 1px offset, always visible on keyboard.
- Toasts are silent-success; destructive actions are confirmed in a dialog.
- No zero-offset halos, no gradients, no glassmorphism.

## CTA voice

- Primary: solid coral-ink fill, 8px radius, `font-medium`, sentence case.
- Secondary: hairline outline on leaf, ink text, same radius.
- Ghost: text-only for inline/row actions.
- Destructive: solid `--destructive`, only for confirmations.

## Per-page allowances

- App pages MUST NOT use enrichment or hero imagery. Function carries the page.
- The auth page MAY use a single typographic brand statement. No illustration.

## What pages MUST share

- The wordmark and the daybook mark.
- The coral accent, used on ≤ 5% of a viewport.
- Schibsted Grotesk + IBM Plex Mono.
- The CTA voice (radius, padding rhythm, case).
- The ruled-hairline divider language and the mono micro-label.

## What pages MAY differ on

- Section composition within the app family.
- The density of tabular data.

## Browser surfaces

Text selection, caret, focus rings, scrollbars, underline offset, and tabular
numerals are themed from the palette. See `index.css` base layer.

## Exports

### shadcn / Tailwind v4 mapping

The app consumes shadcn-style variables. The mapping is:

```
--background → paper      --foreground → ink
--card → leaf             --muted → wash
--border → rule           --input/--edge → control outline
--primary/--signal → coral ink        --ring → focus
```

### tokens.css (portable)

```css
:root {
  --color-paper: oklch(0.975 0.007 85);
  --color-leaf: oklch(0.995 0.003 85);
  --color-ink: oklch(0.235 0.014 65);
  --color-rule: oklch(0.90 0.009 85);
  --color-accent: oklch(0.55 0.165 33);
  --color-focus: oklch(0.55 0.165 33);

  --font-display: "Schibsted Grotesk", sans-serif;
  --font-body: "Schibsted Grotesk", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --radius-control: 0.5rem;
  --radius-card: 0.75rem;
  --radius-pill: 999px;
}
```
