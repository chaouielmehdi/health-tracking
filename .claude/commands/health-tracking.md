---
name: health-tracking
description: Use this skill whenever Mehdi says "track my day", "track this", "log my food", pastes content from his Today's Routine editor, or gives a list of foods he ate/will eat and asks for feedback, analysis, or a nutrition report. Always use this skill for any daily food log + feedback request from Mehdi, even if he doesn't use those exact words — e.g. "here's what I ate today, what do you think", "analyse cette journée", "give me feedback on this day". Produces a standardized health-app-style dashboard artifact, saves the routine and report to the repo, and updates the routines log page.
---

# Health Tracking (Daily Nutrition Report)

Generates Mehdi's daily nutrition tracking report as a **visual dashboard artifact** — not a markdown table. The UI must look and behave identically every single time: same layout, same colors, same structure. Only the data changes.

## Why an artifact, not chat tables

Mehdi explicitly wants this to feel like a health app screen he opens every day — consistent UI/UX, not a freshly-generated layout each time. Treat `assets/tracking_template.html` as a fixed product screen, not a design brief to reinterpret.

## Workflow

1. **Get protocol context.** Read `data/protocol.json` from the repo. Use whatever fields are present — the structure may evolve over time. Use the protocol data to understand current targets, rules, issues, and goals.

2. **Determine date and day type.**
   - Date: today (`YYYY-MM-DD` from current date) unless the input specifies another date explicitly
   - Day type: rest vs training — infer from routine text (look for "Training", "Football", "Running", "Workout", "max effort") or ask once if ambiguous

3. **Calculate macros precisely.** Use bash_tool + a python script to sum kcal/protein/carbs/fat/fiber per item — don't eyeball it. Read `data/food-reference.json` for nutritional values — use the `kcal`, `protein`, `carbs`, `fat`, `fiber` fields per food entry, scaled to the consumed quantity relative to the entry's `serving` field. For foods not found in `data/food-reference.json`, fall back to standard USDA values.

   **Before calculating, stop and ask Mehdi if any of the following apply:**
   - **Unspecified food type** — e.g. "1 fruit", "some vegetables": don't assume the type, ask
   - **Ambiguous unit without a clear gram equivalent** — e.g. "½ onion", "2 eggs", "1 tsp sugar": ask for grams unless the food-reference entry's serving already covers it (e.g. "per egg (~44g)")
   - **Missing quantity** — a food listed with no amount at all: ask; Mehdi may reply with a serving size, brand portion, or count rather than grams/ml

   **Special quantity rules:**
   - **Weekly portions** (e.g. "olive oil 70g for the whole week"): divide by 7 to get the daily amount, and note it in loggedItems (e.g. "olive oil 10g/day (70g ÷ 7)")
   - **Weight state**: always match the weight to the food-reference entry's state — if the entry is per 100g raw, use the raw weight. Example: "kefta 250g raw" → use 250g against the raw reference values, never the cooked weight

   **Missing foods notification:** After calculating, if any food was not found in `data/food-reference.json`, list them at the end of your reply with their estimated USDA values (kcal, protein, carbs, fat, fiber per serving), and ask Mehdi if he wants to add them to `data/food-reference.json`.

4. **Generate the optimized version.** After scoring the original day, produce a lightly-tweaked version that brings all macros as close to protocol targets as possible:
   - Keep changes small and realistic — 1–3 targeted changes max; when multiple macros are significantly off, it's fine to address each with its own tweak; prioritize the worst-status macro first
   - Ground every tweak in `data/protocol.json` rules, issues, or goals
   - Recalculate macros for the optimized version
   - Build the optimized food list: items that differ from the original get `{ "text": "...", "changed": true }`, unchanged items stay plain strings

5. **Save the routine to the repo.**

   Save input text as `data/routine-YYYY-MM-DD.json`:
   ```json
   {
     "date": "YYYY-MM-DD",
     "dayType": "rest|training",
     "routineText": "<raw input text verbatim>",
     "optimizedText": "<optimized food list, one item per line>",
     "savedAt": "<ISO timestamp>"
   }
   ```

   Update `data/routines-index.json` — insert or replace the entry for this date (sorted newest first, no duplicates):
   ```json
   [
     { "date": "YYYY-MM-DD", "dayType": "rest|training" }
   ]
   ```

