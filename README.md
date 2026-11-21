# Castor Technologies — Website

Production static site for [usecastor.github.io](https://usecastor.github.io).
Astro 5 (static output) + React 19 (interactive islands) + TypeScript (strict) + Tailwind CSS v4 (`@tailwindcss/vite`) + Motion (`motion/react`) + NumberFlow + Fontsource.

## Stack

| Layer | Package |
|---|---|
| Framework | `astro@5` (`output: 'static'`), Shiki theme `github-dark-default`, `@astrojs/sitemap` |
| Interactivity | `react@19` / `react-dom@19` via `@astrojs/react`; islands use `motion/react` (Framer) + `@number-flow/react` for scroll-triggered metric animation — no GSAP, no Lenis, no scroll hijacking |
| Styling | `tailwindcss@4` via `@tailwindcss/vite`; design tokens in `src/styles/tokens.css`, theme bindings + anti-slop utilities (`.spec-grid`, `.tactile-btn`, `.tabular`, `.folio-bar`, `.machined-card`) in `src/styles/global.css` |
| Type | `tsconfig.json` extends `astro/tsconfigs/strict` with `jsx: 'react-jsx'`; type gate via `pnpm run check` (`astro check` / `@astrojs/check`) |
| Fonts | `@fontsource-variable/archivo` (display), `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` — Latin subsets only, self-hosted, no CDN |
| Deploy | `vercel.json` (Vercel, `framework: astro`, clean URLs, security headers, immutable `/_astro/*`) + `.github/workflows/deploy.yml` (GitHub Pages, `ASTRO_BASE=/Castor`) |

## Routes

| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Four React 19 islands: `HeroCinema` (`client:load`), `DualEngineBeam` / `SavingsInstrument` / `DeployDeck` (`client:visible`) |
| `/benchmarks/qwen3-8-27b-rtx-3090/` | `src/pages/benchmarks/qwen3-8-27b-rtx-3090.astro` | 78-day `castor stats` ledger, live vLLM/nvidia-smi snapshot, VRAM tier matrix, vendor benchmarks, methodology |
| `/claude-code-local-llm/` | `src/pages/claude-code-local-llm.astro` | Wing 1 (Cloud + Local Hybrid): 60-second MCP setup, 93.8% KV reuse math, cloud pricing, FAQ |
| `/enterprise/air-gapped-coding-agent/` | `src/pages/enterprise/air-gapped-coding-agent.astro` | Wing 2 (100% Local-Only & Air-Gapped): 5-layer sandbox, runtime gates, zero-egress build, engagement tiers, CISO FAQ |

All root-relative asset paths derive from `import.meta.env.BASE_URL`, so the same build serves `/` on Vercel and `/Castor/` on GitHub Pages.

## Layout

```
website/
├── astro.config.mjs          # static output, tailwindcss() + react() + sitemap() Vite plugins, shiki theme, base/site from env
├── tsconfig.json             # extends astro/tsconfigs/strict, jsx: react-jsx
├── vercel.json               # framework: astro, clean URLs, security headers, immutable /_astro/*
├── pnpm-workspace.yaml       # pnpm build-script allowlist (esbuild, sharp)
├── .github/workflows/
│   └── deploy.yml            # GitHub Pages build (ASTRO_BASE=/Castor)
├── public/
│   ├── assets/               # logo.svg, favicon.svg, og-card.png, pure1_dioscuri_dyad.svg
│   ├── llms.txt              # buyer-facing summary for LLM/RAG ingestion
│   ├── llms-full.txt         # full technical specification
│   └── robots.txt
└── src/
    ├── styles/
    │   ├── tokens.css        # Obsidian Hardware Instrument Chassis design tokens
    │   └── global.css        # Tailwind v4 @theme bindings, .spec-grid, .tactile-btn, .folio-bar, .machined-card, reduced-motion
    ├── data/
    │   └── telemetry.ts      # measured Nov 21 2026 ground-truth constants (78-day ledger, hardware, VRAM tiers, cloud pricing, architecture, positioning fronts)
    ├── layouts/
    │   └── Layout.astro      # meta/OG tags, favicon, Fontsource weights, pre-paint theme restore, JSON-LD graph, theme-change broadcast
    ├── components/
    │   ├── Header.astro      # sticky dark-glass nav, Light/Dark toggle, install CTA
    │   ├── Footer.astro      # minimal obsidian footer
    │   ├── QuickstartFooter.astro  # 60-second install + copy CTA (reused by subpages)
    │   └── v3/
    │       ├── HeroCinema.tsx       # ACT 1 · hero above-the-fold (client:load)
    │       ├── DualEngineBeam.tsx   # ACT 2 · animated cloud→core→local beam + NumberFlow metrics
    │       ├── SavingsInstrument.tsx# ACT 3 · savings instrument
    │       ├── DeployDeck.tsx       # ACT 4 · deploy / two wings / four fronts
    │       └── SafeNumberFlow.tsx   # NumberFlow wrapper with SSR-safe fallback
    └── pages/
        ├── index.astro
        ├── claude-code-local-llm.astro
        ├── benchmarks/qwen3-8-27b-rtx-3090.astro
        └── enterprise/air-gapped-coding-agent.astro
```

## Workflow

```bash
pnpm install       # installs; pnpm-workspace.yaml permits esbuild/sharp build scripts
pnpm dev           # local dev server (ASTRO_TELEMETRY_DISABLED=1)
pnpm build         # static build → dist/
pnpm preview       # serve the built site
pnpm check         # astro check (strict TS)
npx tsc --noEmit   # standalone type gate
```

## Deploy

**Vercel (default, base `/`):** zero-config — import the repo, set root to `website`. `vercel.json` pins `framework: "astro"`, clean URLs, strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`) and immutable caching for `/_astro/*`. CLI: `vercel --prod`.

**GitHub Pages (base `/Castor`):** `.github/workflows/deploy.yml` builds with `ASTRO_BASE=/Castor` and publishes to Pages. Every asset path and the sitemap are derived from `base`, so both targets get correctly-prefixed absolute URLs.

## Design invariants (enforced in `global.css`)

- Teenage Engineering hairline chassis: `.spec-grid` = 1px-gap grid, 1px hairline border, zero border-radius, zero drop shadows.
- `.tactile-btn` / `.tactile-key` = hardware-pressed key surface (inset highlight, pressed state).
- `.folio-bar` = two-edge specimen caption bar (coordinate left, folio index right) for section headers — matches the homepage visual grammar.
- `.tabular` = tabular numerals for every telemetry readout.
- `.machined-card` = crisp 3px-radius industrial card with a single 1px hairline border.
- Signals: `--signal-local` (amber) for local silicon / primary CTA, `--signal-cloud` (cobalt) for cloud / MCP, `--signal-ok` for PASS, `--signal-block` for security refusals.
- No diffuse neon glows, no purple gradients, no oversized corner-radius bloat.
- Motion is native CSS + `motion/react` islands only — full `prefers-reduced-motion: reduce` handling, no scroll hijacking (pages paint at full opacity from first frame).
