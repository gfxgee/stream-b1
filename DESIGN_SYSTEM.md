# Digitalfeet Design System

A portable reference for colors, typography, gradients, and core components.
Extracted from the Figma source (Self-Service Portal / microjobs portal). Intended to be
reused across projects — copy the tokens below into any new app.

> **One assumption to confirm:** the two type families are mapped as **Ubuntu = headings/display**
> and **Inter = body/UI**. Swap if the Figma file intends the reverse.

---

## 1. Color palette

| Token | Hex | Role / usage |
|---|---|---|
| `--color-purple` | `#1E1242` | Primary brand color. Header & footer backgrounds, dark sections. |
| `--color-ink` | `#131028` | Darkest shade. Body text on light backgrounds, deepest surfaces. |
| `--color-orange` | `#F8A02D` | Primary action / brand accent. Buttons, highlights. Gradient **start**. |
| `--color-orange-deep` | `#F37920` | Gradient **end** (button gradient). |
| `--color-blue` | `#009FE3` | Secondary accent. Icons, links, informational highlights. |
| `--color-cream` | `#F7F6F2` | Light surface / page background (off-white). |
| `--color-white` | `#FFFFFF` | Base white. Cards, light surfaces. |
| `--color-gray` | `#747474` | Muted / secondary text, captions, metadata. |

## 2. Gradient

A single brand gradient, used on primary buttons.

- **Type:** Linear
- **Stops:** `#F8A02D` at 0% → `#F37920` at 100%

```css
--gradient-brand: linear-gradient(90deg, #F8A02D 0%, #F37920 100%);
```

> Direction in Figma reads roughly horizontal; `90deg` is a safe default. Adjust the angle
> per surface if needed (e.g. `135deg` for a diagonal on larger fills).

## 3. Typography

**Font families**

- **Ubuntu** — headings / display
- **Inter** — body / UI

```css
--font-heading: 'Ubuntu', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
```

Notation below is `size / line-height` in px.

### Desktop type scale

| Style | Size / Line-height | Suggested family |
|---|---|---|
| H1 | 54 / 76.8 | Ubuntu |
| H1 (alt) | 55 / auto | Ubuntu |
| H2 | 48 / 57.6 | Ubuntu |
| H3 | 32 / 40 | Ubuntu |
| H4 | 24 / 28.8 | Ubuntu |
| H5 | 20 / 28.8 | Ubuntu |
| p-banner | 25 / 37.5 | Inter |
| Text / p-18 | 18 / 27 | Inter |
| p-16 | 16 / 24 | Inter |
| Menu items | 16 / auto | Inter |
| Label | 12 / 24 | Inter |

### Mobile type scale

| Style | Size / Line-height | Suggested family |
|---|---|---|
| H1 | 30 / 36 | Ubuntu |
| H2 | 27 / 42 | Ubuntu |
| H3 | 20 / 24 | Ubuntu |
| p-banner | 16 / 27 | Inter |
| p-16 | 16 / 24 | Inter |

> Most body styles use a 1.5 line-height ratio; headings tighten toward 1.2.

## 4. Components

### Buttons (pill, gradient)

Primary buttons are fully rounded "pills" filled with the brand gradient, with dark text.

| Property | Large ("How it works") | Standard ("Add to Cart") |
|---|---|---|
| Size | 237 × 44 (hug) | 132 × 40 |
| Padding | 16px vertical / 32px horizontal | ~10–16px / ~20–24px |
| Gap (icon↔label) | 10px | — |
| Corner radius | full pill (`9999px`) | 50px (full pill at this height) |
| Fill | `--gradient-brand` | `--gradient-brand` |
| Text color | `--color-ink` (`#131028`) | `--color-ink` |
| Text | Ubuntu/Inter, ~16px, semibold | bold |

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  border-radius: 9999px;
  background: var(--gradient-brand);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-primary--sm { padding: 10px 22px; font-size: 14px; }
```

---

## 5. Drop-in implementation

### CSS custom properties (any project)

```css
:root {
  /* Colors */
  --color-purple: #1E1242;
  --color-ink: #131028;
  --color-orange: #F8A02D;
  --color-orange-deep: #F37920;
  --color-blue: #009FE3;
  --color-cream: #F7F6F2;
  --color-white: #FFFFFF;
  --color-gray: #747474;

  /* Gradient */
  --gradient-brand: linear-gradient(90deg, #F8A02D 0%, #F37920 100%);

  /* Fonts */
  --font-heading: 'Ubuntu', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}
```

### Font loading (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
```

### Tailwind config (v3) — for Next.js/React projects

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        purple: '#1E1242',
        ink: '#131028',
        orange: { DEFAULT: '#F8A02D', deep: '#F37920' },
        blue: '#009FE3',
        cream: '#F7F6F2',
        gray: { brand: '#747474' },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(90deg, #F8A02D 0%, #F37920 100%)',
      },
      fontFamily: {
        heading: ['Ubuntu', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // [size, lineHeight]
        'h1': ['54px', '76.8px'],
        'h2': ['48px', '57.6px'],
        'h3': ['32px', '40px'],
        'h4': ['24px', '28.8px'],
        'h5': ['20px', '28.8px'],
        'p-banner': ['25px', '37.5px'],
        'p-18': ['18px', '27px'],
        'p-16': ['16px', '24px'],
        'label': ['12px', '24px'],
        // mobile
        'h1-m': ['30px', '36px'],
        'h2-m': ['27px', '42px'],
        'h3-m': ['20px', '24px'],
        'p-banner-m': ['16px', '27px'],
      },
    },
  },
};
```

### Breakpoints

- **Mobile:** 375px
- **Desktop:** 1440px

---

*Source: Digitalfeet Figma design file (microjobs / Self-Service Portal). Keep this file as the
single source of truth and update it when the Figma tokens change.*
