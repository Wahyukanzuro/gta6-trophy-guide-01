# Vice City Trophy Ledger

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Wahyukanzuro/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Wahyukanzuro/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that guides and tracks all 55 PlayStation 5 trophies of Grand Theft Auto VI. Built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **Tracker** — every trophy with its official name, description and grade; a checklist saved in the browser, with export and import; filters by kind (story, missable, collectibles, activities, side, robberies, exploration); a spoiler setting that hides story trophies until earned; per-trophy progress counters for the counts PlayStation tracks (42 shooting range golds, 18 meditation spots, 100 WAiNK scans, and more).
- **Roadmap to the platinum** — the goal bar, seven stages from the opening chapters to the crime-and-cleanup finish, and the full 100% completion checklist behind the gold trophy A Long Road.
- **Cited guidance** — each of the 55 guides is written in our own words and cites its sources by number. 224 steps, every one cited, 0 uncited. 12 public guides were read first-hand on 19 Nov 2026: PowerPyx, PSNProfiles, Exophase, OutputLag, KeenGamer, eGamers, GTABase, GTA-Zone, GTA Vibes, Push Square, SixShore and U7BUY.
- **Sources disagree** — 14 honest disagreement boxes where the guides differ (meditation counts, the finale's chapter, cheat rules, platinum hours, hidden counts, shooting range locations, and more), plus a 55×12 source matrix showing which sources cover which trophy.
- **Missables** — the one possibly missable trophy (Positive Mental Attitude, the Chapter 1 balcony meditation), the things that look missable but are not, and the six trophies whose method is still unconfirmed.

## Run it offline

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network at run time. The only fetch is the local `app/data/trophies.json`. System fonts only, no images — the first load is three small files.

## Layout

- `main.ts` — the entry program (Node 22): copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.
- `app/index.html` — the shell; `app/style.css` — the light paper theme; `app/app.js` — rendering, routing, progress, export/import.
- `app/data/trophies.json` — the 55 trophies (official names, descriptions, grades, hidden flags, PSN counts, Gamerscore), the 12 sources, the 14 disagreement boxes, and the 224 cited guide steps.
- `screenshots/` — four renders of the app (checklist with the Positive Mental Attitude guide open, roadmap, missables, sources).

## Notes

Unofficial fan guide, not affiliated with Rockstar Games. No Rockstar logo, artwork or game screenshots are used. Trophy names and descriptions are shown as PlayStation publishes them; all guidance is written in our own words for this ledger, never copied from another guide.

## License

MIT — see [LICENSE](LICENSE).
