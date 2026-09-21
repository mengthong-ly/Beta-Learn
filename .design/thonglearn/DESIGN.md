---
version: alpha
name: Notion-design-analysis
description: Notion presents itself as the all-in-one workspace through a confident, illustration-rich brand voice — anchored by a deep navy hero band ({colors.brand-navy}) decorated with brand-colored sticky-note dots and mesh wire illustrations, a signature purple pill primary CTA ({colors.primary}), and a rich palette of pastel-tinted feature cards that echo the colorful database properties of the live product. The system uses a Notion-Sans (Inter-based) typeface across every UI surface, anchors a 4-tier pricing comparison (Free / Plus / Business / Enterprise), and presents the live workspace UI mockup directly inside the hero band. Coverage spans homepage, Enterprise, Product AI, Product Agents, Startups, and Pricing surfaces.

colors:
  primary: "#5645d4"
  primary-pressed: "#4534b3"
  primary-deep: "#3a2a99"
  on-primary: "#ffffff"
  brand-navy: "#0a1530"
  brand-navy-deep: "#070f24"
  brand-navy-mid: "#1a2a52"
  link-blue: "#0075de"
  link-blue-pressed: "#005bab"
  brand-orange: "#dd5b00"
  brand-orange-deep: "#793400"
  brand-pink: "#ff64c8"
  brand-pink-deep: "#a02e6d"
  brand-purple: "#7b3ff2"
  brand-purple-300: "#d6b6f6"
  brand-purple-800: "#391c57"
  brand-teal: "#2a9d99"
  brand-green: "#1aae39"
  brand-yellow: "#f5d75e"
  brand-brown: "#523410"
  card-tint-peach: "#ffe8d4"
  card-tint-rose: "#fde0ec"
  card-tint-mint: "#d9f3e1"
  card-tint-lavender: "#e6e0f5"
  card-tint-sky: "#dcecfa"
  card-tint-yellow: "#fef7d6"
  card-tint-yellow-bold: "#f9e79f"
  card-tint-cream: "#f8f5e8"
  card-tint-gray: "#f0eeec"
  canvas: "#ffffff"
  surface: "#f6f5f4"
  surface-soft: "#fafaf9"
  hairline: "#e5e3df"
  hairline-soft: "#ede9e4"
  hairline-strong: "#c8c4be"
  ink-deep: "#000000"
  ink: "#1a1a1a"
  charcoal: "#37352f"
  slate: "#5d5b54"
  steel: "#787671"
  stone: "#a4a097"
  muted: "#bbb8b1"
  on-dark: "#ffffff"
  on-dark-muted: "#a4a097"
  semantic-success: "#1aae39"
  semantic-warning: "#dd5b00"
  semantic-error: "#e03131"

typography:
  hero-display: { fontFamily: Notion Sans, fontSize: 80px, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2px }
  display-lg: { fontFamily: Notion Sans, fontSize: 56px, fontWeight: 600, lineHeight: 1.10, letterSpacing: -1px }
  heading-1: { fontFamily: Notion Sans, fontSize: 48px, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.5px }
  heading-2: { fontFamily: Notion Sans, fontSize: 36px, fontWeight: 600, lineHeight: 1.20, letterSpacing: -0.5px }
  heading-3: { fontFamily: Notion Sans, fontSize: 28px, fontWeight: 600, lineHeight: 1.25 }
  heading-4: { fontFamily: Notion Sans, fontSize: 22px, fontWeight: 600, lineHeight: 1.30 }
  heading-5: { fontFamily: Notion Sans, fontSize: 18px, fontWeight: 600, lineHeight: 1.40 }
  subtitle: { fontFamily: Notion Sans, fontSize: 18px, fontWeight: 400, lineHeight: 1.50 }
  body-md: { fontFamily: Notion Sans, fontSize: 16px, fontWeight: 400, lineHeight: 1.55 }
  body-md-medium: { fontFamily: Notion Sans, fontSize: 16px, fontWeight: 500, lineHeight: 1.55 }
  body-sm: { fontFamily: Notion Sans, fontSize: 14px, fontWeight: 400, lineHeight: 1.50 }
  body-sm-medium: { fontFamily: Notion Sans, fontSize: 14px, fontWeight: 500, lineHeight: 1.50 }
  caption: { fontFamily: Notion Sans, fontSize: 13px, fontWeight: 400, lineHeight: 1.40 }
  caption-bold: { fontFamily: Notion Sans, fontSize: 13px, fontWeight: 600, lineHeight: 1.40 }
  micro: { fontFamily: Notion Sans, fontSize: 12px, fontWeight: 500, lineHeight: 1.40 }
  micro-uppercase: { fontFamily: Notion Sans, fontSize: 11px, fontWeight: 600, lineHeight: 1.40, letterSpacing: 1px }
  button-md: { fontFamily: Notion Sans, fontSize: 14px, fontWeight: 500, lineHeight: 1.30 }

