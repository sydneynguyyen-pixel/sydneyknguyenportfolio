# Portfolio Redesign — Claude Code Prompts

Vanilla HTML/CSS/JS site (no framework, no build step). Files: `index.html`,
`style.css`, `script.js`, plus standalone project pages (`iterait.html`,
`room2talk.html`, `soundbite.html`, `voqa.html`, `marketing.html`).

**Run these one at a time, in order. After each: test in the browser, then
commit** (`git add . && git commit -m "..."`) so you can undo cleanly.

Target structure:
- **Hero** — keep the art ring, but with a bigger centered profile pic + name (the anchor of the whole site)
- **Section 1** — Case studies (kept as they look now)
- **Section 2** — Marketing & Brand as a board of small widgets
- **Section 3** — Other projects as small chips
- **About** and **Resume** — their own pages

---

## Prompt 1 — Split About & Resume into their own pages

```
Vanilla HTML/CSS/JS portfolio, no framework. Read index.html, style.css,
script.js first.

Right now "About Me" and "Experience & Education" live in slide-up panels on
index.html: markup in #about-panel and #resume-panel, opened by the tabs
#about-peeker and #resume-peeker via toggleAboutPanel() / toggleResumePanel()
in script.js.

Make them their own pages instead, matching how my project pages work:
1. Create about.html and resume.html as standalone pages. Clone the shared
   shell (head, fonts, cursor, footer) from an existing page like marketing.html
   so they look consistent, then move the About content into about.html and the
   Experience/Education content into resume.html.
2. Change #about-peeker and #resume-peeker into normal links
   (<a href="about.html"> / <a href="resume.html">), keeping their styling.
3. Remove the now-unused #about-panel / #resume-panel markup from index.html and
   the toggle functions (and references) from script.js.
4. Mobile: I already have about-mobile.html and experience-mobile.html — wire the
   mobile nav to those the same way.

Match my existing class names, structure, and indentation exactly. No new
libraries. List every file you changed and tell me what to click to test.
```

---

## Prompt 2 — Convert the homepage to scroll + build the hero

```
Vanilla HTML/CSS/JS portfolio. Read index.html, style.css, script.js first.

Right now index.html is a FIXED, no-scroll "desktop" (body/html and
#desktop-canvas are overflow:hidden) with absolutely-positioned pieces: the art
ring (#ring-section, .ring-avatar, .ring-name, .ring-tagline, .ring-otw), a CD
player (#cdplayer), a sticker sheet, a fake macOS menubar (.menubar), and a
case-studies strip (.cs-zone / #cs-inline-grid). I want to turn it into a
scrolling page WITHOUT losing these pieces.

Do this:
1. Enable page scroll: remove overflow:hidden from body/html. Keep overflow:hidden
   only on the inner widgets that need it (CD player, etc.).
2. HERO (first 100vh section): keep the animated art ring, but center a LARGER
   profile picture (assets/profile pictures/pfp 1.jpg) and my name ("Sydney
   Nguyen") inside it as the focal point, with the tagline and an "open to work"
   pill below. This is the hero of the whole site — make it feel like the anchor.
   Keep the CD player and sticker sheet as smaller playful accents in this hero
   area (I may remove them later, so keep them easy to delete).
3. Convert the fake .menubar into a REAL sticky top nav that stays visible while
   scrolling: links for Home (scroll to top), Work (scroll to case studies),
   About (about.html), Resume (resume.html). Keep it minimal and on-brand.
4. Below the hero, create three stacked sections in this order, each as its own
   block in the scroll flow. For now just MOVE the existing content into them so
   the page is functional — later prompts will restyle sections 2 and 3:
     - Section 1 "Case Studies": move the existing .cs-zone / #cs-inline-grid here.
     - Section 2 "Marketing & Brand": placeholder heading + a link to
       marketing.html for now.
     - Section 3 "Other Projects": move the existing .side-works-list here.
5. CRITICAL: any element that was absolutely positioned against the viewport must
   be re-anchored to ITS OWN section (give each section position:relative) so
   nothing floats to the wrong place after the layout scrolls.
6. Add generous vertical rhythm between sections (~15–25vh) so it breathes.
7. Keep the separate #mobile-view working; mirror the same section order there.

Don't break the CD player, ring animation, stickers, or drag/hover logic. List
every file changed and tell me exactly what to scroll/click to test.
```

