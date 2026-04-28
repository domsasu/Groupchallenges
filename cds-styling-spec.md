# CDS Component Styling Specification

Extracted from the Coursera Design System (`webedx-spark/cds`). Use this as the source of truth for component-level styling when building prototypes.

---

## Global Patterns

### Focus Ring (all interactive elements)

Every focusable element uses this pattern:

```
outline: 1px solid transparent, offset 2px
Pseudo-element (::after):
  position: absolute
  inset: -2px
  border-radius: (varies by component)
  box-shadow:
    0 0 0 1px var(--cds-color-interactive-stroke-primary-focus)    [purple-700]
    0 0 0 2px var(--cds-color-interactive-stroke-primary-focus-invert)  [blue-25]
```

In Tailwind: `focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2`

### Disabled State (all components)

```
Text/icon: grey-200 (--cds-color-neutral-disabled-strong)
Background: grey-50 (--cds-color-neutral-disabled) or grey-200
Border: grey-200
Cursor: default
```

### Border Technique

CDS uses `box-shadow: inset 0 0 0 1px {color}` instead of CSS `border` on interactive elements (buttons, inputs). This prevents layout shift on state changes. Static elements (cards, accordions) use regular `border`.

### Border Radius by Component Type

| Type | Radius | Tailwind |
|------|--------|----------|
| Tab indicators, link focus rings | 2px–4px | `rounded-2` / `rounded-4` |
| Buttons, inputs, form cards, select options, checkboxes | 8px | `rounded-8` |
| Dialogs, cards, notifications, accordions, dropdowns | 16px | `rounded-16` |
| Chips | 32px | `rounded-32` |
| Tags, round buttons, user avatars | 50% / pill | `rounded-full` |

### No Emojis in Product UI

Do not use emojis in product interface design — buttons, labels, headings, cards, navigation, empty states, etc. Use CDS icons (Material Icons Rounded) instead. Emojis are acceptable in non-product contexts like email templates and Slack messages.

---

## Button

### Sizes

| Size | Padding | Typography | Icon spacing |
|------|---------|------------|-------------|
| small | 8px 16px | cds-action-secondary (14px/600) | 4px gap |
| medium | 12px 24px | cds-action-primary (16px/600) | 4px gap |

- Border-radius: **8px** (`rounded-8`)
- Max-width: 320px (unless full-width)
- Border: `inset box-shadow 1px` (not CSS border)

### Variants and States

**primary** (filled blue):

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | blue-700 | white | blue-700 |
| Hover | blue-800 | white | blue-800 |
| Active | purple-950 | white | purple-950 |
| Disabled | grey-200 | grey-50 | grey-200 |

**secondary** (outlined blue):

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | white | blue-700 | blue-700 |
| Hover | blue-25 | blue-800 | blue-800 |
| Active | purple-25 | purple-950 | purple-950 |
| Disabled | grey-25 | grey-200 | grey-200 |

**secondaryNeutral** (outlined grey):

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | white | grey-975 | grey-100 |
| Hover | blue-25 | grey-900 | grey-400 |
| Active | grey-50 | grey-800 | grey-400 |
| Disabled | grey-25 | grey-200 | grey-100 |

**ghost** (text only, blue):

| State | Background | Text | Underline |
|-------|-----------|------|-----------|
| Default | transparent | blue-700 | none |
| Hover | blue-25 | blue-800 | yes |
| Active | purple-25 | purple-950 | yes |
| Disabled | transparent | grey-200 | none |

**ghostSecondary** (text only, grey):

| State | Background | Text | Underline |
|-------|-----------|------|-----------|
| Default | transparent | grey-975 | none |
| Hover | grey-25 | grey-900 | yes |
| Active | grey-50 | grey-800 | yes |
| Disabled | transparent | grey-200 | none |

---

## Icon Button

### Sizes

| Size | Dimensions |
|------|-----------|
| small | 36px x 36px |
| medium | 48px x 48px |

- Border-radius: **8px** (default) or **50%** (round variant)
- Same color variants as Button

---

## Logo

The Coursera wordmark is available at `public/coursera-logo.svg`. Use it instead of plain text for branding.

### Usage

```tsx
<img src="/coursera-logo.svg" alt="Coursera" className="h-[18px] w-auto" />
```

