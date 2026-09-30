# personal_website

Portfolio site for Rushabh Parikh, AI Product Manager. Live at https://rushabhparikh.in. It's plain HTML, CSS, and JS: no framework and no build step. GitHub Pages hosts it on a custom domain.

**Concept:** the portfolio is a product board, an infinite FigJam-style canvas you explore instead of scroll.

- **Receipts first:** four clickable proof stickies under the headline (28× faster onboarding, 2× enquiry→meeting conversion, 5× ARR, 670+ leads a week). Metrics lead with a cross-industry headline, with the real-estate detail in small print. They count up on arrival, then a "geeks out on AI agents" stamp slams onto the photo. Clicking a receipt flies the camera to the evidence while Dobby explains it.
- **Personalised arrivals:** tagged links change the sticker, Dobby's greeting and the page title, and tell you in analytics who opened the site. See [Tagged links](#tagged-links).
- **Board:** pan by dragging or scrolling, zoom with Ctrl/⌘ + scroll or pinch, fling with inertia. A minimap, a frames panel and keyboard shortcuts get you around.
- **Dobby, the host:** "Dobby is here on behalf of the headmaster!" His cursor joins the board, gives a guided tour that flies the camera between frames, and answers questions typed into the dock.
- **Illustrated agents:** SVG portraits for Tara, Ananya, Majnu Bhai, Dobby, Chanakya and Bablu (the `#av-*` symbols at the top of `index.html`).
- **Photo:** `assets/me.png` shows as a taped polaroid on the Hello frame. Without it, nothing shows.
- **Frames:**
  - Hello
  - On WhatsApp: Tara (sell side) and Ananya (buy side) phones play one story together, from a seller's hi to a SOLD stamp, plus a price-negotiation hand-off demo
  - The crew: flip cards with portraits for Majnu Bhai, Dobby, Chanakya and Bablu
  - Roadmap, with clickable bars
  - OLA crash-model scatter plot (hover the points)
  - Chakr lab notebook, with a live voltage slider: drag it and the H₂ bubbles (wasted aluminium) visibly thin out
  - Year-one dashboard: growth bars that fill from where each number started to where it got
  - Principles, four stickies
  - Contact, a sticky note you write and send as an email
- **Visitor stickies:** press S (or pick the sticky tool) and click anywhere to leave a note. Notes are saved in your browser and included in the email.
- **Read as a page:** a normal scrolling layout. It's the default on phones and what you get without JavaScript.

Shortcuts: `T` tour · `1`–`9` jump to the first nine frames · `0` fit the board · `V` / `H` / `S` tools · `/` ask Dobby · `Esc` close.

Fonts (three, on purpose): Gloock (display), IBM Plex Sans (everything else), Shantell Sans (handwriting). Colours: "Whiteboard" (grey board, bright stickies, orange accent, teal for Dobby).

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

## Tagged links

Add a tag to the end of `rushabhparikh.in` and the site greets that visitor, then logs their arrival in analytics.

| Who it's for | Link | Sticker | Dobby says | Analytics event |
|---|---|---|---|---|
| A company or recruiting team | `rushabhparikh.in/?for=Acme` | made for Acme | "Dobby welcomes the Acme team! The headmaster made this board for you." | `arrived/for/Acme` |
| One person you send it to | `rushabhparikh.in/?hi=Ansh+Bhatt` | hi, Ansh! | "Hi Ansh! The headmaster sent this to you himself. Dobby will show you around." | `arrived/hi/Ansh Bhatt` |
| A person at a company | `rushabhparikh.in/?hi=Ansh&for=Acme` | hi, Ansh! | "Hi Ansh! The headmaster sent this to you himself, for you and the Acme team…" | `arrived/hi/Ansh @ Acme` |
| Where the link was posted | `rushabhparikh.in/?utm_source=linkedin` | depends on source (below) | depends on source | `arrived/via/<sticker>` |

**Sources `?utm_source=` understands** (`?ref=` and `?source=` work the same way):

