# CDS Setup Instructions (for AI assistants)

This file tells AI assistants how to set up CDS styling in an existing project. The designer has already copied the `cds-tailwind` folder into their project — you handle the rest.

## Step 1: Install dependencies

Install from the local folder path (this package is not on npm):

```bash
npm install ./cds-tailwind tailwindcss @tailwindcss/vite
```

## Step 2: Configure Vite

Add the Tailwind CSS plugin to `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'

// Add tailwindcss() to the plugins array
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

## Step 3: Set up CSS

Replace the contents of the main CSS file (usually `src/index.css`) with:

```css
@import "tailwindcss";
@import "@coursera/cds-tailwind";

body {
  font-family: "Source Sans 3", "Source Sans Pro", Arial, sans-serif;
  color: var(--cds-color-neutral-primary);
  background-color: var(--cds-color-neutral-background-primary);
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

## Step 4: Add the font

Add these lines to the `<head>` of `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet" />
```

## Step 5: Copy AI instruction files

Copy these files from `cds-tailwind/docs/` to the correct locations so that AI assistants always follow CDS conventions:

| Source | Destination |
|--------|-------------|
| `cds-tailwind/docs/CLAUDE.md` | `./CLAUDE.md` (project root) |
| `cds-tailwind/docs/cds-styling-spec.md` | `./cds-styling-spec.md` (project root) |
| `cds-tailwind/docs/cds.mdc` | `./.cursor/rules/cds.mdc` (create `.cursor/rules/` if it doesn't exist) |

## Step 6: Run the dev server

```bash
npm run dev
```

## Done

The project now has CDS styling. Read `CLAUDE.md` and `cds-styling-spec.md` for token conventions and component styling rules.
