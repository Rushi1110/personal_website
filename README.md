# personal_website

Portfolio site for Rushabh Parikh, AI Product Manager. It's plain HTML, CSS, and JS: no framework and no build step. GitHub Pages hosts it on a custom domain.

**Concept:** the portfolio is a product board, an infinite FigJam-style canvas you explore instead of scroll.

- **Receipts first:** four clickable proof stickies under the headline (3 hrs to go live, 2× lead→visit, 5× ARR, 672 leads/week) count up on arrival, then a SOLD stamp lands. Clicking a receipt flies the camera to the evidence while Ananya explains it.
- **Personalised arrivals:** `?utm_source=linkedin|x|github|resume|email` or job boards change the sticker and Ananya's greeting. `?for=Acme` makes a board "made for Acme", with a custom greeting, page title and contact note. For previews where query strings are stripped, use `#via-linkedin` or `#for-acme`.
- **Board:** pan by dragging or scrolling, zoom with Ctrl/⌘ + scroll or pinch, fling with inertia. A minimap, a frames panel and keyboard shortcuts get you around.
- **Ananya, the AI guide:** her cursor joins the board, gives a guided tour that flies the camera between frames, and answers questions typed into the dock ("what did he ship?", "battery work?", "how do I reach him?").
- **Frames:**
  - Hello
  - Tara system map: a little house travels through every agent a home passes on its way to SOLD (tap any node)
  - The crew: flip cards for Majnu Bhai, Dobby, Chanakya and Bablu
  - Roadmap, with clickable bars
  - OLA crash-model scatter plot (hover the points)
  - Chakr lab notebook, with a live voltage slider and a bubble simulation
  - Ananya PRD (what was leaking, scope, evals), with a playable phone: an honest answer plus a booking, relevance matching, and a hand-off to a human
  - Year-one dashboard, with a before/after toggle
  - Draggable principle stickies
  - IIT Guwahati
  - Contact, a sticky note you write and send as an email
- **Visitor stickies:** press S (or pick the sticky tool) and click anywhere to leave a note. Notes are saved in your browser and included in the email.
- **Read as a page:** a normal scrolling layout. It's the default on phones and what you get without JavaScript.

Shortcuts: `T` tour · `1`–`9` jump to the first nine frames · `0` fit the board · `V` / `H` / `S` tools · `/` ask Ananya · `Esc` close.

Fonts: Bricolage Grotesque (display), Geist (UI), Geist Mono (data), Shantell Sans (handwriting).

## Structure

```
index.html     page content (edit this to fill in your details)
styles.css     styles, including light/dark theme tokens at the top
script.js      canvas camera, gestures, tour, Ask Ananya, agent phone, charts, stickies
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

All copy lives in `index.html`. Each frame's position on the board is set by its `data-x`, `data-y` and `data-w` attributes. The tour script, Ask Ananya's answers and the phone scenarios are the `TOUR`, `INTENTS` and `SCN` objects in `script.js`. Colours are tokens at the top of `styles.css`.

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
