# CDS Setup for Existing Projects (for AI assistants)

This file tells AI assistants how to add CDS styling to an **existing** project and migrate its components to use CDS tokens — without breaking existing layout or functionality.

## Step 1: Add the CSS file

Add this line to the project's main CSS file (usually `src/index.css` or `index.css`), at the **top** before any other styles:

```css
@import "../cds-tailwind/cds-standalone.css";
```

Path assumes `cds-tailwind/` is at the project root and this CSS file is in `src/`. If your CSS entry point is at the project root instead, use `./cds-tailwind/cds-standalone.css`.

**Do NOT add `@import "tailwindcss"` or `@import "@coursera/cds-tailwind"` — those would override the existing Tailwind setup.**

## Step 2: Add the font

Check if `index.html` already loads Source Sans 3 or Source Sans Pro. If it already has one of those fonts, skip this step.

If not, add these lines to the `<head>` of `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet" />
```

## Step 3: Copy AI instruction files

Copy these files from `cds-tailwind/docs/` to the correct locations so AI assistants follow CDS conventions:

| Source | Destination |
|--------|-------------|
| `cds-tailwind/docs/CLAUDE-safe.md` | `./CLAUDE.md` (project root) |
| `cds-tailwind/docs/cds-styling-spec.md` | `./cds-styling-spec.md` (project root) |
| `cds-tailwind/docs/cds-safe.mdc` | `./.cursor/rules/cds.mdc` (create `.cursor/rules/` if needed) |

**Important:** Use the `-safe` versions (not `CLAUDE.md` / `cds.mdc`). The safe versions use `bg-[var(--cds-color-blue-700)]` syntax which works with the existing Tailwind setup. The non-safe versions use `bg-blue-700` syntax which only works with the full CDS Tailwind configuration.

## Step 4: Verify setup

Run the dev server (`npm run dev`) and confirm:
- The page looks exactly the same as before (nothing broke)
- CDS tokens are available: `var(--cds-color-blue-700)` resolves to `#0056d2` in DevTools

## Step 5: Migrate existing components to CDS

**IMPORTANT: You must migrate EVERY `.tsx` file AND every `.css` / `.scss` / `.module.css` file in the project. Do not stop after a few files.**

First, list all `.tsx` files in `src/`. Then open each file one by one and apply all the migrations below. **Also scan all CSS files** (`.css`, `.scss`, `.module.css`) for hardcoded `font-size`, `font-weight`, `line-height`, and color values — these must be migrated to CDS classes and tokens too. After finishing all files, run the verification grep in Step 6.

Read `cds-styling-spec.md` for component-specific rules (buttons, modals, text fields, cards, tabs, chips, etc.).

### 5a. Typography

Replace Tailwind text-size classes with CDS composite classes. CDS classes set font-family, font-size, font-weight, and line-height together, so remove the redundant `text-*` size class **and** any paired `font-semibold` / `font-bold`. All font weight must come from the CDS class — never add extra weight utilities.

**No all-caps text.** Remove `uppercase` / `text-transform: uppercase` wherever found. CDS does not use all-caps for any typography style. Use sentence case for all text.

**Tailwind size classes → CDS classes:**

| Tailwind class | CDS class | Notes |
|----------------|-----------|-------|
| `text-xs` | `cds-body-tertiary` | 12px, normal weight |
| `text-sm` | `cds-body-secondary` | 14px, normal weight |
| `text-sm font-semibold` or `text-sm font-bold` | `cds-action-secondary` | 14px, semibold |
| `text-base` | `cds-body-primary` | 16px, normal weight |
| `text-base font-semibold` or `text-base font-bold` | `cds-action-primary` | 16px, semibold |
| `text-lg` | `cds-subtitle-lg` | 20px, semibold |
| `text-lg font-bold` | `cds-subtitle-lg` | 20px, semibold (drop `font-bold`) |
| `text-xl` | `cds-subtitle-lg` | 20px, semibold |
| `text-xl font-bold` | `cds-subtitle-lg` | 20px, semibold (drop `font-bold`) |
| `text-2xl` | `cds-title-xs` | 24px, semibold |
| `text-2xl font-bold` | `cds-title-xs` | 24px, semibold (drop `font-bold`) |
| `text-3xl` | `cds-title-sm` | 30px, semibold |
| `text-4xl` | `cds-title-md` | 36px, semibold |
| `text-5xl` | `cds-title-lg` | 48px, semibold |
| `text-6xl` or larger | `cds-display` | 64px, semibold |

**Legacy/custom typography classes** (project-specific — replace if found):

