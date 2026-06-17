# mpasys.ai — Site Design System & Build Rules

This is a multi-page marketing site (a scale.com-inspired build) for **mpasys.ai**.
**Consistency is the #1 rule.** Every page, section, and component MUST reuse the exact
same fonts, colours, type sizes, spacing, header, footer, and motion. Never introduce a
new font, a new accent colour, or a one-off size. If something is missing from the system
below, add it as a token/class in `styles.css` and reuse it — do not hard-code locals.

## Files
- `index.html` — home / landing page (canonical source for header + footer markup).
- `service-*.html` — service detail pages (template ref: scale.com/data-engine).
- `industry-*.html` — industry detail pages (template ref: scale.com/enterprise/insurance).
- `insights.html` — insights / engagement page (template ref: scale.com/blog).
- `styles.css` — **single shared stylesheet for the whole site.** All pages link it.
- `script.js` — shared JS: header light/dark, mega menu, GSAP scroll motion, orbit, etc.
- `images/` — local JPGs (research, medicine, autonomy, defense, finance, public, robotics,
  climate, aerospace …). Use these; do not hotlink external images.

When creating a new page: copy the `<header>…</header>` (with the `.mega` block) and the
`<footer>…</footer>` from `index.html` **verbatim**, link the same `styles.css` + `script.js`,
and only change the in-between page content. The header/footer must be byte-identical across pages.

## Typography
- **Primary font:** `Hanken Grotesk` (weights 300/400/500/600/700) — everything UI/body/headings.
- **Mono font:** `IBM Plex Mono` — only for small technical/eyebrow/legal labels & the leaderboard.
- Headings use weight **400** (not bold) with tight tracking. Body is **400**.
- Type scale (use `clamp()` exactly as below — do not invent new sizes):
  - Hero H1: `clamp(40px,5.6vw,76px)`, line-height 1.0, letter-spacing -.03em
  - Big display (footer/CTA): `clamp(40px,7.5vw,110px)` / CTA `clamp(40px,5.4vw,72px)`
  - Section title: `clamp(28px,4vw,56px)`, letter-spacing -.025em
  - Sub-section / card head: `clamp(24px,2.1vw,32px)`
  - Eyebrow (small label above a title): 15px, colour `--mauve`, mono optional
  - Body / paragraph: `clamp(15px,1.15vw,18px)`, line-height 1.5, colour `#2c2c2c`
  - Mega-menu link: **21px / weight 400 / -.015em** (ALL panels identical — see `.mega-link`)
  - Mega-menu category label: 15px, colour `#9a9a9a`
  - Nav item: 15px, weight 400

## Colour tokens (defined in `styles.css :root` — always reference the var)
- `--black #000` · `--white #fff` · `--ink #0a0a0a`
- Greys: `--gray-50 #f4f4f3` · `--gray-100 #e9e9e9` (light section bg) · `--gray-200 #dadada` · `--muted #929292`
- Brand purple: `--brand1 #7B5EA7` · `--brand2 #9B4FD8` · `--brand-grad linear-gradient(90deg,#7B5EA7,#9B4FD8)`
- Accents: `--green #173d28` · `--green-btn #1d4631` · `--tan #a89079` · `--blue-gray #98a8b9` · `--mauve #6f6a7d`
- Card-accent fills (benchmark click/hover): mauve `#6b6276`, tan `#a3866a`, green `#35684f`
- Default light card bg: `#f1efee`; white panel bg: `#fafafa`

## Spacing & layout
- Content max width: `--maxw 1280px` (header/mega use 1480px); side padding: `--pad 40px`.
- Section vertical padding: ~70–120px top/bottom (light sections), centered `max-width:var(--maxw);margin:0 auto`.
- Card radius: 20px (content cards), 14–16px (media/tiles), 8–11px (buttons/pills).
- Card padding: 36–40px. Grid gaps: 24px.
- Buttons: black pill `.btn-demo`/`.btn-dark` (#000 bg, white text); white pill `.btn-pill`;
  ghost/light pills use `rgba(0,0,0,.05)`.

## Header / Mega menu
- Fixed header, transparent over dark hero (white text), `.light` (solid `#f4f4f3`) over light sections,
  and `.menu-open` (solid white) while a mega panel is open. Logic in `script.js`.
- Mega menu = full-width white panel under the header, fades/slides down on **hover** of a `.nav-group`.
  Layout: left `.mega-cols` (categorised `.mega-link`s) + right `.mega-media` image. Closes on leave/Esc/click.
- Menus: **Services** → AI Consulting & Engineering, Zoho Implementation (+capabilities).
  **Industries** → Manufacturing & Mittelstand, Logistics & Supply Chain, Finance & Insurance,
  Professional Services, Healthcare Operations, B2B Sales Organisations.
  **Insights** → Understanding call — 30 minutes, Assessment — 1 to 2 weeks,
  Build and deploy — 4 to 8 weeks, Handover and support.

## Footer
- Black `#000` background, oversized headline, 4 link columns (Services / Industries / Company / Legal),
  social icons + legal row. Identical on every page.

## Motion (GSAP + ScrollTrigger)
- Keep transforms GPU-light (translate/scale/opacity only — no per-frame 3D perspective, no animated
  gradients, no `will-change` on full-screen layers). This preview renderer freezes on heavy compositing.
- Patterns in use: hero parallax; pinned 2D panel stacks; scrubbed word-reveal; the orbit (rAF, transform-only);
  **stacking-card overlap** (a section pins via `position:sticky` while the next `z-index:2` section slides over it —
  used for stat→orbit and partners→benchmark); reveal-on-scroll fade-ups.
- After adding async content (images/fonts) always `ScrollTrigger.refresh()` on `load` (already wired).

## Voice / content
- Audience: German enterprise (Mittelstand, regulated industries). Tone: direct, senior, no hype.
- Recurring proof points: 15+ enterprise projects, Authorized Zoho Partner, GDPR-by-design, EU AI Act ready.
- CTA everywhere: "Talk to Us" / "Book a 30-Minute Call" → `mailto:kailash@mpasys.ai`.
