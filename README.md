# Vice City Trophy Ledger

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/Wahyukanzuro/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/Wahyukanzuro/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that is a guide and tracker for all 55 trophies of Grand Theft Auto VI on PlayStation 5: every trophy with its official name, description and grade, a cited step-by-step guide, a tracker that saves in the browser, a four-stage roadmap, a missables view, and a sources panel with a source matrix.

## What it is

- **Checklist** — all 55 trophies with filters (story / missable / collectibles / activities / robberies / exploration / side), search, grade filter, hide-earned, and per-trophy progress counters for the 20 trophies PSN tracks (meditations 9/18, stunts 250, and so on).
- **Guide** — each trophy has a 3–7 step guide written in our own words, and every step cites at least one source: 175 steps, 0 uncited.
- **Roadmap** — four stages built from the official descriptions: the story (60–80h), the 100% checklist (~100h), strangers and character lines (~10h), robberies and odd jobs.
- **Missables** — 1 possibly missable trophy (Positive Mental Attitude: the Chapter 1 balcony meditation), plus the 5 hidden trophies whose methods no second source has confirmed yet.
- **Spoilers** — story trophies stay hidden until earned, with a per-trophy Reveal. The setting is on by default.
- **Sources** — 10 public guides, all read 20 November 2026, with per-source coverage counts and a full source matrix. Where sources disagree, the guide says so: 10 disagreement boxes.
- **Export / import** — progress lives only in this browser (localStorage); export a JSON file to keep a copy or move it to another browser.

## Facts on the list

55 official trophies: 1 platinum, 2 gold, 6 silver, 46 bronze. 28 hidden. 1,000 Gamerscore. About 200 hours to the platinum (difficulty 4/10, single-player only, no DLC needed). Rarity figures are from Exophase, read 19 November 2026.

## Run it

Serve `app/` over any static server — the app works fully offline and makes no network requests:

```sh
cd app && python3 -m http.server 8000
```

Then open http://localhost:8000/ in a browser.

## Build the entry

`main.ts` (Node 22) copies `app/` and `screenshots/` into the output directory and builds `dossier.json` from the copied files with the kit's `vendor/makefun-frontend.ts`:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

Running it twice produces byte-identical output.

## Layout

- `main.ts` — entrypoint (see above)
- `app/index.html`, `app/style.css`, `app/app.js` — the app (system fonts, no images, no network)
- `app/data/trophies.json` — the 55 trophies, their guides, and the 10 sources
- `screenshots/` — 4 screenshots of the running app (1280×800)
- `shots.json` — how each screenshot was taken
- `vendor/makefun-frontend.ts` — kit vendor code, unchanged
- `serve.ts` — kit dev server, unchanged

Unofficial fan guide. Trophy names and descriptions are published by Rockstar Games / PlayStation. Guide text is written in our own words from the sources listed in the app. No Rockstar artwork or logos are used.
