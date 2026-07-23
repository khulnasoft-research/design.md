---
name: Stitch Ecosystem
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8e9192'
  outline-variant: '#444748'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#adc9eb'
  on-secondary: '#14324e'
  secondary-container: '#304b68'
  on-secondary-container: '#9fbbdd'
  tertiary: '#ffffff'
  on-tertiary: '#620040'
  tertiary-container: '#ffd8e7'
  on-tertiary-container: '#ab3779'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#d0e4ff'
  secondary-fixed-dim: '#adc9eb'
  on-secondary-fixed: '#001d35'
  on-secondary-fixed-variant: '#2d4965'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  gradient-start: '#6366f1'
  gradient-mid: '#8b5cf6'
  gradient-violet: '#a855f7'
  gradient-end: '#d946ef'
  glass-bg: 'rgba(255, 255, 255, 0.04)'
  glass-hover: 'rgba(255, 255, 255, 0.07)'
  glass-strong: 'rgba(255, 255, 255, 0.10)'
  badge-bg: 'rgba(99, 102, 241, 0.12)'
  tab-active-bg: 'rgba(99, 102, 241, 0.15)'
  tab-active-border: 'rgba(99, 102, 241, 0.30)'
  nav-bg: 'rgba(11, 19, 38, 0.60)'
  terminal-bg: 'rgba(6, 14, 32, 0.80)'
effects:
  cta-gradient: 'linear-gradient(135deg, #6366f1, #a855f7)'
  glow: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15), rgba(139,92,246,0.08), transparent)'
  hero-text-gradient: 'linear-gradient(135deg, #ffffff, #adc9eb, #a855f7)'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 84px
    fontWeight: '800'
    lineHeight: 1.05
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 1.15
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    letterSpacing: -0.03em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    lineHeight: 1.7
  body-md:
    fontFamily: Inter
    fontSize: 16px
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    lineHeight: 1.7
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    letterSpacing: 0.06em
  label-tiny:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono, Fira Code, monospace
    fontSize: 13px
    lineHeight: 1.8
  code-xs:
    fontFamily: JetBrains Mono, Fira Code, monospace
    fontSize: 12px
    lineHeight: 1.5
  nav-link:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
  section-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    letterSpacing: 0.06em
    textTransform: uppercase
rounded:
  none: 0
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  xxl: 100px
  container-padding: 24px
  card-gap: 20px
  section-vertical: 100px
  nav-padding: 16px
  hero-padding-top: 120px
  hero-padding-bottom: 80px
