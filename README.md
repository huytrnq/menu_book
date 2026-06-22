# Viet Kitchen — menu site

Static menu site for Viet Kitchen (Barcelona). A flip-book menu on desktop, a single
column scroll on tablet/mobile, plus a reservation form. Plain HTML, CSS and JavaScript,
no framework, no build step.

## Run it locally

Easiest: double-click `index.html` (it opens straight in the browser, no server needed).

Recommended (avoids any browser file:// quirks), serve the folder:

```bash
cd "Menu book"
python3 -m http.server 8000
```

Then open http://localhost:8000 .

## Structure

```
index.html          markup (cover, book shell, reservation modal)
css/style.css        all styling + responsive rules
js/main.js           menu data, page builder, flip-book + interactions
assets/images/       photos, logo, thumbnails
_original/           the original .dc.html export and source files (kept for reference)
```

## Editing the menu

All menu content lives in `buildPages()` near the top of `js/main.js`. Each section is a
`list({...})`, `story({...})` or `hours({...})` call. Sections with more than 4 items spill
onto extra pages automatically.