6. **Render the tracking artifact.** Copy `.claude/commands/assets/tracking_template.html` verbatim, edit ONLY the `const DATA = {...}` object — never touch the CSS or the `render()` function or layout markup. Save to `assets/tracking-YYYY-MM-DD.html`.

7. **Commit and push all changes.**
   ```bash
   git add data/routine-YYYY-MM-DD.json data/routines-index.json assets/tracking-YYYY-MM-DD.html
   git commit -m "track: log routine and report for YYYY-MM-DD"
   git push origin main
   ```

8. **Status field logic** (used throughout DATA — `"good" | "warn" | "bad"`):
   - Protein/Carbs: good = 90–110% of target, warn = 75–90% or 110–125%, bad = <75% or >125%
   - Fat: good = 85–115%, warn = 70–85% or 115–140%, bad = <70% or >140%
   - Calories: good = within 100 kcal of target, warn = 100–300 kcal off, bad = >300 kcal off
   - Gas/bloat risk and Protocol adherence: judge qualitatively from the `rules` array in `data/protocol.json` (dont entries with reason "gas" are the trigger list)

9. **DATA object structure to fill:**

   ```js
   const DATA = {
     date,        // "Month DD, YYYY"
     dayType,     // "Rest day" or "Training day"
     routineText, // raw input text verbatim (the full routine Mehdi pasted)

     adjustments, // array of { from, to, reason } — the specific changes original → optimized

     original: {
       verdict,      // { status, icon, text_html } — one-line headline + kcal delta
       macros,       // array of exactly 3: Protein, Carbs, Fat — each { name, value, target, pct, status }
       coverage,     // array of rows: always Calories, Protein, Carbs, Fat, Fiber, Gas/bloat risk, Protocol adherence + 1–3 standouts
       good,         // 2–4 short bullet strings
       bad,          // 2–4 short bullet strings (key is `bad` even though UI labels it "Watch")
       loggedItems,  // array of strings — exact food list from the input, lightly cleaned
       fullTable     // all 32 nutrient rows (see nutrient order below)
     },

     optimized: {
       verdict,      // updated verdict for the optimized version
       macros,       // recalculated macros for optimized version
       coverage,     // recalculated coverage for optimized version
       good,         // updated strengths
       bad,          // remaining gaps after optimization
       loggedItems,  // mixed array: unchanged items = plain strings, changed items = { text, changed: true }
       fullTable     // all 32 nutrient rows recalculated for optimized version
     }
   };
   ```

   **fullTable** nutrient order (always all 32 rows, matching `data/protocol.json` nutrients array):
   Protein, Water, Fiber, Omega-3, Vitamin D, Iron, B12, Magnesium, Calcium, Zinc, Potassium, Folate B9, Vitamin C, Vitamin A, Iodine, Vitamin E, Vitamin K, B6, Selenium, Thiamine B1, Riboflavin B2, Niacin B3, Copper, Choline, Probiotics, Sodium, Antioxidants, Phosphorus, Manganese, Chromium, B5, Biotin B7.
   Each row: `n` (priority number), `nutrient`, `impact` (short), `status`, `coverage` (amount/target (%) format), `note` (short food-source breakdown). Calculate from actual foods logged — don't copy example numbers.

10. **Never redesign the UI.** If Mehdi asks for a different look later, edit `.claude/commands/assets/tracking_template.html` once. Every report after that will inherit it.

## Output

- Give Mehdi a direct clickable link to the report: `[View report →](https://chaouielmehdi.github.io/health-tracking/assets/tracking-YYYY-MM-DD.html)`
- Accompany with at most 1–2 sentences of plain text. Do not repeat the full breakdown in chat — the artifact already contains it.
- If any foods were missing from `data/food-reference.json`, list them with estimated values and ask if he wants to add them.