| Old class | CDS class |
|-----------|-----------|
| `headline-lg`, `heading-lg` | `cds-title-lg` |
| `headline-md`, `heading-md` | `cds-title-md` |
| `headline-sm`, `heading-sm` | `cds-title-sm` |
| `body-lg-semibold` | `cds-subtitle-lg` |
| `body-lg`, `body-large` | `cds-body-primary` |
| `body-sm`, `body-small` | `cds-body-secondary` |
| `btn-text-md` | `cds-action-primary` |
| `btn-text-sm` | `cds-action-secondary` |

**How to apply:** When you see a className like `text-2xl font-bold text-slate-900`, replace the typography part (`text-2xl font-bold`) with the CDS class (`cds-title-xs`) — drop `font-bold` because the CDS class handles weight — and handle the color part (`text-slate-900`) separately per section 5b below. Result: `cds-title-xs text-[var(--cds-color-grey-975)]`.

**CSS font properties → CDS classes:**

Search ALL `.css`, `.scss`, and `.module.css` files for `font-size`, `font-weight`, and `line-height` declarations. For each CSS rule that defines typography, add the matching CDS composite class to the HTML element in the `.tsx` file, then remove the redundant `font-size`, `font-weight`, and `line-height` properties from the CSS.

| CSS font-size | CSS font-weight | CDS class |
|---------------|-----------------|-----------|
| 64px | 600/700 | `cds-display` |
| 48px | 600/700 | `cds-title-lg` |
| 36px | 600/700 | `cds-title-md` |
| 30–32px | 600/700 | `cds-title-sm` |
| 24px | 600/700 | `cds-title-xs` |
| 20px | 600/700 | `cds-subtitle-lg` |
| 16px | 600/700 | `cds-subtitle-md` |
| 14px | 600/700 | `cds-subtitle-sm` |
| 16px | 400/normal | `cds-body-primary` |
| 14px | 400/normal | `cds-body-secondary` |
| 12px | 400/normal | `cds-body-tertiary` |
| 16px | 600 (button text) | `cds-action-primary` |
| 14px | 600 (button text) | `cds-action-secondary` |

If the font-size doesn't exactly match a CDS class, use the closest one (e.g., 32px → `cds-title-sm` at 30px, 18px → `cds-body-primary` at 16px or `cds-subtitle-lg` at 20px).

**Before** (CSS + TSX):
```css
.stage-title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  color: #1f1f1f;
}
```
```tsx
<h2 className="stage-title">Module 1</h2>
```

**After**:
```css
.stage-title {
  color: var(--cds-color-grey-975);
}
```
```tsx
<h2 className="cds-title-sm stage-title">Module 1</h2>
```

**Inline styles** — replace font properties with CDS classes too:

Before: `<span style={{ fontSize: '20px', fontWeight: 700 }}>Title</span>`
After: `<span className="cds-subtitle-lg">Title</span>`

### 5b. Colors

Replace Tailwind color classes, hardcoded hex values, and project-specific tokens with CDS.

**Tailwind color classes → CDS (most common pattern):**

| Tailwind class | CDS replacement |
|----------------|-----------------|
| `text-slate-900` / `text-gray-900` / `text-neutral-900` / `text-zinc-900` | `text-[var(--cds-color-grey-975)]` |
| `text-slate-800` / `text-gray-800` | `text-[var(--cds-color-grey-900)]` |
| `text-slate-700` / `text-gray-700` | `text-[var(--cds-color-grey-700)]` |
| `text-slate-600` / `text-gray-600` | `text-[var(--cds-color-grey-600)]` |
| `text-slate-500` / `text-gray-500` | `text-[var(--cds-color-grey-600)]` |
| `text-slate-400` / `text-gray-400` | `text-[var(--cds-color-grey-500)]` |
| `text-slate-300` / `text-gray-300` | `text-[var(--cds-color-grey-400)]` |
| `text-white` | `text-[var(--cds-color-white)]` |
| `text-blue-600` / `text-blue-700` | `text-[var(--cds-color-blue-700)]` |
| `text-red-600` / `text-red-700` | `text-[var(--cds-color-red-700)]` |
| `text-green-600` / `text-green-700` | `text-[var(--cds-color-green-700)]` |
| `bg-white` | `bg-[var(--cds-color-white)]` |
| `bg-slate-50` / `bg-gray-50` | `bg-[var(--cds-color-grey-25)]` |
| `bg-slate-100` / `bg-gray-100` | `bg-[var(--cds-color-grey-50)]` |
| `bg-slate-200` / `bg-gray-200` | `bg-[var(--cds-color-grey-100)]` |
| `bg-slate-900` / `bg-gray-900` | `bg-[var(--cds-color-grey-975)]` |
| `bg-blue-600` / `bg-blue-700` | `bg-[var(--cds-color-blue-700)]` |
| `bg-blue-50` | `bg-[var(--cds-color-blue-50)]` |
| `bg-red-50` | `bg-[var(--cds-color-red-50)]` |
| `bg-green-50` | `bg-[var(--cds-color-green-50)]` |
| `border-slate-200` / `border-gray-200` | `border-[var(--cds-color-grey-100)]` |
| `border-slate-300` / `border-gray-300` | `border-[var(--cds-color-grey-200)]` |
| `border-blue-600` / `border-blue-700` | `border-[var(--cds-color-blue-700)]` |
| `ring-blue-500` / `ring-blue-600` | `ring-[var(--cds-color-blue-700)]` |
| `divide-slate-200` / `divide-gray-200` | `divide-[var(--cds-color-grey-100)]` |

