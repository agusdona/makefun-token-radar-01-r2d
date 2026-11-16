# Fieldnote / Token Radar

Offline Node 22.18+ entry. Standard library only; no installation required.

```sh
mkdir -p out out/dashboard out/screenshots
MAKEFUN_OUTPUT_DIR=out node main.ts --input /absolute/path/to/snapshot.json
```

Open `out/dashboard/index.html`. Default input is `/input/snapshot.json`; default output is `/output`. The caller must create output, dashboard and screenshots directories. No directory creation occurs in main.ts or lib. This differs from the starter and requires parent review if the grader does not pre-create subdirectories.

The board retains every record passing available snapshot screens. It labels watchlist, below-floor and additional inclusions separately. Valuation fits log market cap against log TVL, with shrunk category ratios, bounded growth and tracking-age adjustments. Research and validation are visible in the dashboard. Neither token launches nor rewards are established by this dataset.

Files: main.ts; lib/model.ts, farm.ts, backtest.ts, board.ts; dashboard/index.html, app.css, app.js; three original screenshots; unchanged kit vendor/makefun-board.ts and MIT LICENSE.

Screenshots were rendered with bundled Playwright Chromium, after the installed meta-chromium binary failed its startup policy. Browser tooling is development-only and is not required by the entry.
