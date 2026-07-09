# Sangam Skin — website

A full in-browser experience for Sangam Skin: a live product quiz + routine
builder, the 118-product catalogue, a 50-ingredient glossary, and a Skin
Lens feature page — in English and Russian. Static site, vanilla HTML/CSS/JS,
no build step, no framework, no backend.

## Structure

```
index.html          Homepage
quiz.html            9-question interactive quiz
result.html          Generated AM/PM routine (reads sessionStorage from quiz.js)
catalog.html          All 118 products — search + category/concern filters
product.html          Product detail (?id via URL hash, e.g. product.html#retinol-...)
ingredients.html      50-ingredient glossary — search + family filters
about.html            Brand story + cosmetic disclaimer
lens.html             Skin Lens feature explainer

assets/
  css/                 tokens.css (design system) + one stylesheet per page
  js/
    i18n.js             tiny i18n engine (assets/i18n/en.json, ru.json)
    chrome.js            shared header/footer, injected into #site-header / #site-footer
    engine.js             routine recommendation engine — ported 1:1 from
                           the Sangam Skin app's src/engine/recommend.ts
    reveal.js              scroll-reveal utility
    product-card.js        shared product-card renderer
    quiz.js / result.js / catalog.js / product.js / ingredients.js / home.js
  i18n/en.json, ru.json   all UI copy (166 keys each, kept in lockstep)
  images/                 logo + favicon, copied from the app's assets/

data/
  products.js, ingredients.js, conflicts.js, quiz.js   generated data (window globals)
  _build/                regeneration pipeline (see below) — NOT deployed
```

## Data pipeline — regenerate after the app's catalog changes

`data/*.js` are exported from the Sangam Skin app's own TypeScript source
(`../sangam-skin/src/data/*`, `src/i18n/content/ru.ts`, `src/i18n/locales/ru.ts`),
so the website never drifts from the real 118-product catalogue.

```bash
cd /path/to/sangam-skin-web/data/_build
../../../sangam-skin/node_modules/.bin/tsc -p export.tsconfig.json   # -> dist/
node export.js                                                       # -> ../products.js etc.
```

## Local preview

Any static file server works — e.g. `npx serve .` or Python's `http.server`
module directly (not via `-m http.server`, which calls `os.getcwd()` even
when `--directory` is passed; use a directory-bound `HTTPServer` instead if
that's a problem in your environment).

**Product links use a `#hash`, not `?id=`.** Some static-file servers (this
project hit it with `serve`'s clean-URL redirect) rewrite or drop query
strings on `.html` requests. A hash fragment never touches the server, so
it's immune to that class of bug on any static host.

## Deploying to skin.sangamherbals.com

This repo is set up for GitHub Pages (matches the pattern used by
sangamherbals.com and bombaystandard.com — same GitHub account):

1. Push this repo to GitHub (e.g. `imhappyyo/sangam-skin-web`).
2. Repo Settings → Pages → Source: deploy from the `main` branch, root.
3. The committed `CNAME` file already points Pages at `skin.sangamherbals.com`.
4. At your DNS provider (GoDaddy), add a **CNAME record**:
   - Host: `skin`
   - Value: `imhappyyo.github.io`
   - TTL: default
5. GitHub Pages issues an HTTPS cert automatically once DNS resolves
   (can take up to ~24h, usually much faster).

No server, no environment variables, no secrets — it's a static site.

## Scope note: Skin Lens

The AI photo analysis (Gemini) that powers Skin Lens in the mobile app is
**not wired up live on this website** — doing so would require exposing the
Gemini API key in client-side JS, which is a real security risk for a public
site (anyone can read it from the network tab and use your quota). `lens.html`
is a full feature explainer with a static example instead. Wiring a live
version would need a small server-side proxy (a Cloudflare Worker, same
pattern as the Revert app's `api.gorevert.com`) — worth doing as a fast
follow, not a blocker for launch.
