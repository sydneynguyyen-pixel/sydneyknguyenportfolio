# Deploy & hosting

This site is a **static** HTML/CSS/JS site (no framework, no build step). It is
served by **GitHub Pages** at the root of the custom domain **sydneyknguyen.com**,
with **Cloudflare** proxying in front for HTTPS and edge caching.

```
visitor → Cloudflare (TLS + cache) → GitHub Pages (origin) → repo `main` branch
```

---

## Deploying a change

There is no build. Deploying = pushing to `main`.

```bash
# edit files, then:
git add -A
git commit -m "Describe your change"
git push origin main
```

- Pushing to `main` triggers the **"pages build and deployment"** GitHub Action
  automatically. Live on GitHub's origin in ~1–2 min.
- Only `main` deploys. Work on `main`, or merge feature branches into `main`.
- Watch progress under the repo's **Actions** tab if you want confirmation.

### ⚠️ Cloudflare cache — the one gotcha
Cloudflare edge-caches static assets (images, CSS, JS) with `max-age=14400`
(~4 hours). So a pushed change to those files **won't appear immediately** —
Cloudflare keeps serving the old copy until the TTL expires.

- **Wait** ~4h for it to refresh on its own, **or**
- **Purge now:** Cloudflare dashboard → **Caching → Configuration → Purge
  Everything** (or Custom Purge for specific URLs). Live within seconds.

HTML pages currently bypass the cache (`cf-cache-status: DYNAMIC`), so text/layout
edits in `.html` files appear as soon as GitHub finishes deploying — no purge
needed. (This changes only if an HTML cache rule is added later.)

### Don'ts
- Do **not** delete `CNAME` or `.nojekyll` — they make the custom domain and
  correct file serving work. They stay committed permanently.
- Do **not** touch the DNS / Cloudflare settings below for normal deploys — that
  was one-time setup.

---

## One-time setup (already done — reference only)

### Repo files
- `CNAME` — contains `sydneyknguyen.com` (apex, one line). Tells GitHub Pages
  which host to serve.
- `.nojekyll` — empty file; disables Jekyll so files/folders with underscores
  and special names (e.g. `_pre-sync-backup`) are served as-is.

### GitHub Pages settings
- Source: `main` branch, `/ (root)`.
- Custom domain: `sydneyknguyen.com` (leave populated).
- **"DNS check unsuccessful" is EXPECTED and fine** — GitHub sees Cloudflare's
  IPs, not its own, because we proxy through Cloudflare. Ignore the red banner.
  Do not click "Remove."
- **Enforce HTTPS** stays unavailable/off — Cloudflare handles HTTPS instead.

### Cloudflare DNS records (all **Proxied / orange**)
| Type  | Name | Value                     |
|-------|------|---------------------------|
| A     | `@`  | `185.199.108.153`         |
| A     | `@`  | `185.199.109.153`         |
| A     | `@`  | `185.199.110.153`         |
| A     | `@`  | `185.199.111.153`         |
| CNAME | `www`| `sydneyknguyen.com`       |

### Cloudflare settings
- **SSL/TLS mode:** Full
- **Edge Certificates → Always Use HTTPS:** On
- **Universal SSL:** Active (cert covers apex + www)

### Registrar (Porkbun)
- Nameservers point to Cloudflare (`*.ns.cloudflare.com`), not Netlify
  (`*.nsone.net`).

---

## Migration notes / gotchas hit

- **Cert gap + HSTS:** Right after DNS moved to GitHub Pages, GitHub hadn't issued
  its cert yet, so it served a `*.github.io` cert → name mismatch. The old Netlify
  site had sent `Strict-Transport-Security: max-age=31536000`, so returning
  visitors' browsers hard-blocked (no click-through). **Fix:** flip Cloudflare
  records to orange (proxied) + SSL/TLS Full — Cloudflare's own valid cert
  terminates TLS and satisfies HSTS. GitHub's own cert is not needed in this
  proxied setup.
- **Setup ordering:** kept records grey (DNS-only) during initial cutover, then
  flipped to orange once serving was confirmed.

## Netlify teardown (do LAST)
Only after every public resolver (incl. Google `8.8.8.8`) resolves
`sydneyknguyen.com` to the Cloudflare IPs (`104.x` / `172.x`) — until then,
Google-DNS users may still land on the old Netlify site, so keep it as a fallback.
Verify with `dig +short A sydneyknguyen.com @8.8.8.8`, then remove the site/domain
from Netlify.

## Usage limits
- GitHub Pages soft bandwidth limit: **100 GB/month**. Cloudflare edge-caches
  images/CSS/JS (`cf-cache-status: HIT`), so GitHub only serves occasional
  cache-miss refills — the limit is effectively buffered.
- Cloudflare free plan: no bandwidth cap for normal site serving; absorbs traffic
  spikes and provides DDoS protection.