rounded: { xs: 4px, sm: 6px, md: 8px, lg: 12px, xl: 16px, xxl: 20px, xxxl: 24px, full: 9999px }

spacing: { xxs: 4px, xs: 8px, sm: 12px, md: 16px, lg: 20px, xl: 24px, xxl: 32px, xxxl: 40px, section-sm: 48px, section: 64px, section-lg: 96px, hero: 120px }

components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.md}", padding: "10px 18px" }
  button-primary-pressed: { backgroundColor: "{colors.primary-pressed}", textColor: "{colors.on-primary}" }
  button-primary-disabled: { backgroundColor: "{colors.hairline}", textColor: "{colors.muted}" }
  button-dark: { backgroundColor: "{colors.ink-deep}", textColor: "{colors.on-dark}", typography: "{typography.button-md}", rounded: "{rounded.md}", padding: "10px 18px" }
  button-secondary: { backgroundColor: "transparent", textColor: "{colors.ink}", typography: "{typography.button-md}", rounded: "{rounded.md}", padding: "10px 18px", border: "1px solid {colors.hairline-strong}" }
  button-on-dark: { backgroundColor: "{colors.on-dark}", textColor: "{colors.ink}", typography: "{typography.button-md}", rounded: "{rounded.md}", padding: "10px 18px" }
  button-secondary-on-dark: { backgroundColor: "transparent", textColor: "{colors.on-dark}", typography: "{typography.button-md}", rounded: "{rounded.md}", padding: "10px 18px", border: "1px solid {colors.on-dark-muted}" }
  button-ghost: { backgroundColor: "transparent", textColor: "{colors.ink}", typography: "{typography.button-md}", rounded: "{rounded.sm}", padding: "8px 12px" }
  button-link: { backgroundColor: "transparent", textColor: "{colors.link-blue}", typography: "{typography.body-sm-medium}", padding: "0" }
  card-base: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "{spacing.xl}", border: "1px solid {colors.hairline}" }
  card-feature: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "{spacing.xxl}", border: "1px solid {colors.hairline}" }
  card-feature-yellow-bold: { backgroundColor: "{colors.card-tint-yellow-bold}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-feature-peach: { backgroundColor: "{colors.card-tint-peach}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-feature-rose: { backgroundColor: "{colors.card-tint-rose}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-feature-mint: { backgroundColor: "{colors.card-tint-mint}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-feature-sky: { backgroundColor: "{colors.card-tint-sky}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-feature-lavender: { backgroundColor: "{colors.card-tint-lavender}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-feature-yellow: { backgroundColor: "{colors.card-tint-yellow}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-feature-cream: { backgroundColor: "{colors.card-tint-cream}", textColor: "{colors.charcoal}", rounded: "{rounded.lg}", padding: "{spacing.xxl}" }
  card-agent-tile: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "{spacing.xl}", border: "1px solid {colors.hairline}" }
  card-template: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "{spacing.lg}", border: "1px solid {colors.hairline}" }
  card-startup-perk: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "{spacing.xl}", border: "1px solid {colors.hairline}" }
  pricing-card: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "{spacing.xxl}", border: "1px solid {colors.hairline}" }
  pricing-card-featured: { backgroundColor: "{colors.surface}", rounded: "{rounded.lg}", padding: "{spacing.xxl}", border: "2px solid {colors.primary}" }
  text-input: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", typography: "{typography.body-md}", rounded: "{rounded.md}", padding: "{spacing.sm} {spacing.md}", border: "1px solid {colors.hairline-strong}", height: 44px }
  text-input-focused: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", border: "2px solid {colors.primary}" }
  search-pill: { backgroundColor: "{colors.surface}", textColor: "{colors.steel}", typography: "{typography.body-md}", rounded: "{rounded.md}", padding: "{spacing.sm} {spacing.md}", height: 44px, border: "1px solid {colors.hairline}" }
  pill-tab: { backgroundColor: "transparent", textColor: "{colors.steel}", typography: "{typography.body-sm-medium}", rounded: "{rounded.full}", padding: "{spacing.xs} {spacing.md}", border: "1px solid {colors.hairline}" }
  pill-tab-active: { backgroundColor: "{colors.ink-deep}", textColor: "{colors.on-dark}", rounded: "{rounded.full}", border: "1px solid {colors.ink-deep}" }
  segmented-tab: { backgroundColor: "transparent", textColor: "{colors.steel}", typography: "{typography.body-sm-medium}", padding: "{spacing.sm} {spacing.md}", border: "0 0 2px transparent solid" }
  segmented-tab-active: { backgroundColor: "transparent", textColor: "{colors.ink}", typography: "{typography.body-sm-medium}", border: "0 0 2px {colors.ink} solid" }
  badge-purple: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.caption-bold}", rounded: "{rounded.full}", padding: "4px 10px" }
  badge-pink: { backgroundColor: "{colors.brand-pink}", textColor: "{colors.on-primary}", typography: "{typography.caption-bold}", rounded: "{rounded.full}", padding: "4px 10px" }
  badge-orange: { backgroundColor: "{colors.brand-orange}", textColor: "{colors.on-primary}", typography: "{typography.caption-bold}", rounded: "{rounded.full}", padding: "4px 10px" }
  badge-tag-purple: { backgroundColor: "{colors.card-tint-lavender}", textColor: "{colors.brand-purple-800}", typography: "{typography.caption-bold}", rounded: "{rounded.sm}", padding: "2px 8px" }
  badge-tag-orange: { backgroundColor: "{colors.card-tint-peach}", textColor: "{colors.brand-orange-deep}", typography: "{typography.caption-bold}", rounded: "{rounded.sm}", padding: "2px 8px" }
  badge-tag-green: { backgroundColor: "{colors.card-tint-mint}", textColor: "{colors.brand-green}", typography: "{typography.caption-bold}", rounded: "{rounded.sm}", padding: "2px 8px" }
  badge-popular: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.caption-bold}", rounded: "{rounded.full}", padding: "4px 10px" }
  promo-banner: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", typography: "{typography.body-sm-medium}", padding: "{spacing.sm} {spacing.md}" }
  hero-band-dark: { backgroundColor: "{colors.brand-navy}", textColor: "{colors.on-dark}", rounded: "0", padding: "{spacing.hero}" }
  workspace-mockup-card: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "0", border: "1px solid {colors.hairline}", shadow: "rgba(15, 15, 15, 0.2) 0px 24px 48px -8px" }
  cta-banner-light: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.lg}", padding: "{spacing.section}" }
  comparison-table: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", typography: "{typography.body-sm}", rounded: "{rounded.md}", border: "1px solid {colors.hairline}" }
  comparison-row: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", padding: "{spacing.md} {spacing.lg}", border: "0 0 1px {colors.hairline-soft} solid" }
  testimonial-card: { backgroundColor: "{colors.canvas}", rounded: "{rounded.lg}", padding: "{spacing.xxl}", border: "1px solid {colors.hairline}" }
  logo-wall-item: { backgroundColor: "transparent", textColor: "{colors.steel}", typography: "{typography.body-md-medium}", padding: "{spacing.lg}" }
  faq-accordion-item: { backgroundColor: "{colors.canvas}", rounded: "{rounded.md}", padding: "{spacing.xl}", border: "0 0 1px {colors.hairline} solid" }
  stat-row: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.lg}", padding: "{spacing.section-sm}" }
  footer-region: { backgroundColor: "{colors.canvas}", textColor: "{colors.charcoal}", typography: "{typography.body-sm}", padding: "{spacing.section} {spacing.xxl}", border: "1px solid {colors.hairline}" }
  footer-link: { backgroundColor: "transparent", textColor: "{colors.steel}", typography: "{typography.body-sm}", padding: "{spacing.xxs} 0" }
