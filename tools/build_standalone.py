"""Stamp cache-busting versions into index.html, then bundle the site into
one self-contained HTML file: dist/index.html.

index.html links styles.css and script.js with ?v=<content hash>, so
browsers fetch fresh files after every change instead of a cached copy.
The bundle inlines styles.css, script.js and the favicon so the page works
when opened straight from disk or uploaded anywhere. Run from the repo root
before committing:

    python3 tools/build_standalone.py
"""
import base64
import hashlib
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
css = (root / "styles.css").read_text()
js = (root / "script.js").read_text()

# Version the asset links in index.html by content hash.
page = root / "index.html"
html = page.read_text()
for name, body in (("styles.css", css), ("script.js", js)):
    v = hashlib.sha1(body.encode()).hexdigest()[:8]
    html = re.sub(rf'"{re.escape(name)}(\?v=[0-9a-f]+)?"', f'"{name}?v={v}"', html)
page.write_text(html)
icon = base64.b64encode((root / "assets" / "favicon.svg").read_bytes()).decode()

html = re.sub(r'<link rel="stylesheet" href="styles\.css[^"]*">', lambda m: f"<style>\n{css}\n</style>", html)
html = re.sub(r'<script src="script\.js[^"]*" defer></script>', lambda m: f"<script>\n{js}\n</script>", html)
html = html.replace('href="assets/favicon.svg"', f'href="data:image/svg+xml;base64,{icon}"')
# Inline the photo if present; otherwise drop the polaroid.
photo = root / "assets" / "me.png"
if photo.exists():
    data = base64.b64encode(photo.read_bytes()).decode()
    html = html.replace('src="assets/me.png"', f'src="data:image/png;base64,{data}"')
else:
    html = re.sub(r'\s*<figure class="polaroid".*?</figure>', "", html, flags=re.S)

out = root / "dist" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html)
print(f"wrote {out.relative_to(root)} ({len(html) // 1024} KB)")
