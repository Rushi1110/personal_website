# personal_website

Portfolio site for Rushabh Parikh, AI Product Manager. Live at https://rushabhparikh.in. It's plain HTML, CSS, and JS: no framework and no build step. GitHub Pages hosts it on a custom domain.

**Concept:** the portfolio is a product board, an infinite FigJam-style canvas you explore instead of scroll.

- **Receipts first:** four clickable proof stickies under the headline (28× faster onboarding, 2× enquiry→meeting conversion, 5× ARR, 670+ leads a week). Metrics lead with a cross-industry headline, with the real-estate detail in small print count up on arrival, then a SOLD stamp lands. Clicking a receipt flies the camera to the evidence while Dobby explains it.
- **Personalised arrivals:** `?utm_source=linkedin|x|github|resume|email` or job boards change the sticker and Dobby's greeting. `?for=Acme` makes a board "made for Acme", with a custom greeting, page title and contact note. For previews where query strings are stripped, use `#via-linkedin` or `#for-acme`.
- **Board:** pan by dragging or scrolling, zoom with Ctrl/⌘ + scroll or pinch, fling with inertia. A minimap, a frames panel and keyboard shortcuts get you around.
- **Dobby, the host:** "Dobby is here on behalf of the headmaster!" His cursor joins the board, gives a guided tour that flies the camera between frames, and answers questions typed into the dock.
- **Illustrated agents:** SVG portraits for Tara, Ananya, Majnu Bhai, Dobby, Chanakya and Bablu (the `#av-*` symbols at the top of `index.html`).
- **Photo:** drop `assets/me.jpg` in and a taped polaroid appears on the Hello frame. Without it, nothing shows.
- **Frames:**
  - Hello
  - On WhatsApp: Tara (sell side) and Ananya (buy side) phones play one story together, from a seller's hi to a SOLD stamp, plus a price-negotiation hand-off demo
  - Under the hood: a little house travels through every agent a home meets (tap any node)
  - The crew: flip cards with portraits for Majnu Bhai, Dobby, Chanakya and Bablu
  - Roadmap, with clickable bars
  - OLA crash-model scatter plot (hover the points)
  - Chakr lab notebook, with a live voltage slider and a bubble simulation
  - Year-one dashboard, with a before/after toggle
  - Draggable principle stickies
  - Contact, a sticky note you write and send as an email
- **Visitor stickies:** press S (or pick the sticky tool) and click anywhere to leave a note. Notes are saved in your browser and included in the email.
- **Read as a page:** a normal scrolling layout. It's the default on phones and what you get without JavaScript.

Shortcuts: `T` tour · `1`–`9` jump to the first nine frames · `0` fit the board · `V` / `H` / `S` tools · `/` ask Dobby · `Esc` close.

Fonts: Gloock (display), IBM Plex Sans (UI), IBM Plex Mono (data), Shantell Sans (handwriting). Colours: "Whiteboard" (grey board, bright stickies, orange accent, teal for Dobby).

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

All copy lives in `index.html`. Each frame's position on the board is set by its `data-x`, `data-y` and `data-w` attributes. The tour script, Dobby's answers and the WhatsApp story are `TOUR`, `INTENTS` and `story` in `script.js`. Colours are tokens at the top of `styles.css`.

## Analytics (GoatCounter)

1. Sign up free at goatcounter.com and pick a code, e.g. `rushabh` (your dashboard becomes rushabh.goatcounter.com).
2. In `index.html`, set `window.GOATCOUNTER_CODE = "rushabh";` and push.

Page views arrive with their `utm_source`. The site also logs events: `tour/start`, `tour/finish`, `receipt/<topic>`, `ask/<topic>` (matched topic only, never the typed text), `demo/play-home-sale`, `demo/negotiate`, `out/whatsapp-tara`, `out/whatsapp-ananya`, `out/linkedin`, `out/github`, `contact/send-email`, `contact/copy-email`, `mode/board|page`, and `arrived/for/<Company>` or `arrived/via/<source>` for personalised links. No cookies.

## Images

- **Your photo:** `assets/me.png` (a cut-out portrait) shows as the taped polaroid on the Hello card. Replace the file to change it.
- **Link preview:** `assets/og.png` (1200×630) is the card LinkedIn, WhatsApp and X show when the link is shared.
- **Anything else:** put files in `assets/` and reference them as `assets/name.jpg`.
- Upload on GitHub via the repo page → Add file → Upload files, into the `assets` folder.

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