The SVG uses `fill="currentColor"`, so it inherits the parent's text color. To control the color:

```tsx
<div className="text-grey-975">
  <img src="/coursera-logo.svg" alt="Coursera" className="h-[18px] w-auto" />
</div>
```

### Sizing

Set height only — width scales proportionally (`w-auto`). Recommended heights:

| Context | Height |
|---------|--------|
| Navbar | 18px |
| Footer | 20px |
| Hero / splash | 32–48px |

---

## Icons

CDS icons use **Material Symbols Rounded** (weight **400**, optical size 20–48, no fill). Browse icons at [Google Fonts](https://fonts.google.com/icons?icon.style=Rounded).

### Setup

Add to `<head>` of `index.html`:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
```

Set the default weight in CSS (global stylesheet):

```css
.material-symbols-rounded {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

Usage: `<span class="material-symbols-rounded">search</span>`

### Sizes

| Size | Pixels | Use for |
|------|--------|---------|
| small | 16px | Inline with small text, badges |
| medium | 20px | Default — buttons, inputs, navigation |
| large | 24px | Standalone, section headers |
| xlarge | 36px | Hero/feature icons |

All CDS icons are drawn on a **20px grid** (viewBox `0 0 20 20`) and scaled to other sizes.

### Colors

| Variant | Token | Use for |
|---------|-------|---------|
| default | `--cds-color-neutral-primary` | Standard icons alongside body text |
| support | `--cds-color-neutral-primary-weak` | Secondary/muted icons |
| invert | `--cds-color-neutral-primary-invert` | Icons on dark backgrounds |
| interactive | `--cds-color-interactive-primary` | Clickable icons, links |
| warning | `--cds-color-feedback-warning` | Warning states |
| error | `--cds-color-feedback-error` | Error states |
| success | `--cds-color-feedback-success` | Success states |

### Spacing (icon-to-text gap)

| Context | Gap |
|---------|-----|
| Buttons | 4px |
| Tabs | 4px |
| Tags / Badges | 4px |
| Text field validation icon | 8px |
| Notifications / Alerts | 12px |

---

## Text Field / Input

### Sizing

| Property | Value |
|----------|-------|
| Content height | 24px |
| Total rendered height | ~48px (24px + 12px padding top + 12px bottom) |
| Padding | 12px all sides |
| Border-radius | 8px (`rounded-8`) |
| Border | 1px solid |

### Internal Spacing

| Element | Spacing |
|---------|---------|
| Label to input | 8px (`gap-8` or `mt-8`) |
| Input to support text | 4px (`mt-4`) |
| Input to validation message | 4px |
| Validation icon to input | 8px |

### States

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | white | grey-400 | grey-975 |
| Hover | blue-25 | blue-800 | grey-975 |
| Focused | white | grey-400 + focus ring | grey-975 |
| Disabled | — | grey-200 | — |
| Read-only | grey-25 | grey-200 | — |
| Placeholder | — | — | grey-600 |

### Validation States

| State | Border | Hover Background |
|-------|--------|-----------------|
| Valid | green-700 | green-25 |
| Valid + focused | green-800 | — |
| Invalid | red-700 | red-25 |
| Invalid + focused | red-900 | — |

### Typography

- Input text: cds-body-primary (16px/400)
- Label: cds-body-primary (16px/400)
- Support text: cds-body-secondary (14px/400)

---

## Select / Dropdown

### Trigger

Inherits all Input styling (see Text Field above).
- Right padding: 44px (room for chevron icon)
- Chevron positioned right 12px, vertically centered

### Dropdown Menu

| Property | Value |
|----------|-------|
| Background | white |
| Border-radius | 16px (`rounded-16`) |
| Shadow | elevation-2 |
| Margin from trigger | 8px |
| Min-width | 100px |
| Max-width | 400px |

### Option Items

| Property | Value |
|----------|-------|
| Height | 48px |
| Padding (outer) | 4px 0 |
| Padding (inner) | 4px 8px |
| Border-radius | 8px |
| Typography | cds-body-primary (16px/400) |
| Gap between items | 4px |
| Default visible items | 5 (max list height ~256px) |

### Option States

| State | Background | Text |
|-------|-----------|------|
| Default | transparent | grey-975 |
| Hover | blue-25 | blue-800 |
| Selected | blue-25 | blue-800 |

---

## Checkbox

### Sizing

| Property | Value |
|----------|-------|
| Visual size | 18px (icon) |
| Hit area | 24px (for accessibility) |
| Border-radius | 4px (`rounded-4`) |
| Label gap | 8px |
| Label padding | 8px top/bottom |

### States (Unchecked)

| State | Fill | Stroke | Label |
|-------|------|--------|-------|
| Default | white | grey-400 | grey-975 |
| Hover | blue-25 | blue-800 | blue-800 |
| Active | purple-25 | purple-950 | purple-950 |

### States (Checked)

| State | Fill | Checkmark | Label |
|-------|------|-----------|-------|
| Default | blue-700 | white | blue-700 |
| Hover | blue-800 | white | blue-800 |
| Active | purple-950 | white | — |
| Disabled | grey-200 | grey-50 | grey-200 |

### Error State

| State | Stroke (unchecked) / Fill (checked) | Label |
|-------|-------------------------------------|-------|
| Default | red-700 | red-700 |
| Hover | red-900 | red-900 |

### Support Text Offset

- margin-left: 32px (checkbox width + gap = 24px + 8px)

---

## Radio

Same color states as Checkbox (shared styling).

| Property | Value |
|----------|-------|
| Visual size | 20px (slightly larger than checkbox) |
| Hit area | 24px |
| Border-radius | 50% (circle) |
| Checked inner dot | white |

---

## Tabs

### Tab Bar

| Property | Value |
|----------|-------|
| Border-bottom | 1px solid grey-100 |

### Individual Tab

| Property | Value |
|----------|-------|
| Min-height | 48px |
| Min-width | 44px |
| Padding | 12px 0 |
| Gap between tabs (primary) | 24px |
| Gap between tabs (section) | 16px |
| Icon gap | 4px |

### Active Indicator

| Property | Value |
|----------|-------|
| Height | 4px |
| Background | grey-975 |
| Border-radius | 2px 2px 0 0 (top corners only) |

### States

| State | Color | Typography |
|-------|-------|-----------|
| Inactive | grey-600 | cds-body-primary (16px/400) |
| Hover | grey-900 | cds-body-primary |
| Selected | grey-975 | cds-action-primary (16px/600) |

### Hover Indicator

- 4px tall bar, grey-100 background, same border-radius as active indicator

---

## Dialog / Modal

### Sizes

| Size | Width | Min-height | Max-height |
|------|-------|-----------|-----------|
| small | 340px | 300px | 95vh |
| medium | 568px | 300px | 80vh |
| large | 60vw (md: 70vw, sm: 568px) | 300px | 80vh |
| mobile (xs) | 100% | 100% | 100% (fullscreen) |

### Styling

| Property | Value |
|----------|-------|
| Background | white |
| Border-radius | 16px (`rounded-16`), 0 on mobile |
| Overlay | `var(--cds-color-utility-overlay)` — `rgba(15, 17, 20, 0.5)` |
| Position | fixed, centered with transform |
| Overflow | overflow-y: auto |

### Padding

| Area | Small | Medium/Large | Mobile |
|------|-------|-------------|--------|
| Header top | 16px | 24px | — |
| Header sides | 16px | 24px | 16px |
| Header bottom | 16px | 16px | 12px |
| Content sides | 16px | 24px | 16px |
| Actions top | 16px | 16px | 12px |
| Actions sides/bottom | 16px | 24px | 16px |

---

## Product Card

Two variants: **grid** (vertical) and **list** (horizontal).

### Grid Variant (vertical card)

| Property | Value |
|----------|-------|
| Min-width | 230px |
| Max-width | 470px |
| Border | 1px solid grey-100 |
| Border-radius | 16px (`rounded-16`) |
| Background | white |
| Padding | 8px |
| Content gap | 16px |
| Layout | flex column |

### List Variant (horizontal card)

| Property | Value |
|----------|-------|
| Min-width | 320px |
| Max-width | 100% |
| Border | 1px solid grey-100 |
| Border-radius | 16px (`rounded-16`) |
| Background | white |
| Padding | 16px |
| Content gap | 16px |
| Layout | flex row |

### Preview Image

| Variant | Default size | Aspect ratio |
|---------|-------------|--------------|
| Grid | 100% width | 16 / 9 |
| List (default) | 80px square | 1 / 1 |
| List (xs breakpoint) | 64px square | 1 / 1 |
| List (lg+ breakpoint) | 100% width (stacks above) | 16 / 9 |

- Grid preview: border-radius top corners match card (inherits)
- List preview: border-radius 8px

### Structure (Grid)

1. Preview image (with optional status tags overlay)
2. Partner info (logos + names)
3. Title (link)
4. Body slot
5. Footer slot

### Structure (List)

1. Preview image (left) | Content area (right)
2. Content: Partner info → Title → Body → Footer

At the **lg+ breakpoint**, the list variant stacks vertically (image on top, content below) and resembles the grid layout.

### Internal Spacing

| Element | Value |
|---------|-------|
| Header items gap (partner, title) | 8px |
| Footer items gap | 4px |
| Status tags from edge (overlay) | 8px |
| Partner logos gap | 4px |
| Partner logo size | 16px × 16px |

### Hover Effect

- Shadow: `0 0 40px -8px rgb(0 0 0 / 16%), 0 0 24px -16px rgb(0 0 0 / 16%)`
- Transform: `translateZ(2px)` with `scale(1.03)` fallback
- Transition: `all 0.3s cubic-bezier(0, 0, 0.5, 1)`

### Typography

- Title: cds-subtitle-lg (20px/600) — renders as a link
- Partner names: cds-body-secondary (14px/400)
- Status tags: use Tag/Badge component styles

---

## Chip

| Property | Value |
|----------|-------|
| Min-height | 32px |
| Min-width | 44px |
| Padding | 4px 12px |
| Border | 1px solid grey-100 |
| Border-radius | 32px (`rounded-32`) |
| Typography (default) | cds-body-secondary (14px/400) |
| Typography (selected) | cds-action-secondary (14px/600) |

### States (Unselected)

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | white | grey-975 | grey-100 |
| Hover | blue-25 | blue-800 | blue-800 |
| Active | purple-25 | purple-950 | purple-950 |

### States (Selected)

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | grey-800 | white | grey-800 |
| Hover | blue-800 | white | blue-800 |
| Active | purple-950 | white | purple-950 |

---

## Tag / Badge

| Property | Value |
|----------|-------|
| Padding | 0 8px |
| Padding (with icon) | 0 8px 0 4px |
| Border | 1px solid |
| Border-radius | pill (`rounded-full`) |
| Icon gap | 4px |

### Category Variants

| Variant | Text | Background | Border |
|---------|------|-----------|--------|
| default/primary | grey-975 | grey-50 | grey-50 |
| default/secondary | grey-975 | transparent | grey-100 |

### Status Variants

| Variant | Text | Background | Border |
|---------|------|-----------|--------|
| success/primary | white | green-700 | green-700 |
| success/secondary | green-700 | green-25 | green-25 |
| warning/primary | grey-975 | yellow-200 | yellow-200 |
| warning/secondary | yellow-700 | yellow-25 | yellow-25 |
| error/primary | white | red-700 | red-700 |
| error/secondary | red-700 | red-25 | red-25 |
| info/primary | white | blue-950 | blue-950 |
| info/secondary | blue-800 | blue-25 | blue-25 |

---

## Tooltip

| Property | Value |
|----------|-------|
| Max-width | 200px |
| Margin from trigger | 13px |
| Typography | cds-body-secondary (14px/400) |
| Background (default) | blue-950 (very dark) |
| Text (default) | white |
| Background (inverted) | white |
| Text (inverted) | grey-975 |
| Arrow | 20px wide, 8px tall |

---

## Notification / Alert

### Inline Notification

| Property | Value |
|----------|-------|
| Padding | 12px 16px (mobile: 12px all) |
| Border-radius | 16px (`rounded-16`) |
| Icon spacing | 12px from content |
| Actions spacing | 16px above |

### Severity Colors

| Severity | Background | Icon color |
|----------|-----------|------------|
| information | blue-25 | blue-700 |
| success | green-25 | green-700 |
| error | red-25 | red-700 |
| warning | yellow-25 | yellow-700 |

---

## Notification Badge

| Property | Value |
|----------|-------|
| Height | 20px |
| Min-width | 20px |
| Max-width | 42px |
| Padding | 0 6px |
| Border-radius | 16px |
| Background | red-700 |
| Text | white |
| Typography | cds-subtitle-md (16px/600) |

---

## Avatar

### Sizes

| Size | Dimensions |
|------|-----------|
| 18 | 18px |
| 24 | 24px |
| 36 | 36px |
| 64 | 64px |
| 120 | 120px |
| 200 | 200px |

### Border-radius

- User: **50%** (circle)
- Organization: varies (1px at 18px, up to 24px at 200px size)

### Placeholder

- Background: blue-950
- Text: white, uppercase, semibold
- Font sizes scale with avatar size (10px at 18, up to 96px at 200)

---

## Divider

| Orientation | Size | Color |
|-------------|------|-------|
| Horizontal | 1px height | grey-100 (default) |
| Vertical | 1px width, stretch height | grey-100 (default) |

Dark variant: grey-400. White variant: white.

---

## Accordion

| Property | Value |
|----------|-------|
| Background | white |
| Border | 1px solid grey-100 |
| Border (silent variant) | 1px solid transparent |
| Border-radius | 16px (`rounded-16`) |
| Header padding | 16px all sides |
| Hover background | blue-25 |
| Hover border | blue-800 |

### Chevron

- Default margin: 0 12px 0 0
- Transition: `transform 150ms ease-in-out`
- Expanded: rotated 180deg

---

## Link

### Variants

| Variant | Default | Hover |
|---------|---------|-------|
| Standard primary | blue-700, underline | blue-800, no underline |
| Quiet primary | blue-700, no underline | blue-800, underline |
| Standard secondary | grey-975, underline | grey-900, no underline |
| Quiet secondary | grey-975, no underline | grey-900, underline |

- Standalone padding: 12px 0
- Icon gap: 4px
- Focus border-radius: 4px

---

## Drawer

### Width by Breakpoint

| Breakpoint | Medium width | Large width |
|-----------|-------------|-------------|
| xs | 100% | 100% |
| sm | max 450px | max 450px |
| md | max 512px | max 768px |
| lg | max 720px | max 1080px |

### Padding

| Breakpoint | Outer | Header | Content | Actions |
|-----------|-------|--------|---------|---------|
| xs, sm | 16px | 0 16px 12px | 0 16px | 12px 16px 0 |
| md+ | 24px | 0 24px 16px | 0 24px | 16px 24px 0 |

- Background: white
- Position: fixed

---

## Popover / Dropdown Menu

### Desktop

| Property | Value |
|----------|-------|
| Background | white |
| Border-radius | 16px (`rounded-16`) |
| Shadow | elevation-2 |
| Max-width | 600px |
| Padding | 8px |
| Offset from trigger | 8px |

### Mobile (drawer mode)

| Property | Value |
|----------|-------|
| Overlay | `rgb(0 0 0 / 50%)` |
| Border-radius | 16px 16px 0 0 (top only) |
| Max-height | calc(100% - 24px) |
| Position | fixed bottom |

---

## Pagination

### Page Item

| Property | Value |
|----------|-------|
| Size | 36px x 36px |
| Typography (default) | cds-body-secondary (14px/400) |
| Typography (selected) | cds-action-secondary (14px/600) |
| Gap between items | 4px |

### States

| State | Color | Bottom indicator |
|-------|-------|-----------------|
| Default | grey-600 | none |
| Hover | grey-900 | 4px bar, grey-100 |
| Selected | grey-975 | 4px bar, grey-975 |

### Bottom Indicator

- Height: 4px, Width: 24px
- Border-radius: 2px 2px 0 0
- Centered beneath item

---

## Breadcrumbs

| Property | Value |
|----------|-------|
| List margin | 4px 0 |
| Link padding | 8px all sides |
| Edge alignment | margin-left: -8px |

---

## Skeleton / Loading

| Variant | Border-radius | Additional |
|---------|--------------|-----------|
| Text | 4px | transform: scale(1, 0.6) |
| Circle | 50% | — |
| Rect | inherit | — |

- Background: grey-50

---

## Progress Indicator

| Property | Value |
|----------|-------|
| Container width | 96px |
| Track stroke | grey-50 |
| Fill stroke | blue-700 |
| Stroke width | 17 |
| Label gap | 8px below indicator |
| Status gap | 4px below label |
