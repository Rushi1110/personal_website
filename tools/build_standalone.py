"""Bundle the site into one self-contained HTML file: dist/index.html.

Inlines styles.css, script.js and the favicon so the page works when
opened straight from disk or uploaded anywhere. Run from the repo root:

    python3 tools/build_standalone.py
"""
import base64
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text()
css = (root / "styles.css").read_text()
js = (root / "script.js").read_text()
icon = base64.b64encode((root / "assets" / "favicon.svg").read_bytes()).decode()

html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
html = html.replace('<script src="script.js" defer></script>', f"<script>\n{js}\n</script>")
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
