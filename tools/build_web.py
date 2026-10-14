#!/usr/bin/env python3
"""Build the app's game page from its two sources.

  web/game.html       the page (layout, styles, game logic) with a /*GEN*/ marker
  generator/gen.js    the puzzle generator and solver

Writes app/src/main/assets/index.html. Run it after editing either source.
`--check` only verifies the built page is current (used by the GitHub build).
"""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
page = (root / "web/game.html").read_text(encoding="utf-8")
gen = (root / "generator/gen.js").read_text(encoding="utf-8")
m = re.search(r"// GEN START.*?// GEN END\n", gen, re.S)
if not m or "/*GEN*/" not in page:
    sys.exit("build_web: missing GEN START/END block or /*GEN*/ marker")
# The Claude artifact host wraps pages in this skeleton automatically; the Android
# WebView does not, so the app's copy gets it here (doctype, viewport, small reset).
HEAD = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>*,*::before,*::after{box-sizing:border-box}body{margin:0}'
        'img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n')
out = HEAD + page.replace("/*GEN*/", m.group(0)) + "\n</body></html>\n"
target = root / "app/src/main/assets/index.html"

if "--check" in sys.argv:
    if not target.exists() or target.read_text(encoding="utf-8") != out:
        sys.exit("build_web: app/src/main/assets/index.html is out of date - run python3 tools/build_web.py")
    print("build_web: index.html is up to date")
else:
    target.write_text(out, encoding="utf-8")
    print(f"build_web: wrote {target.relative_to(root)} ({len(out):,} bytes)")
