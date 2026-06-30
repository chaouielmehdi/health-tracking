# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal health & nutrition tracking system for Mehdi (Casablanca, 32 yo, 185 cm, ~75 kg). A fully static site deployed on GitHub Pages — no build step, no framework, no package manager. All pages are plain HTML/CSS/JS; all data lives in JSON files under `data/`.

The site has three pages:
- `index.html` — dashboard: profile, goals, protocol, today's routine editor, history
- `routines.html` — log of all tracked days linking to their nutrition reports
- `food-reference.html` — searchable personal food database

`header.js` is a shared IIFE that injects the page header (badge, title, back link, deploy timestamp) into any `<div id="page-header">` element.

## Data Files

| File | Purpose |
|---|---|
| `data/protocol.json` | Mehdi's profile, targets, goals, pillars, rules, nutrients — the single source of truth for the protocol |
| `data/food-reference.json` | Personal food database with macros + extra nutrients for each entry |
| `data/history.json` | Monthly history entries (weight, scores, notes) |
| `data/routines-index.json` | Sorted list of tracked days `[{ date, dayType }]` — newest first |
| `data/routine-YYYY-MM-DD.json` | Per-day routine: raw input text + optimized version |
| `data/deploy.json` | Written by CI on each GitHub Pages deploy; shows last deploy time in the header |

All HTML pages fetch these JSON files at runtime (`fetch('data/xxx.json?v='+Date.now())`).

## Nutrition Report Artifacts

Each tracked day generates `assets/tracking-YYYY-MM-DD.html` — a self-contained nutrition dashboard. These are produced by copying `.claude/commands/assets/tracking_template.html` verbatim and filling only the `const DATA = {...}` object. **Never touch the CSS, `render()` function, or layout markup.** If the design needs to change, edit the template — all future reports inherit it automatically.

## Deployment

Push to `main` → GitHub Pages auto-deploys → the `update-deploy-time` workflow writes `data/deploy.json` with the deploy timestamp. All tracking and food-reference changes must land on `main` to be live.

## Skills (Slash Commands)

Two Claude skills handle the recurring workflows. Both live in `.claude/commands/`.

### `/health-tracking` — Daily Nutrition Report

**Trigger:** Mehdi says "track my day", pastes his Today's Routine text, or gives a food list asking for feedback/analysis.

**What it does:**
1. Reads `data/protocol.json` for targets/rules
2. Reads `data/food-reference.json` for nutritional values; falls back to USDA for unlisted foods
3. Asks for clarification before calculating if quantities are ambiguous (missing amounts, variant choices, unspecified food types)
4. Calculates macros precisely via a Python script — never eyeballed
5. Produces an "original" analysis and an "optimized" version (1–3 targeted tweaks max)
6. Saves `data/routine-YYYY-MM-DD.json`, updates `data/routines-index.json`
7. Renders `assets/tracking-YYYY-MM-DD.html` from the template
8. Commits on current branch → pushes → creates PR → merges to `main`

**Status thresholds:** Protein/Carbs good = 90–110% of target; Fat good = 85–115%; Calories good = within 100 kcal.

### `/health-food-reference` — Add Food to Database

**Trigger:** Mehdi sends a nutrition label photo or describes a product asking to add it to the reference.

**What it does:**
1. Extracts all values from the label/text
2. Web-searches the exact brand + product to fill gaps and cross-check
3. Stops and asks Mehdi if any value conflicts meaningfully between label and web source
4. Appends to `data/food-reference.json` via `mcp__github__push_files` on a branch `food/add-{slug}` → PR → immediate squash merge to `main`
5. One food per call; never modifies existing entries unless explicitly asked

**Food entry schema:** `id`, `emoji`, `name`, `note`, `category`, `serving`, `kcal`, `protein`, `carbs`, `fat`, `fiber`, optional `extra: [{name, value}]`.  
Valid categories: `Supplement`, `Poultry`, `Meat`, `Fish`, `Egg`, `Grain/Carb`, `Fat/Nut`, `Vegetable`, `Fruit`.

## Key Conventions

- **No build step.** Open any `.html` directly in a browser or serve with `python3 -m http.server` from the repo root.
- **Data-driven UI.** Pages render from JSON at load time; skeleton loaders show during fetch. Never hardcode data into HTML.
- **CSS variables only.** All colours are defined as `--bg`, `--accent`, `--good`, `--warn`, `--bad`, etc. in each page's `:root`. No external CSS files.
- **Git flow for tracking.** The health-tracking skill commits on a feature branch, opens a PR, and merges immediately — so every tracked day is a clean commit on `main`.
- **`?v=Date.now()` cache-busting** is appended to all JSON fetches to ensure the latest data after a deploy.
