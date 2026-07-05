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

3. **Verify completeness, then calculate macros precisely.** This skill is exigent about inputs — a report that looks precise but was built on guesses is worse than no report. Ask rather than assume; never let convenience win over accuracy.

   **Every item needs a real weight/quantity — no exceptions:**
   - **Missing quantity entirely** — a food listed with no amount: always ask; Mehdi may reply with grams, a serving size, a brand portion, or a count
   - **Ambiguous unit without a clear gram equivalent** — e.g. "½ onion", "2 eggs", "1 tsp sugar": ask for grams, unless the matched food-reference entry's `serving` already resolves it unambiguously (e.g. "per egg (~44g)" makes "2 eggs" resolvable without asking)
   - **Unspecified food type** — e.g. "1 fruit", "some vegetables": don't assume the type, ask
   - **Multiple variants in food-reference.json** — if a name matches more than one entry (e.g. "kefta" matches both 80/20 and 90/10; "milk" matches both regular and sans-lactose), always ask which variant; never default to one silently

   **Brand and type matter wherever more than one real-world variant exists:**
   - **Water** — if water intake is logged without naming a brand, ask which one (Sidi Ali, Ciel, Ghayt, Aquafina, tap, or other). Mineral content differs enough between them (see `food-reference.json`) that "1L water" is not a complete entry
   - **Milk or dairy added to anything** — coffee, tea, cereal, cooking, etc.: ask which product and fat content (e.g. Jaouda Sans Lactose vs. regular whole milk vs. skimmed) rather than assuming — calcium, fat, and lactose content all shift meaningfully between them

   **Sleep and wake times.** If the pasted routine doesn't include clear wake-up and sleep timestamps, ask for them before finalizing the report — even though today's `DATA` schema doesn't score sleep yet, the record on file should stay accurate for when it does.

   **Unknown foods are a hard stop, not a soft fallback.** If a food isn't in `data/food-reference.json`, never silently estimate a plausible-sounding number and move on:
   - **Branded/packaged item** — research it properly (the product's own label, manufacturer site, Open Food Facts, or similar) before using it. Once a confident, sourced value is found, add a real entry to `data/food-reference.json` — noting where the numbers came from — then calculate from that entry, same as any other food.
   - **Generic or homemade item with no findable source** — stop and ask Mehdi for the nutrition facts (a label photo, or values he already knows) rather than guessing.
   - Every number that ends up in the day's scored macros must trace back to either a `food-reference.json` entry or something Mehdi explicitly gave you — never an unverified guess presented as fact.

   Once every input above is resolved: use bash_tool + a python script to sum kcal/protein/carbs/fat/fiber per item — don't eyeball it. Read `data/food-reference.json` for nutritional values — use the `kcal`, `protein`, `carbs`, `fat`, `fiber` fields per food entry, scaled to the consumed quantity relative to the entry's `serving` field.

   **Special quantity rules:**
   - **Weekly portions** (e.g. "olive oil 70g for the whole week"): divide by 7 to get the daily amount, and note it in loggedItems (e.g. "olive oil 10g/day (70g ÷ 7)")
   - **Weight state**: always match the weight to the food-reference entry's state — if the entry is per 100g raw, use the raw weight. Example: "kefta 250g raw" → use 250g against the raw reference values, never the cooked weight

4. **Score the day, then fold in adjustments — the report only ever shows one final version.** Score the raw input against protocol targets internally to decide what (if anything) needs tweaking, then produce the final day:
   - Keep changes small and realistic — 1–3 targeted changes max; when multiple macros are significantly off, it's fine to address each with its own tweak; prioritize the worst-status macro first
   - **Directional priority:** if protein is under 100%, look for a tweak that pushes it up (extra scoop, more of the protein source) — don't leave it sitting under target. If carbs or fat are over 100%, look for a tweak that trims them down — don't leave an overshoot unaddressed just because it's still in a "warn" band. A protein overshoot or a carb/fat undershoot is never something to "fix" — only the reverse direction needs a tweak
   - Ground every tweak in `data/protocol.json` rules, issues, or goals
   - Record each tweak as `{ from, to, reason }` in `adjustments` — this is the only place the "before" ever shows up (rendered as the "Changes Applied" list). If the day already meets the targets with no tweaks needed, `adjustments` is just an empty array — never invent a change to fill it.
   - Calculate every score (verdict, macros, coverage, good, bad, fullTable) from the **final** food list (raw input + adjustments applied) — there is no separate "original" scoring kept around

5. **Save the routine to the repo.**

   Save input text as `data/routine-YYYY-MM-DD.json` — this keeps the raw input on record; it is not shown in the report UI:
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

6. **Save the tracking data and render the artifact.**

   a. Save the full DATA object to `data/tracking-YYYY-MM-DD.json` — this is the structured nutrition data for later analysis.

   b. Copy `.claude/commands/assets/tracking_template.html` verbatim to `assets/tracking-YYYY-MM-DD.html` — **no edits**. The template fetches its data from the JSON file at runtime.

7. **Commit, open a PR, and merge to main.**

   The working branch is whatever branch the session started on (e.g. `claude/health-track-daily-routine-*`). Stage, commit, push that branch, then create a PR and immediately merge it so the deploy triggers from `main`.

   ```bash
   # 1. commit on the current feature branch
   git add data/routine-YYYY-MM-DD.json data/routines-index.json data/tracking-YYYY-MM-DD.json assets/tracking-YYYY-MM-DD.html
   git commit -m "track: log routine and report for YYYY-MM-DD"
   git push -u origin <current-branch>

   # 2. make sure main is available locally
   git fetch origin main
   git checkout -b main origin/main   # or just: git checkout main

   # 3. merge feature branch into main and push
   git merge <current-branch> --no-edit
   git push origin main
   ```

   If `git checkout main` fails because the branch doesn't exist locally yet, use `git checkout -b main origin/main` instead.

8. **Status field logic** (used throughout DATA — `"good" | "warn" | "bad"`) — **directional, not symmetric.** Protein is a floor (overshoot costs little, undershoot risks muscle); carbs and fat are ceilings (undershoot is fine, overshoot is what actually works against the fat-loss goal):
   - Protein: good = 100–120% of target, warn = 90–100% or 120–135%, bad = <90% or >135%
   - Carbs: good = 85–100% of target, warn = 70–85% or 100–115%, bad = <70% or >115%
   - Fat: good = 80–100%, warn = 70–80% or 100–115%, bad = <70% or >115%
   - Calories: good = within 100 kcal of target, warn = 100–300 kcal off, bad = >300 kcal off
   - Gas/bloat risk and Protocol adherence: judge qualitatively from the `rules` array in `data/protocol.json` (dont entries with reason "gas" are the trigger list)

9. **DATA object structure** (saved to `data/tracking-YYYY-MM-DD.json`) — flat, single final version, no original/optimized split:

   ```js
   const DATA = {
     date,          // "Month DD, YYYY"
     dayType,       // "Rest day" or "Training day"
     routineText,   // FINAL log — same format as the raw input (schedule/timestamps preserved), with
                     // adjustments already folded in; this is the only version shown in the report, plain text (no diff markup)

     adjustments,   // array of { from, to, reason } — the specific tweaks applied to get from the raw input to routineText;
                     // empty array if the day already met targets as-is — this is the only place "before" values ever appear, rendered as "Changes Applied"

     verdict,       // { status, icon, text_html } — one-line headline + kcal delta, scored from the final day
     macros,        // array of exactly 3: Protein, Carbs, Fat — each { name, value, target, pct, status }
     coverage,      // array of rows: always Calories, Protein, Carbs, Fat, Fiber, Gas/bloat risk, Protocol adherence + 1–3 standouts
     good,          // 2–4 short bullet strings
     bad,           // 2–4 short bullet strings (key is `bad` even though UI labels it "Watch")
     loggedItems,   // array of plain strings — exact final food list, lightly cleaned
     fullTable      // all 32 nutrient rows (see nutrient order below), scored from the final day
   };
   ```

   **fullTable** nutrient order (always all 32 rows, matching `data/protocol.json` nutrients array):
   Protein, Water, Fiber, Omega-3, Vitamin D, Iron, B12, Magnesium, Calcium, Zinc, Potassium, Folate B9, Vitamin C, Vitamin A, Iodine, Vitamin E, Vitamin K, B6, Selenium, Thiamine B1, Riboflavin B2, Niacin B3, Copper, Choline, Probiotics, Sodium, Antioxidants, Phosphorus, Manganese, Chromium, B5, Biotin B7.
   Each row: `n` (priority number), `nutrient`, `impact` (short), `status`, `coverage` (amount/target (%) format), `note` (short food-source breakdown). Calculate from actual foods logged — don't copy example numbers.

10. **Never redesign the UI.** If Mehdi asks for a different look later, edit `.claude/commands/assets/tracking_template.html` once. Every report after that will inherit it.

## Output

- Give Mehdi a direct clickable link to the report: `[View report →](https://chaouielmehdi.github.io/health-tracking/assets/tracking-YYYY-MM-DD.html)`
- Accompany with at most 1–2 sentences of plain text. Do not repeat the full breakdown in chat — the artifact already contains it.
- If any food wasn't already in `data/food-reference.json`, say how it was resolved — a sourced entry was researched and added, or it's still waiting on info from Mehdi — never present an unverified number as fact.
