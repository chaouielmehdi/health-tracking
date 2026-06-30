# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal health & nutrition tracking system. A fully static site deployed on GitHub Pages — no build step, no framework, no package manager. All pages are plain HTML/CSS/JS; all data lives in JSON files under `data/`.

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

### `/health-food-reference` — Add Food to Database

**Trigger:** Mehdi sends a nutrition label photo or describes a product asking to add it to the reference.

## Key Conventions

- **No build step.** Open any `.html` directly in a browser or serve with `python3 -m http.server` from the repo root.
- **Data-driven UI.** Pages render from JSON at load time; skeleton loaders show during fetch. Never hardcode data into HTML.
- **CSS variables only.** All colours are defined as `--bg`, `--accent`, `--good`, `--warn`, `--bad`, etc. in each page's `:root`. No external CSS files.
- **Git flow for tracking.** The health-tracking skill commits on a feature branch, opens a PR, and merges immediately — so every tracked day is a clean commit on `main`.
- **`?v=Date.now()` cache-busting** is appended to all JSON fetches to ensure the latest data after a deploy.