components:
  nav-bar:
    backgroundColor: '{colors.nav-bg}'
    borderBottom: '1px solid {colors.glass-border}'
    backdropFilter: blur(20px)
    height: 56px
  logo:
    fontWeight: '700'
    fontSize: 18px
    letterSpacing: -0.02em
    gap: 10px
  nav-link:
    color: '{colors.on-surface-variant}'
    typography: '{typography.nav-link}'
    transition: color 0.2s
  nav-link-hover:
    color: '{colors.on-surface}'
  btn-primary-pill:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.full}'
    padding: 8px 20px
    typography: '{typography.body-sm}'
    fontWeight: '600'
    transition: opacity 0.2s
  btn-primary-pill-hover:
    opacity: 0.85
  hero-badge:
    backgroundColor: '{colors.badge-bg}'
    border: '1px solid {colors.badge-border}'
    rounded: '{rounded.full}'
    padding: 6px 16px
    typography: '{typography.label-sm}'
    color: '{colors.secondary}'
    gap: 6px
  hero-actions-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.full}'
    padding: 14px 32px
    typography: '{typography.body-md}'
    fontWeight: '600'
    transition: all 0.2s
  hero-actions-primary-hover:
    opacity: 0.85
    transform: translateY(-1px)
  hero-actions-secondary:
    backgroundColor: '{colors.glass-strong}'
    textColor: '{colors.on-surface}'
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.full}'
    padding: 14px 32px
    typography: '{typography.body-md}'
    fontWeight: '600'
    transition: all 0.2s
  hero-actions-secondary-hover:
    backgroundColor: '{colors.glass-hover}'
  terminal-window:
    backgroundColor: '{colors.terminal-bg}'
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.lg}'
    padding: 20px 24px
    backdropFilter: blur(10px)
    maxWidth: 640px
  terminal-dot-red:
    width: 10px
    height: 10px
    rounded: '{rounded.full}'
    backgroundColor: '#ff5f56'
  terminal-dot-yellow:
    width: 10px
    height: 10px
    rounded: '{rounded.full}'
    backgroundColor: '#ffbd2e'
  terminal-dot-green:
    width: 10px
    height: 10px
    rounded: '{rounded.full}'
    backgroundColor: '#27c93f'
  terminal-prompt:
    color: '{colors.gradient-violet}'
  terminal-string:
    color: '#a7d9a7'
  terminal-comment:
    color: '#6a6a6a'
  feature-card:
    backgroundColor: '{colors.glass-bg}'
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.xl}'
    padding: 28px
    backdropFilter: blur(12px)
    transition: all 0.25s
  feature-card-hover:
    backgroundColor: '{colors.glass-hover}'
    borderColor: '{colors.glass-strong}'
    transform: translateY(-2px)
  feature-icon:
    width: 44px
    height: 44px
    rounded: '{rounded.md}'
    display: flex
    alignItems: center
    justifyContent: center
    fontSize: 22px
  feature-tag:
    backgroundColor: '{colors.glass-bg}'
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.full}'
    padding: 3px 10px
    typography: '{typography.body-sm}'
    fontWeight: '500'
    color: '{colors.on-surface-variant}'
  skill-tab:
    backgroundColor: transparent
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.full}'
    padding: 8px 20px
    typography: '{typography.body-sm}'
    fontWeight: '500'
    color: '{colors.on-surface-variant}'
    cursor: pointer
    transition: all 0.2s
  skill-tab-hover:
    borderColor: '{colors.glass-strong}'
    color: '{colors.on-surface}'
  skill-tab-active:
    backgroundColor: '{colors.tab-active-bg}'
    borderColor: '{colors.tab-active-border}'
    color: '{colors.secondary}'
  skill-card:
    backgroundColor: '{colors.glass-bg}'
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.lg}'
    padding: 20px
    transition: all 0.2s
  skill-card-hover:
    backgroundColor: '{colors.glass-hover}'
  skill-name:
    fontSize: 15px
    fontWeight: '600'
  skill-desc:
    fontSize: 13px
    color: '{colors.on-surface-variant}'
    lineHeight: 1.6
  plugin-badge:
    backgroundColor: '{colors.badge-bg}'
    border: '1px solid {colors.badge-border}'
    color: '{colors.secondary}'
    rounded: '{rounded.full}'
    padding: 2px 10px
    typography: '{typography.label-tiny}'
    fontWeight: '600'
    textTransform: uppercase
    letterSpacing: 0.04em
  sdk-entry:
    backgroundColor: '{colors.glass-bg}'
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.lg}'
    padding: 24px
  sdk-header:
    fontFamily: JetBrains Mono, monospace
    fontSize: 14px
    color: '{colors.gradient-violet}'
  sdk-header-path:
    color: '{colors.on-surface-variant}'
    fontWeight: '400'
  cta-card:
    backgroundColor: '{colors.glass-bg}'
    border: '1px solid {colors.glass-border}'
    rounded: '{rounded.xxl}'
    padding: 48px
    backdropFilter: blur(20px)
    maxWidth: 600px
  btn-cta-gradient:
    backgroundColor: '#5046e5'
    textColor: '#ffffff'
    rounded: '{rounded.full}'
    padding: 14px 36px
    typography: '{typography.body-md}'
    fontWeight: '600'
    transition: transform 0.2s, box-shadow 0.2s
  btn-cta-gradient-hover:
    transform: translateY(-2px)
    boxShadow: '0 8px 30px rgba(99,102,241,0.3)'
  sub-link:
    color: '{colors.on-surface-variant}'
    fontSize: 13px
    transition: color 0.2s
  sub-link-hover:
    color: '{colors.on-surface}'
  footer:
    color: '{colors.outline}'
    fontSize: 13px
    borderTop: '1px solid {colors.glass-border}'
    padding: 32px 24px
  selection:
    backgroundColor: 'rgba(99, 102, 241, 0.3)'
---

## Overview

**Stitch** is Google Labs' AI-powered design tool that generates production-ready UI screens for mobile and web from natural language descriptions. The brand sits at the intersection of developer tooling and creative design — aimed at product teams who want to iterate on UI faster without sacrificing quality.

