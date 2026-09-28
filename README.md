# personal_website

Portfolio site for Rushabh Parikh, AI Product Manager. It's plain HTML, CSS, and JS: no framework and no build step. GitHub Pages hosts it on a custom domain.

**Concept:** "From electrons to agents", a path from EV crash models to aluminium-air batteries to agentic AI.

**Motion, kept deliberate:**
- The headline letters stretch into place on load and widen as the cursor passes (variable font `wdth` / `wght` axes).
- The intro streams in word by word, like an LLM response.
- The Ananya agent trace replays its tool calls and books a site visit when scrolled into view.
- Each career chapter has an animated chart: a crash-model scatter plot (R² 0.83), an anode voltage gauge, and before/after bars.
- Everything is visible at rest. Elements only hide just before they scroll into view, and `prefers-reduced-motion` turns animation off.

Fonts: Archivo (display), Hanken Grotesk (body), Martian Mono (data).

## Structure

```
index.html     page content (edit this to fill in your details)
styles.css     styles, including light/dark theme tokens at the top
script.js      proximity type, streaming text, agent trace, charts, scroll choreography
404.html       "page not found" page
assets/        favicon, photo, résumé PDF, images
.nojekyll      tells GitHub Pages to serve files as-is
```

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing

All copy lives in `index.html`. Colours are tokens at the top of `styles.css`: change `--accent` in all three theme blocks to re-brand.

## Deploying on a custom domain

### 1. Buy a domain
Any registrar works: Cloudflare Registrar, Porkbun, Namecheap, or Google/Squarespace Domains. Cloudflare and Porkbun sell domains at cost.

### 2. Turn on GitHub Pages
Repo → **Settings → Pages** → *Build and deployment* → Source: **Deploy from a branch** → pick `main` and `/ (root)` → Save.
The site will go live at `https://rushi1110.github.io/personal_website/`.

### 3. Point the domain at GitHub
Add these DNS records at your registrar:

| Type  | Name  | Value                  |
|-------|-------|------------------------|
| A     | @     | 185.199.108.153        |
| A     | @     | 185.199.109.153        |
| A     | @     | 185.199.110.153        |
| A     | @     | 185.199.111.153        |
| AAAA  | @     | 2606:50c0:8000::153    |
| AAAA  | @     | 2606:50c0:8001::153    |
| AAAA  | @     | 2606:50c0:8002::153    |
| AAAA  | @     | 2606:50c0:8003::153    |
| CNAME | www   | rushi1110.github.io    |

If you use Cloudflare DNS, set these records to **DNS only** (grey cloud) until GitHub has issued the HTTPS certificate.

### 4. Connect the domain in GitHub
Settings → Pages → **Custom domain** → enter `yourdomain.com` → Save. This commits a `CNAME` file to the repo.
When the DNS check passes, tick **Enforce HTTPS**. The certificate can take from a few minutes up to about an hour.

Optional but recommended: verify the domain under your GitHub account's **Settings → Pages → Verified domains**, so nobody else can take it over.