For any Tailwind color class not in this table (e.g. `text-indigo-600`, `bg-emerald-100`), find the closest CDS color from `cds-standalone.css`.

**Hover/focus/active state variants** — apply the same mapping with the variant prefix:
- `hover:bg-slate-100` → `hover:bg-[var(--cds-color-grey-50)]`
- `hover:bg-blue-700` → `hover:bg-[var(--cds-color-blue-800)]`
- `focus:ring-blue-500` → `focus:ring-[var(--cds-color-blue-700)]`
- `hover:text-blue-700` → `hover:text-[var(--cds-color-blue-800)]`

**Hardcoded hex → CDS variable (in inline styles or arbitrary values):**

| Old hex | CDS variable |
|---------|-------------|
| `#0056D2` / `#0056d2` | `var(--cds-color-blue-700)` |
| `#0048b0` / `#0045A8` | `var(--cds-color-blue-800)` |
| `#0f1114` / `#1f1f1f` | `var(--cds-color-grey-975)` |
| `#5b6780` | `var(--cds-color-grey-600)` |
| `#F5F7FA` / `#f2f5fa` | `var(--cds-color-grey-25)` |
| `#e8eef7` | `var(--cds-color-grey-50)` |
| `#dae1ed` | `var(--cds-color-grey-100)` |
| `#FFFFFF` / `#ffffff` | `var(--cds-color-white)` |
| `#d30a28` / `#B31E2D` | `var(--cds-color-red-700)` |
| `#087051` | `var(--cds-color-green-700)` |
| `#a32e00` / `#F28100` | `var(--cds-color-yellow-700)` |

**Project-specific tokens → CDS tokens:**

| Old token | CDS token |
|-----------|-----------|
| `var(--color-primary)` | `var(--cds-color-interactive-primary)` |
| `var(--color-primary-hover)` | `var(--cds-color-interactive-primary-hover)` |
| `var(--color-text-primary)` | `var(--cds-color-neutral-primary)` |
| `var(--color-text-secondary)` | `var(--cds-color-neutral-primary-weak)` |
| `var(--color-bg-primary)` | `var(--cds-color-neutral-background-primary-weak)` |
| `var(--color-bg-white)` | `var(--cds-color-neutral-background-primary)` |
| `var(--color-error)` | `var(--cds-color-feedback-error)` |
| `var(--color-success)` | `var(--cds-color-feedback-success)` |
| `var(--color-warning)` | `var(--cds-color-feedback-warning)` |

**In inline styles**, use CDS variables directly:
```html
<div style={{ color: 'var(--cds-color-grey-975)' }}>...</div>
<div style={{ backgroundColor: 'var(--cds-color-blue-700)' }}>...</div>
```

### 5c. Border radius

Replace Tailwind radius classes with CDS values:

| Old | CDS value | Use for |
|-----|-----------|---------|
| `rounded` / `rounded-[4px]` | `rounded-[var(--cds-border-radius-50)]` | Tabs, links |
| `rounded-md` / `rounded-lg` / `rounded-[8px]` | `rounded-[var(--cds-border-radius-100)]` | Buttons, inputs |
| `rounded-xl` / `rounded-2xl` / `rounded-[16px]` | `rounded-[var(--cds-border-radius-200)]` | Dialogs, cards |
| `rounded-3xl` / `rounded-[32px]` | `rounded-[var(--cds-border-radius-400)]` | Chips |
| `rounded-full` | `rounded-full` | Tags, avatars |

### 5d. Shadows

Replace Tailwind shadow classes with CDS elevation:

