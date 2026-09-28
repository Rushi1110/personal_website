# personal_website

My personal portfolio site. It's plain HTML, CSS, and JS: no framework and no build step. GitHub Pages hosts it on a custom domain.

## Structure

```
index.html     page content (edit this to fill in your details)
styles.css     styles, including light/dark theme tokens at the top
script.js      theme toggle, mobile menu, scroll effects
404.html       "page not found" page
assets/        favicon, photo, résumé PDF, images
.nojekyll      tells GitHub Pages to serve files as-is
```

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Filling it in

Search `index.html` for the placeholder text and replace it:

- Hero: tagline, intro, and social links (LinkedIn, email)
- About: bio, plus a photo saved as `assets/me.jpg` (swap in the `<img>` tag that's commented out)
- Experience, Projects, Skills: your real entries
- Résumé: add `assets/resume.pdf`
- Accent color: change `--accent` in `styles.css`

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