The design system is **deep-space premium**: a dark navy foundation (#0b1326) overlaid with translucent glass surfaces that use subtle borders and backdrop blur to create depth without heaviness. Purple-to-pink gradient accents (indigo #6366f1 through fuchsia #d946ef) provide energy and signal interactivity, while lavender-tinted white text (#dae2fd) keeps readability high against the dark canvas.

The emotional tone is **confident and futuristic** — like a mission control center for design. The interface communicates power through restraint: generous whitespace, clean grids, and precise typography hierarchies. A developer terminal mockup in the hero section announces the product's CLI-native roots, while pill-shaped buttons and rounded glass cards soften the technical edge into approachability.

The tagline "**Design with AI**" captures the core promise: Stitch doesn't replace designers, it accelerates them.

## Colors

The color system is built on a deep navy foundation with purple-indigo accents, designed for a dark-mode-first experience.

### Surface & Background

The surface palette provides 8 levels of container elevation, from `surface-container-lowest` (#060e20, nearly black) through `surface-bright` (#31394d, subtle navy-lavender). The base `surface` (#0b1326) and `background` (#0b1326) are identical — a deep midnight navy that appears black at first glance but carries enough chromatic warmth to feel intentional.

- **surface-container-lowest (#060e20):** Reserved for terminal windows and code blocks. The deepest surface, almost indistinguishable from pure black.
- **surface-container-low (#131b2e):** Side panels, secondary backgrounds.
- **surface-container (#171f33):** Default card background in the glass system.
- **surface-container-high (#222a3d):** Hover state backgrounds for interactive cards.
- **surface-container-highest (#2d3449):** The brightest container, used for maximum contrast against the deep surface.

### Text

- **on-surface (#dae2fd):** The primary text color — a lavender-tinted off-white. Not pure white, which would feel harsh against the dark navy. Carries a slight cool hue that aligns with the indigo accent family.
- **on-surface-variant (#c4c7c8):** Secondary text, descriptions, metadata. A muted silver-gray that sits comfortably below primary text in hierarchy without losing legibility.

### Accent Gradient

The product identity is anchored by a 4-stop purple gradient used for the logo, CTA buttons, hero text, and interactive accents:

1. **#6366f1 (Indigo)** — Gradient start. A blue-leaning purple with high energy.
2. **#8b5cf6 (Purple)** — Balanced midpoint.
3. **#a855f7 (Violet)** — Warmer, leaning toward magenta.
4. **#d946ef (Pink/Fuchsia)** — Gradient end. Rarely used in isolation; adds a pop when the gradient is at full span.

### Glass & Borders

All component surfaces use translucent alpha values over the dark background to create the glassmorphism effect:

- **Glass background:** rgba(255, 255, 255, 0.04) — barely perceptible alone, creates a subtle separation when stacked.
- **Glass border:** rgba(255, 255, 255, 0.06) — defines card edges without harsh lines.
- **Glass hover:** rgba(255, 255, 255, 0.07) — slight brightening on interaction.
- **Glass strong:** rgba(255, 255, 255, 0.10) — used for secondary button backgrounds and elevated states.

### Semantic Colors

- **Secondary (#adc9eb):** A soft sky blue used for badges and active tab text. Provides a cool counterpoint to the purple gradient.
- **Error (#ffb4ab):** Soft red-pink for error states. Warm enough to signal problems but desaturated enough to stay premium.
- **Outline (#8e9192):** Gray for low-priority borders and footer text.

## Typography

The type system uses two families: **Plus Jakarta Sans** for display and headline roles, **Inter** for body and UI text.

### Plus Jakarta Sans — Display & Headlines

Rounded terminals and a generous x-height give Plus Jakarta Sans a friendly, approachable feel at large sizes. Used exclusively for hero text, section titles, and anything requiring prominence.

- **Display (84px → 42px responsive, 800 weight):** The hero "Design with AI" headline. Tight tracking (-0.04em) and aggressive sizing create a dramatic entry point. The weight is maximum (800) to hold presence against the dark background.
- **Headline Large (40px → 28px responsive, 800 weight):** Section titles like "Generate, iterate, ship" and "Agent Skills". Slightly looser tracking (-0.03em).
- **Headline Medium (32px, 700 weight):** CTA section titles. One step down from the major section headers.

### Inter — Body & UI

Inter's neutral, geometric clarity provides legibility at small sizes and works well as a reading face. Its narrower character set fits more information into UI slots.

- **Body Large (20px → 16px responsive):** Hero description paragraph. The only body text at this size.
- **Body Medium (16px):** Feature card descriptions, CTA body text, default reading size.
- **Body Small (14px):** Skill card descriptions, SDK entry descriptions, inline code references.
- **Label Small (12px, uppercase, 0.06em tracking):** Section labels like "Capabilities", "Ecosystem", "Developers". Adds a technical, specification-like quality to section headers.
- **Label Tiny (10px, uppercase, 0.04em tracking):** Plugin badges inside skill cards.

### Code — JetBrains Mono / Fira Code

Monospace is used exclusively for code references, terminal output, and SDK import paths. The terminal window uses 13px code with three color roles:

- **Prompt (#a855f7):** The `$` shell prompt, matches the violet gradient accent.
- **String (#a7d9a9):** The quoted command arguments, a soft green for readability.
- **Comment (#6a6a6a):** Output lines, comments, and secondary terminal info.

## Layout & Spacing

The layout follows a single-column, vertically-scrolling narrative structure. Content is centered with a maximum width of 1100px for sections.

### Vertical Rhythm

An 8px base unit governs all spacing:

- **Section vertical padding:** 100px (xxl) — generous breathing room between major sections.
- **Container padding:** 24px (md) on each side, collapsing on mobile.
- **Card gaps:** 20px between grid items.
- **Hero top padding:** 120px to clear the fixed nav bar.

### Grid System

Three responsive grid templates are used in sequence:

- **Features grid:** `repeat(auto-fit, minmax(300px, 1fr))` — 2-3 column layout.
- **Skills grid:** `repeat(auto-fit, minmax(260px, 1fr))` — 3-4 column layout for denser content.
- **SDK grid:** `repeat(auto-fit, minmax(300px, 1fr))` — 3 columns at full width.

All grids collapse to single-column at 640px breakpoint.

### Navigation

Fixed top bar with 56px height. The nav is a translucent glass surface (blur 20px) that sits above all content. Logo on the left, links on the right with an "Open Stitch" primary pill button. Navigation links disappear at mobile breakpoint (<640px).

## Elevation & Depth

Depth is created through glassmorphism — translucent surfaces over the dark background — rather than drop shadows.

### Glass Stack

- **Level 0 (Background):** The solid #0b1326 surface with a fixed purple glow gradient radiating from the top center. This glow is the only decorative background element.
- **Level 1 (Cards):** `rgba(255,255,255,0.04)` background, `rgba(255,255,255,0.06)` border, `blur(12px)` backdrop filter. Used for feature cards, skill cards, SDK entries.
- **Level 2 (Elevated):** `rgba(255,255,255,0.06)` background on hover, border brightens to `rgba(255,255,255,0.10)`. Cards lift 2px on hover.
- **Level 3 (CTA card):** Slightly thicker `rgba(255,255,255,0.03)` background with `blur(20px)` and `rgba(255,255,255,0.06)` border. Wrapped in a purple radial glow background.
- **Level 4 (Nav):** `rgba(11,19,38,0.6)` background with `blur(20px)` and subtle bottom border. Highest z-index at 100.

### Hover System

All interactive elements use a consistent 200-250ms ease transition:

- Cards: background brightens, border becomes more visible, optional 2px upward translate
- Links: color shift from `on-surface-variant` to `on-surface`
- Primary buttons: opacity drop to 0.85
- Gradient CTA button: 2px lift + purple glow box-shadow

## Shapes

The shape language is consistently rounded and pill-based, creating a soft, approachable feel.

### Corner Radius Scale

- **none (0):** Reserved for future full-bleed elements.
- **sm (4px):** Inline code backgrounds.
- **DEFAULT (8px):** Logo icon (SVG rect).
- **md (12px):** Feature icon containers.
- **lg (16px):** Terminal window, skill cards, SDK entries.
- **xl (20px):** Feature cards — the primary card radius.
- **xxl (24px):** CTA container glass card.
- **full (9999px):** All buttons, badges, tags, tabs, and pill elements.

### Shape Rules

- Cards with interactive hover states get the largest non-pill radius (xl, 20px).
- Purely informational containers (SDK entries) use a slightly smaller radius (lg, 16px).
- All clickable targets — buttons, tabs, tags — use full pill shapes.
- Icons and icon containers use md (12px) to distinguish them from cards and pills.

## Components

### Navigation Bar

Fixed-position top bar spanning the full viewport width. Contains the Stitch logo (SVG with indigo-to-purple gradient fill) on the left and navigation links on the right. The rightmost link is a white primary pill button labeled "Open Stitch" that links to the actual product. The bar is translucent glass with blur, letting the page content show through as the user scrolls. Navigation links hide entirely at mobile breakpoint.

### Hero Section

The most visually dramatic section, taking full viewport height (min-height: 100vh). Contains four stacked elements:

1. **Badge:** "✦ Google Labs — Beta" in a purple-tinted pill. Establishes provenance and stage.
2. **Display headline:** "Design with AI" rendered in Plus Jakarta Sans 800 weight. Text uses a 3-stop gradient (white → secondary blue → violet) that fades from left to right.
3. **Description paragraph:** A single sentence explaining Stitch's core value proposition.
4. **Action buttons:** Two buttons side by side — "Try Stitch" (white primary) and "Learn more" (glass secondary).
5. **Terminal window:** Below the buttons, a code terminal mockup showing a `stitch generate` command and its output. Three colored dots (red/yellow/green) in the top left mimic a macOS terminal. Command syntax uses violet prompts, green strings, and gray comments.

### Feature Cards

A responsive grid of 6 feature cards, each with:

- A colored icon container (44x44px, 12px radius, tinted background matching the icon's theme)
- A title in 18px semibold
- A description in 14px body text on `on-surface-variant`
- 1-2 tag pills at the bottom showing related technologies

Each card lifts 2px on hover and brightens slightly. The 6 features are:

1. **Text-to-UI Generation** — Natural language → complete HTML/CSS
2. **Edit & Variants** — Iterative refinement, generate multiple visual directions
3. **Design Systems** — DESIGN.md specs for brand consistency
4. **MCP Integration** — Connect with Cursor, Claude Code, Codex
5. **Mobile & Web** — Phone, tablet, desktop viewports
6. **Export & Download** — HTML, screenshots, SDK pipeline

### Skills Section

A filterable gallery of 14 agent skills in a responsive grid. A row of pill-shaped tabs (All | Build | Design | Utilities) lets users filter by plugin category. Each skill card shows:

- **Name:** The skill's full identifier (e.g., `stitch::react-components`)
- **Description:** One-line explanation of what the skill does
- **Plugin badge:** Colored pill showing the plugin group + tag

The tabs use the purple-tinted active state. Cards are purely informational with hover brightening — no lift.

### SDK Entries

Three cards showing the three SDK entry points: `stitch/ai`, `stitch/adk`, and `stitch` (core). Each has a monospace header in violet and a description explaining the adapter pattern. Inline `code` elements use a subtle glass background to distinguish them from prose.

### CTA Section

A centered glass card with a gradient "Open Stitch" button. The button uses the indigo-to-violet gradient and gains a matching glow box-shadow on hover. Below the button, three secondary links point to the SDK, Skills, and Jules Prompts GitHub repos.

### Footer

Minimal footer with "Built by Google Labs" link and Apache 2.0 license note. Gray text on a top-bordered container.

## Do's and Don'ts

- **Do** use the dark navy surface as the foundation for all pages. It is the brand's most distinctive element.
- **Do** use purple-indigo gradients for primary call-to-action buttons and interactive accents.
- **Do** apply glassmorphism (translucent backgrounds + backdrop blur) for cards and containers.
- **Do** use Plus Jakarta Sans 800 for all major headlines.
- **Do** keep one terminal or code element visible on the page to reinforce the developer tool identity.
- **Don't** use pure black (#000) anywhere — the deepest surface is #060e20.
- **Don't** use pure white (#fff) for body text — use on-surface (#dae2fd) instead.
- **Don't** add drop shadows to cards. Depth comes from glass translucency, not shadows.
- **Don't** use solid backgrounds for cards — always use alpha-transparent values over the dark surface.
- **Don't** add heavy borders. All borders should be 1px at rgba(255,255,255,0.06) or similar.
- **Don't** use rounded corners smaller than 12px for interactive cards.
- **Don't** clutter the nav bar — it should contain the logo and no more than 4-5 links.
- **Don't** use the gradient CTA style for secondary actions — reserve it for the primary conversion point.
- **Don't** introduce additional font families beyond the three defined here.
