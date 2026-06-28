---
name: health-tracking
description: Use this skill whenever Mehdi says "track my day", "track this", "log my food", pastes content from his Today's Routine editor, or gives a list of foods he ate/will eat and asks for feedback, analysis, or a nutrition report. Always use this skill for any daily food log + feedback request from Mehdi, even if he doesn't use those exact words — e.g. "here's what I ate today, what do you think", "analyse cette journée", "give me feedback on this day". Produces a standardized health-app-style dashboard artifact, saves the routine and report to the repo, and updates the routines log page.
---

# Health Tracking (Daily Nutrition Report)

Generates Mehdi's daily nutrition tracking report as a **visual dashboard artifact** — not a markdown table. The UI must look and behave identically every single time: same layout, same colors, same structure. Only the data changes.

## Why an artifact, not chat tables

Mehdi explicitly wants this to feel like a health app screen he opens every day — consistent UI/UX, not a freshly-generated layout each time. Treat `assets/tracking_template.html` as a fixed product screen, not a design brief to reinterpret.

## Workflow

1. **Get protocol context.** Read `data/protocol.json` from the repo. Extract:
   - `profile`: TDEE, calorie target, calorie cycling (rest/training)
   - `pillars`: protein target (165g), carb targets (rest ~130g / training ~250g), fat (70g), fiber (25–30g), hydration (3L)
   - `rules`: the full do/don't list — used for gas risk and protocol adherence scoring
   - `issues` and `goals` — for contextual adjustments

2. **Determine date and day type.**
   - Date: today (`YYYY-MM-DD` from current date) unless the input specifies another date explicitly
   - Day type: rest vs training — infer from routine text (look for "Training", "Football", "Running", "Workout", "max effort") or ask once if ambiguous

3. **Calculate macros precisely.** Use bash_tool + a python script to sum kcal/protein/carbs/fat/fiber per item — don't eyeball it. Reference values (USDA-style, per typical serving):
   - Eggs: ~78 kcal, 6.3g protein, 0.6g carb, 5.3g fat each (large)
   - Whey scoop: ~120 kcal, 24g protein, 3g carb, 1.5g fat
   - Khobz complet: ~265 kcal/100g, 10g protein, 50g carb, 3g fat, 7g fiber
   - Oats dry: ~380 kcal/100g, 13.5g protein, 67g carb, 7g fat, 10g fiber
   - White rice dry: ~360 kcal/100g, 7g protein, 78g carb, 0.7g fat, 1.3g fiber
   - Kefta/beef 20% fat raw: ~216 kcal/100g, 20g protein, 0g carb, 15g fat
   - Olive oil: ~120 kcal/tbsp (14g), 14g fat
   - Avocado: ~160 kcal/100g, 2g protein, 8.5g carb, 14.7g fat, 6.7g fiber
   - Mixed nuts/seeds: ~580 kcal/100g, 20g protein, 20g carb, 50g fat, 8g fiber
   - Almonds: ~579 kcal/100g, 21g protein, 22g carb, 50g fat, 12.5g fiber
   - Walnuts: ~654 kcal/100g, 15g protein, 14g carb, 65g fat, 6.7g fiber
   - Pistachios: ~562 kcal/100g, 20g protein, 28g carb, 45g fat, 10g fiber
   - Banana: ~90 kcal, 1.1g protein, 23g carb, 0.3g fat, 2.6g fiber
   - Kiwi (small, ~70g): ~42 kcal, 0.8g protein, 10g carb, 0.4g fat, 2g fiber
   - Jaouda sans lactose milk (100ml): ~61 kcal, 3.2g protein, 4.8g carb, 3.3g fat
   - Onion 1 medium (~110g): ~44 kcal, 1.2g protein, 10.3g carb, 0.1g fat, 1.9g fiber
   - Cooked mixed vegetables: ~30 kcal/100g, 1.3g protein, 6g carb, 0.2g fat, 3g fiber
   - Dates (1 medjool ~24g): ~66 kcal, 0.4g protein, 18g carb, 0g fat, 1.6g fiber
   - Fish (generic lean, 100g): ~82 kcal, 18g protein, 0g carb, 1.3g fat
   - Agave syrup (10g): ~30 kcal, 0g protein, 8g carb, 0g fat
   - Black coffee: ~2 kcal, negligible macros
   - Sugar (1 tsp ~4g): ~16 kcal, 4g carb

