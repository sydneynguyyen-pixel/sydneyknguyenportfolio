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

## Prompt 6 — Archive section: white canvas + folder-row with an inline gallery reveal

```
Vanilla HTML/CSS/JS portfolio. Read index.html (#archive section, ~line
219–353, plus the #arch-rough filter def around line 470) and style.css
(.arch-* rules, ~line 4871–5088) first. I prototyped the target look/motion as
a static HTML mock (attached as archive-full-mock.html) — match it as closely
as you can, adapting to my real markup, data source, and existing shadowbox.

Right now #archive ("more things I've made") is a warm-paper scrapbook zone:
--arch-paper #f1ece1 background, a paper-grain SVG texture on .arch::before.
It holds 6 project tiles (.arch-grid > .arch-cell > .arch-tile, unchanged by
this prompt) and 3 full-width "paper drawer" bars (.arch-drawers > .arch-chip
> .arch-card for Graphic Design / Photography / Branding & Marketing) that
each open the scrapbook modal (#arch-shadowbox), populated by initArchive()
in script.js from CREATIVE_ASSETS (graphic/photo) and the #mkw-panels data
(branding).

Changes:

1. Background: change .arch's background from --arch-paper to plain white
   (#fff or #fbfbfa) and remove the .arch::before paper-grain texture
   entirely. No dot grid, no texture — flat white.

2. Ink borders: reuse the EXISTING #arch-rough filter (already defined in
   index.html, baseFrequency 0.012 / numOctaves 2 / seed 4 / scale 2.4) —
   don't create a new filter or change its values, it's already tuned right.
   Keep it applied to .arch-tile via .arch-frame as today. Add the same
   treatment (thin 1.5px black ink border, ~2–3px inset, filter:url(#arch-rough),
   opacity ~.5) to the new folder icons and gallery thumbnails below.

3. Replace the 3 full-width .arch-chip/.arch-card drawer bars with a single
   straight horizontal row (.folder-row, flex, centered, ~60–70px gap) of 3
   folder icons — simple two-tone folder shape (back + tab + lid), one accent
   color per category (reuse each category's existing accent if there is one,
   otherwise pick 3 tasteful tones). Label + item count sit centered below
   each folder (keep reusing the data-count wiring initArchive() already
   populates).

4. Accordion behavior — only one folder open at a time:
   - Click a closed folder: its lid does a quick 3D flip open (bottom-anchored
     rotateX, ~-125deg, .4–.5s, bouncy/overshoot easing); any other open
     folder closes first.
   - Click the open folder again, or click outside the folder row/gallery:
     closes it (lid flips shut).
   - Click a different folder while one is open: swap directly to the new
     category, no need to fully close first.

5. Inline gallery reveal: below the folder row, reveal a single horizontal
   row of 6 thumbnails for the open category (wrap on narrow viewports),
   pulled from the same CREATIVE_ASSETS / mkw data initArchive() already
   reads — first 6 items. Each thumbnail only shows its item name on
   :hover, as a small dark pill that fades in below/over the card (hidden at
   rest, so the row stays clean). Stagger each thumbnail's fade+slight
   slide-up-in by ~40ms.

6. End the gallery row with a small "view full set ↗" control that opens the
   EXISTING #arch-shadowbox for that category — don't rebuild the shadowbox,
   just call whatever function the old .arch-card buttons called
   (grep `data-drawer`) so all the current scrapbook-browsing behavior keeps
   working unchanged.

7. Animate the reveal itself with the CSS `grid-template-rows: 0fr → 1fr`
   trick (wrap the gallery in a grid container that transitions
   grid-template-rows, with an inner `overflow:hidden` child) so the whole
   white .arch card visibly grows taller as the gallery opens and shrinks
   back on close — no JS height measuring, no layout jump.

8. Respect prefers-reduced-motion: skip the lid flip and the stagger, just
   crossfade the gallery content in/out.

Keep the 6 project tiles above completely untouched in content and behavior —
only the background context changes (paper → white). Don't touch the Case
Studies section above it. List every file you changed and tell me exactly
what to click to test.
```

---

## Prompt 7 — Hero cursor: photo trail instead of the dot/ring