| Value | Also accepts | Sticker |
|---|---|---|
| `linkedin` | | hi, LinkedIn |
| `x` | `twitter`, `t.co` | hi, X |
| `github` | | hi, GitHub |
| `resume` | `cv` | the director's cut |
| `email` | `mail`, `newsletter` | you clicked. bold. |
| `hiring` | `wellfound`, `angellist`, `naukri`, `indeed`, `instahyre`, `yc`, `workatastartup`, `jobs`, `recruiter` | hiring? hi. |

Any other value shows no sticker, but GoatCounter still lists it under referrers.

**Links that lose their `?…` part.** Some apps strip query strings. Use a `#` tag instead; dashes become spaces:

- `rushabhparikh.in/#for-acme`
- `rushabhparikh.in/#hi-ansh-bhatt`
- `rushabhparikh.in/#via-linkedin`

**Rules**

- Spaces in a name: write `+` or `%20` (`?hi=Ansh+Bhatt`), or use the `#` form with dashes.
- Names are capitalised for you (`?for=razorpay` shows "Razorpay"), cut at 40 characters, and keep only letters, numbers, spaces and `& . ' -`.
- When tags are combined, `hi` wins over `for`, and both win over `utm_source`. GoatCounter still records every tag, so `?for=Razorpay&utm_source=email` greets Razorpay and shows the visit came from email.

**Ready to use**

| Where | Link |
|---|---|
| LinkedIn profile, Featured section | `rushabhparikh.in/?utm_source=linkedin` |
| Résumé PDF | `rushabhparikh.in/?utm_source=resume` |
| Job application (Wellfound, Naukri…) | `rushabhparikh.in/?utm_source=wellfound` |
| Cold email to a company's recruiter | `rushabhparikh.in/?for=Razorpay&utm_source=email` |
| DM to a specific person | `rushabhparikh.in/?hi=Ansh+Bhatt` |
| DM to a person at a company | `rushabhparikh.in/?hi=Ansh&for=Razorpay` |

## Analytics (GoatCounter)

Live at **rushabhparikh.goatcounter.com**, and switched on by `window.GOATCOUNTER_CODE = "rushabhparikh";` in `index.html`. Set it to `""` to turn analytics off. No cookies, so no cookie banner, and nothing a visitor types is ever sent.

**What you'll see**

- Page views, with referrer (and any `utm_source`/`ref`), country, browser, device and screen size.
- Events. Type a prefix like `arrived/` into the dashboard's filter box to see just those.

| Event | Means |
|---|---|
| `arrived/for/<Company>` | Someone opened a `?for=` link |
| `arrived/hi/<Name>` · `arrived/hi/<Name> @ <Company>` | That person opened their `?hi=` link |
| `arrived/via/<sticker>` | Someone arrived from a known source, e.g. `arrived/via/hi, LinkedIn` |
| `tour/start` · `tour/finish` | Started and finished Dobby's tour |
| `receipt/<topic>` | Tapped a receipt on the Hello card (`tara`, `ananya`, `metrics`, `dobby`) |
| `ask/<topic>` · `ask/no-match` | Asked Dobby a question; only the matched topic is logged, never the text |
| `demo/play-home-sale` · `demo/negotiate` | Played the WhatsApp demos |
| `out/whatsapp-tara` · `out/whatsapp-ananya` | Opened a chat with Tara or Ananya on WhatsApp |
| `out/linkedin` · `out/github` | Clicked through to your profiles |
| `contact/send-email` · `contact/copy-email` | Sent the contact note or copied your email |
| `mode/board` · `mode/page` | Switched between the board and the page view |

Topics for `ask/` are the sections Dobby answered with: `hello`, `whatsapp`, `crew`, `metrics`, `ola`, `chakr`, `roadmap`, `principles`, `contact`.

**Don't count your own visits**

- Open **`rushabhparikh.in/#notrack`** once on every browser and device you use: phone, laptop, and each browser on them. A note confirms "Analytics off for this browser". It uses GoatCounter's own `skipgc` flag, so it keeps working when your IP changes.
- `rushabhparikh.in/#track` turns counting back on.
- Private or incognito windows forget the setting when closed, so visits from them are counted.
- Alternative: GoatCounter → Settings → *Ignore IPs* → "add your current IP". That only lasts until your IP changes (mobile data, office Wi-Fi…).

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