---

> Source: Notion design analysis supplied by the project owner (2026-09-21). The YAML token block above is the
> source of truth and is kept complete (condensed to flow style). The long-form prose sections of the original
> (Overview, per-component notes, marketing hero/pricing guidance) are summarised below; the marketing-only
> components are not used by PyLearn.

## Key rules PyLearn applies

- **Primary purple** `{colors.primary}` is reserved for the dominant action (Run / Check). Never for body text or large surfaces.
- **Link blue** `{colors.link-blue}` is for inline links only (and "Try it"). It is never mixed with primary purple.
- Buttons are `{rounded.md}` 8px rectangles, **not pills**. Cards are `{rounded.lg}` 12px. `{rounded.full}` is for badges and pill tabs only.
- Pastel `card-tint-*` colors carry emphasis (PyLearn callouts: sky = tip, peach = gotcha, lavender = challenge, mint = passed, yellow = note).
- Flat surfaces with `{colors.hairline}` borders; no heavy shadows on documentation cards. The modal shadow is `rgba(15,15,15,0.16) 0 16px 48px -8px`.
- Underline `segmented-tab` style for in-app tabs.
- Headline weight 600 / buttons 500 / body 400; body line-height 1.55.
- Motion: 150–200ms ease (the source leaves timing unspecified).

## Known gaps (from the source)

- No dark-mode tokens. PyLearn derives them in `src/index.css` (`.dark`).
- Notion Sans is proprietary. PyLearn uses **JetBrains Mono** for the entire UI, at the project owner's request (2026-09-21).