4. **Save the routine to the repo.**

   Save input text as `data/routine-YYYY-MM-DD.json`:
   ```json
   {
     "date": "YYYY-MM-DD",
     "dayType": "rest|training",
     "routineText": "<raw input text verbatim>",
     "savedAt": "<ISO timestamp>"
   }
   ```

   Update `data/routines-index.json` — insert or replace the entry for this date (sorted newest first, no duplicates):
   ```json
   [
     { "date": "YYYY-MM-DD", "dayType": "rest|training" }
   ]
   ```

5. **Render the tracking artifact.** Copy `assets/tracking_template.html` verbatim, edit ONLY the `const DATA = {...}` object — never touch the CSS or the `render()` function or layout markup. Save to `assets/tracking-YYYY-MM-DD.html`.

6. **Commit and push all changes.**
   ```bash
   git add data/routine-YYYY-MM-DD.json data/routines-index.json assets/tracking-YYYY-MM-DD.html
   git commit -m "track: log routine and report for YYYY-MM-DD"
   git push origin main
   ```

7. **Status field logic** (used throughout DATA — `"good" | "warn" | "bad"`):
   - Protein/Carbs: good = 90–110% of target, warn = 75–90% or 110–125%, bad = <75% or >125%
   - Fat: good = 85–115%, warn = 70–85% or 115–140%, bad = <70% or >140%
   - Calories: good = within 100 kcal of target, warn = 100–300 kcal off, bad = >300 kcal off
   - Gas/bloat risk and Protocol adherence: judge qualitatively from the `rules` array in `data/protocol.json` (dont entries with reason "gas" are the trigger list)

8. **DATA object fields to fill:**
   - `date`, `dayType` ("Rest day" / "Training day")
   - `verdict`: one-line headline status + short html text mentioning the kcal delta
   - `macros`: array of exactly 3 entries — Protein, Carbs, Fat — each with value, target, pct, status
   - `coverage`: array of rows, always including Calories, Protein, Carbs, Fat, Fiber, Gas/bloat risk, Protocol adherence — add 1–3 more only when something stands out
   - `good`: 2–4 short bullet strings
   - `bad`: 2–4 short bullet strings (key is `bad` even though UI labels it "Watch")
   - `loggedItems`: array of strings — the exact food list from the input, lightly cleaned (one item per line, in order eaten)
   - `adjustments`: array of 2–5 suggested tweaks, each with `from`, `to`, `reason`. Keep adjustments SMALL and realistic. Ground every suggestion in `data/protocol.json` rules, issues, or goals. If the day is already well-balanced, return only 1–2 minor tweaks.
   - `fullTable`: the complete nutrient breakdown, ALWAYS all 32 rows matching the standard nutrient list in `data/protocol.json` nutrients array order (Protein, Water, Fiber, Omega-3, Vitamin D, Iron, B12, Magnesium, Calcium, Zinc, Potassium, Folate B9, Vitamin C, Vitamin A, Iodine, Vitamin E, Vitamin K, B6, Selenium, Thiamine B1, Riboflavin B2, Niacin B3, Copper, Choline, Probiotics, Sodium, Antioxidants, Phosphorus, Manganese, Chromium, B5, Biotin B7). Each row: `n` (priority number), `nutrient`, `impact` (short), `status`, `coverage` (amount/target (%) format), `note` (short food-source breakdown). Calculate from actual foods logged — don't copy example numbers.

9. **Never redesign the UI.** If Mehdi asks for a different look later, edit `assets/tracking_template.html` once. Every report after that will inherit it.

10. **Never touch Notion.** Protocol context comes exclusively from `data/protocol.json`.

## Output

- The artifact (`assets/tracking-YYYY-MM-DD.html`) is the primary deliverable — present it via `present_files`.
- The routine and report are saved to the repo and will appear on `routines.html`.
- Accompany with at most 1–2 sentences of plain text. Do not repeat the full breakdown in chat — the artifact already contains it.