| Old | CDS value |
|-----|-----------|
| `shadow` / `shadow-sm` / `shadow-md` | `shadow-[var(--cds-elevation-level1)]` |
| `shadow-lg` | `shadow-[var(--cds-elevation-level2)]` |
| `shadow-xl` / `shadow-2xl` | `shadow-[var(--cds-elevation-level3)]` |

For inline styles: `style={{ boxShadow: 'var(--cds-elevation-level1)' }}`

### 5e. Component-specific styling

Read `cds-styling-spec.md` and apply the exact CDS styling rules for these components if they exist in the project.

**Buttons:**

| Property | CDS value |
|----------|-----------|
| Typography (medium) | `cds-action-primary` (16px/600) |
| Typography (small) | `cds-action-secondary` (14px/600) |
| Padding (medium) | 12px 24px |
| Padding (small) | 8px 16px |
| Border-radius | 8px → `rounded-[var(--cds-border-radius-100)]` |
| Border technique | `box-shadow: inset 0 0 0 1px {color}` (not CSS `border`) |

CDS uses `box-shadow: inset 0 0 0 1px` instead of CSS `border` on buttons. This prevents layout shift on hover/active state changes.

Before:
```css
.btn-start {
  font-size: 16px;
  font-weight: 600;
  padding: 12px 24px;
  border: 1px solid #0056d2;
  border-radius: 32px;
  background: #0056d2;
  color: #fff;
}
```

After:
```css
.btn-start {
  padding: 12px 24px;
  border: none;
  border-radius: var(--cds-border-radius-100);
  background: var(--cds-color-blue-700);
  color: var(--cds-color-white);
  box-shadow: inset 0 0 0 1px var(--cds-color-blue-700);
}
```
```tsx
<button className="cds-action-primary btn-start">Start</button>
```

Other components to migrate:

- **Text fields / Inputs**: height, padding, border, focus ring, validation states
- **Modals / Dialogs**: max-width, padding, border-radius (16px), overlay color, shadow (level3)
- **Cards**: border, border-radius (16px), padding, hover shadow
- **Tabs**: active indicator, color states, typography
- **Chips**: height, border-radius (32px), padding, selected state
- **Tags / Badges**: padding, border-radius (pill), severity colors
- **Progress bars**: track color, fill color, height
- **Tooltips**: background, text color, border-radius, shadow

### 5f. What to leave alone

Do NOT change:
- SVG `fill` / `stroke` attributes with dynamic color arrays
- Layout and positioning (`flex`, `grid`, `absolute`, `relative`, `w-full`, `h-screen`, etc.)
- Existing Tailwind spacing classes (`p-4`, `gap-6`, `m-2`, etc.) — spacing scale was not changed
- Width and height utilities (`w-64`, `h-12`, `max-w-md`, etc.)
- Animation keyframes and custom CSS animations
- Third-party library styles
- Opacity utilities (`opacity-50`, etc.)

## Step 6: Verify migration

After migrating ALL files, verify completeness.

**Grep check (TSX files)** — search `src/` for leftover non-CDS patterns in `.tsx` files. If any are found, fix them:
- `text-slate-` or `text-gray-` (should be `text-[var(--cds-color-{scale}-{weight})]`)
- `bg-slate-` or `bg-gray-` (should be `bg-[var(--cds-color-{scale}-{weight})]`)
- `text-xs` / `text-sm` / `text-base` / `text-lg` / `text-xl` / `text-2xl` (should be CDS typography classes)
- `border-slate-` or `border-gray-` (should be `border-[var(--cds-color-{scale}-{weight})]`)
- `uppercase` (remove — CDS does not use all-caps)

**Grep check (CSS files)** — search `src/` for leftover non-CDS patterns in `.css` / `.scss` / `.module.css` files:
- `font-size:` (should be removed — use CDS composite class on the element instead)
- `font-weight:` (should be removed — CDS class handles weight)
- `line-height:` (should be removed if the element has a CDS typography class)
- Hardcoded hex colors like `#0056d2`, `#1f1f1f`, `#5b6780` (should be `var(--cds-color-{scale}-{weight})`)
- `border-radius: 32px` on buttons (should be `var(--cds-border-radius-100)` = 8px)

**Visual check** — run the dev server and confirm:
- All pages render correctly
- Typography uses Source Sans 3 font
- Colors match CDS values (primary blue = `#0056d2`, body text = `#0f1114`)
- No console errors

## Done

The project is now using CDS styling. For ongoing development, read `CLAUDE.md` and `cds-styling-spec.md` for token conventions and component styling rules. All new components should use CDS tokens from the start.
