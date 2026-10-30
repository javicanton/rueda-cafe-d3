# AGENTS.md

## Cursor Cloud specific instructions

This is a static HTML/CSS/JS project (Coffee Flavor Wheel / Rueda de Sabor del Café) with **no build system, no package manager, and no dependencies to install locally**. D3.js v7 is loaded via CDN.

### Running the app

Serve the project root with any static HTTP server. The app uses `fetch` / `d3.json()` so it **will not work** via `file://` — an HTTP server is required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser.

### Lint / Test / Build

- **No linter, test suite, or build step** exists in this project.
- There is no `package.json`, no CI configuration, and no automated tests.
- Validation is done by visually inspecting the sunburst chart in a browser and confirming interactivity (tooltips on click/hover).

### Key files

| File | Purpose |
|---|---|
| `index.html` | Entry point — loads D3 via CDN and `script.js` |
| `script.js` | D3.js sunburst visualization logic |
| `style.css` | Styling for the wheel, tooltips, labels |
| `scaa-2.json` | Spanish-translated coffee flavor hierarchy data |
| `scaa-original.json` | Original SCAA English flavor data (used for color mapping) |

### Gotchas

- The app requires **internet access** to load D3.js from `https://d3js.org/d3.v7.min.js`. If the CDN is unreachable, the page will render blank.