```
Vanilla HTML/CSS/JS portfolio. Read index.html (the hero, .hero-section#home,
~line 150–196) and script.js first — specifically the "Custom Cursor" IIFE
(~line 1451–1481, drives #cursor-dot/#cursor-ring off a document-wide
mousemove) and the "Cursor Sparkle" IIFE right after it (~line 1484 on,
spawns colored star/shape glyphs on a document-wide mousemove too). I
prototyped the target behavior as a static mock (attached,
hero-cursor-trail-mock.html) — match its timing/sizing, adapted to my real
markup and cursor code.

I want a different cursor ONLY inside the hero (#home): instead of the
dot/ring (and instead of the star sparkles), moving the mouse there leaves a
trail of small photos behind it, pulled from assets/Cursor Icons/. Outside
the hero, the existing dot/ring + sparkle cursor should behave exactly as it
does today — don't touch that code's logic, just scope it.

1. Asset prep: assets/Cursor Icons/ has messy hashed filenames (and one huge
   reference screenshot that should NOT be in the pool). Copy the 24 photo
   files into a new assets/cursor-trail/ folder with clean lowercase-hyphen
   names, EXCLUDING "Screenshot 2026-08-05 at 12.57.49 PM.png". Use this
   mapping (source hash → new name):
     0cfad3657af53e901fa87c80ab4abca4.jpg  → apple-stars.jpg
     5d658129db61ccb38368c2c85211d410.jpg  → flower-stars.jpg
     7c343ad9a80f9964224ac6977da1a5a1.jpg  → clover.jpg
     7c775f1fb64c2b7bd55f447b139f7145.jpg  → swirl-pastel.jpg
     8c926428b9e64e56fd91415b5dcc20a2.jpg  → rain-dots-blue.jpg
     9bfec0a177c6c804538701eb7ccc75e3.jpg  → confetti-street.jpg
     a8571e2fc5c8c0a3e49214b0063c101b.jpg  → kiwi-stars.jpg
     c9babd0f37e3c681a2ed811bfc61b994.jpg  → pixel-ghost.jpg
     cec3f70e43a97c9ca32dace8548c83c5.jpg  → red-dots.jpg
     d0b1b9a12e93e9500d7efce07a8c3c2c.jpg  → diagonal-landscape.jpg
     f193a9a231adb26e6d50abea3ac25be4.jpg  → water-beads.jpg
     190b08570ea1bacdcdfe7483413c9ea8.jpg  → star-spiral.jpg
     1ee53d13cd5eb629f97babd10d7a2591.jpg  → meadow-bokeh.jpg
     239c4ff41082912ced564a443dd5f006.jpg  → dot-collage.jpg
     32a71df10a9ca3a39d09e418fe304049.jpg  → garden-cutout.jpg
     4b581ec31fc991a1b43608c0fba95073.jpg  → gummy-bears.jpg
     5c4473507c8e73e6fbb58c0a642189b2.jpg  → sparkle-grass.jpg
     8b192e1e837c4983fae0258f140d10f8.jpg  → dance-figures.jpg
     8eb9b2cbfc55c00b2f4658a13638e1e5.jpg  → sheet-music-bokeh.jpg
     b0a6b0eeade838edb582b3b30c98b8d9.jpg  → ocean-sparkle.jpg
     ba18db7082c83d59cfb5d47ac8cbcd96.jpg  → soda-bottles.jpg
     cc78deaa146cca6e3aab3761d0adc828.jpg  → file-icons-sky.jpg
     d4f056517ae3bd57421481c3252990e2.jpg  → moss-pixel.jpg
     f544d281209e44a9d8f6522dc1e94b14.jpg  → orchid-pastel.jpg
   (Note: clover-spiral / 9302e8b78051429bae50c90ed2ce9858.jpg is deliberately
   EXCLUDED — not part of the pool.) Git is case-sensitive on GitHub Pages
   even though macOS isn't — double check the copied filenames exactly match
   what you reference in JS.

2. New JS module in script.js, e.g. "Hero Cursor Trail": on mousemove
   *inside #home only*, spawn a trail image at the cursor position, but only
   when the pointer has moved at least 42px since the last spawn (not every
   pixel). Pick a random photo from the pool, never repeating the immediately
   previous pick. Cap at 22 concurrent trail elements (skip spawning past the
   cap rather than queueing).

   Each trail element: a plain <img>, no border-radius, no border, no padding
   or background frame — just the raw photo. Randomize its size between 30–46px
   per spawn (not fixed). Randomize rotation ±12deg and a small ±5px position
   jitter. Animate in with a quick scale(.4→1)/opacity(0→1) pop
   (~150–180ms, cubic-bezier(.34,1.56,.64,1)), hold briefly, then over ~700ms
   fade out while shrinking slightly and drifting up ~14px, then remove the
   element from the DOM (~1s total lifecycle).

3. Scoping: while the pointer is over #home, hide the native cursor
   (cursor:none) and suppress the existing dot/ring + sparkle spawning — the
   cleanest way is to check `e.target.closest('#home')` at the top of both
   existing mousemove listeners and early-return when true (don't move
   dot/ring, don't roll the sparkle spawn chance), rather than duplicating or
   rewriting that logic. When the pointer leaves #home, dot/ring and sparkles
   resume normally immediately.

4. prefers-reduced-motion: disable the photo trail entirely and just leave
   the normal dot/ring cursor active in the hero too.

5. Touch/mobile: this is mousemove-only, so it should naturally no-op on
   touch — just confirm you're not accidentally hiding the cursor or breaking
   tap targets in #home on touch devices.

Don't change anything about the dot/ring/sparkle behavior outside #home.
List every file you changed (including the new assets/cursor-trail/ files)
and tell me exactly where to move my mouse to test.
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