---

## Prompt 3 — Polish the Case Studies section + scroll reveals

```
Vanilla HTML/CSS/JS portfolio. The homepage now scrolls with a Case Studies
section built from .cs-card items (iterait, room2talk, soundbite, voqa). Read
index.html, style.css, script.js first.

1. Add a native IntersectionObserver scroll-reveal system in script.js: watch any
   element with a [data-reveal] attribute, add class "is-visible" when it enters
   the viewport, then unobserve it (reveal once, never re-animate).
2. In style.css: [data-reveal] starts opacity:0 translateY(40px);
   [data-reveal].is-visible animates to opacity:1 translateY(0) over 0.6s with
   cubic-bezier(0.16, 1, 0.3, 1). Honor an optional [data-reveal-delay] as
   transition-delay for staggering siblings (~0.08s apart). Use rootMargin
   "0px 0px -100px 0px". Respect prefers-reduced-motion (show instantly).
3. Add data-reveal (with staggered delays) to the case study cards and the
   section heading. Keep the cards aligned exactly how they look now.

Don't touch the hero, CD player, or ring. Tell me which elements you tagged.
```

---

## Prompt 4 — Marketing & Brand as a bento board of widgets

```
Vanilla HTML/CSS/JS portfolio. Read index.html, style.css, and marketing.html
first. The Marketing & Brand content currently lives only in marketing.html as
"role cards". I want it surfaced on the homepage as a board of small widgets in
the Section 2 slot — not hidden behind its own page.

Build a responsive bento-style grid in the "Marketing & Brand" section of
index.html, pulling the real content from marketing.html. Make a widget for each:
  - Little Wins Bakehouse — brand identity + product photography (SF micro-bakery)
  - HALIENE — concert/festival content + custom merch
  - Nora AI — UX/UI & marketing intern (video, social, events)
  - Amazon storefront role — visual/marketing intern (storefront UI, Mailchimp, +20% engagement)
  - Graduation Photography — @visualsbyskn (150+ clients over 5 years)
  - APO — historian / new member educator (rush graphics, event photo/video)
Also add a small testimonials widget (use the photography quotes in marketing.html)
and one or two image widgets from the existing marketing assets.

Requirements:
- Vary widget sizes (some 1x1, some 2x1) for a real bento feel, but keep it tidy
  on a grid. Consistent corner radius, spacing, and one accent color.
- Reuse my existing styles/tokens where possible; match the site's look.
- Each widget can link to marketing.html (or an anchor within it) for the full
  detail, but the board itself should be readable and complete on its own.
- Add data-reveal with small staggers so widgets cascade in on scroll.
- Keep it responsive; on mobile it should stack cleanly.

Don't introduce libraries. List files changed and what to check.
```

---

## Prompt 5 — Other Projects as small chips

```
Vanilla HTML/CSS/JS portfolio. Read index.html and style.css first. In the
Section 3 "Other Projects" slot, replace the current .side-works-list with a row
of small, tidy "chips" — compact pills, each linking out in a new tab:
  - Zara Brothers Travel → https://www.zarabrotherstravel.com/
  - Sunright Tea Studio → (its existing Behance link in index.html)
  - moove → (its existing Figma deck link)
  - Past/Present/Future → (its existing Figma prototype link)

Each chip: project name + a tiny tag or ↗ arrow, subtle hover state, wraps nicely
on smaller screens. Keep it lightweight — this is a "more work" footer, visually
quieter than the case studies and marketing board above it. Add data-reveal so
the chips fade in on scroll. Match my existing styling. List files changed.
```

---

## Suggested order & why

1. **About/Resume pages** first — independent, low-risk, and gives the hero nav real targets.
2. **Scroll + hero** — the foundation everything else sits on.
3. **Case studies + reveals** — establishes the scroll-reveal system used by 4 and 5.
4. **Marketing bento board** — the biggest visual build.
5. **Other-project chips** — quick finishing touch.

Test and commit between each. If a prompt does too much in one pass, tell Claude
Code to do just step 1, then continue.
