# Viet Kitchen — menu site

Static menu site for Viet Kitchen (Barcelona). A 3D flip-book of the designed menu:
each page is an image (`assets/images/pages/p-NN.jpg`), shown as a two-page spread on
desktop and one page per screen with a real page-curl flip on phone/tablet. Plain HTML,
CSS and JavaScript, no framework, no build step.

## Run it locally

Easiest: double-click `index.html` (it opens straight in the browser, no server needed).

Recommended (avoids any browser file:// quirks), serve the folder:

```bash
cd "Menu book"
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Structure

```text
index.html              markup (cover, book shell, reservation modal)
css/style.css            all styling + responsive rules
js/main.js               page list, flip-book + interactions
js/lib/                  StPageFlip (vendored, MIT) — real page-curl on phone
assets/images/pages/     the menu, one optimized JPEG per page (p-01 ... p-32)
assets/images/           cover + logo images
_original/               original .dc.html export and source files (kept for reference)
```

## Editing the menu

The menu pages are images. To regenerate them from the source PDF:

```bash
pdftoppm -jpeg -jpegopt quality=82 -scale-to-x 1240 -scale-to-y -1 \
  menu-source.pdf assets/images/pages/p
```

The page order, nav-jump anchors and footer labels are defined in `PAGE_DEFS` inside
`buildPages()` in `js/main.js`. To change a page, replace its `assets/images/pages/p-NN.jpg`.

Note: because the pages are baked images, the trilingual switcher is hidden (the
data-driven, translatable version still lives in git history before this change).
