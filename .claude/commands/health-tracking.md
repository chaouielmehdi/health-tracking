---
name: health-tracking
description: Use this skill whenever Mehdi says "track my day", "track this", "log my food", or gives a list of foods he ate/will eat and asks for feedback, analysis, or a nutrition report. Always use this skill for any daily food log + feedback request from Mehdi, even if he doesn't use those exact words — e.g. "here's what I ate today, what do you think", "analyse cette journée", "give me feedback on this day". Produces a standardized health-app-style dashboard artifact (same UI every time) against Mehdi's Health & Body - Protocol (Notion page ID 376c5670-6687-810c-a6ab-cbf594dbc3ac).
---

# Health Tracking (Daily Nutrition Report)

Generates Mehdi's daily nutrition tracking report as a **visual dashboard artifact** — not a markdown table. The UI must look and behave identically every single time: same layout, same colors, same structure. Only the data changes.

## Why an artifact, not chat tables

Mehdi explicitly wants this to feel like a health app screen he opens every day — consistent UI/UX, not a freshly-generated layout each time. Treat `assets/tracking_template.html` as a fixed product screen, not a design brief to reinterpret.

## Workflow

1. **Get protocol context.** If not already in this conversation, fetch the Notion page (id `376c5670-6687-810c-a6ab-cbf594dbc3ac`) — "Health & Body - Protocol" — for current targets: TDEE (~2,415 kcal), protein target (150g), fat target, carb targets (rest day vs training day — confirm current numbers, don't assume stale ones), vegetable/fruit/dairy rules, and the "Never" list.

2. **Determine rest day vs training day.** If ambiguous, ask once. This changes the carb target.

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
   - Banana: ~90 kcal, 1.1g protein, 23g carb, 0.3g fat, 2.6g fiber
   - Kiwi (small, ~70g): ~42 kcal, 0.8g protein, 10g carb, 0.4g fat, 2g fiber
   - Jaouda 110g: ~165 kcal, 8g protein, 4g carb, 12g fat
   - Onion 1 medium (~110g): ~44 kcal, 1.2g protein, 10.3g carb, 0.1g fat, 1.9g fiber
   - Cooked mixed vegetables: ~30 kcal/100g, 1.3g protein, 6g carb, 0.2g fat, 3g fiber

4. **Render the artifact.** Copy `assets/tracking_template.html` verbatim, then edit ONLY the `const DATA = {...}` object — never touch the CSS or the `render()` function or layout markup. This is what guarantees identical UI/UX every time. Save it via `create_file` to `/mnt/user-data/outputs/tracking_<date>.html` and present it with `present_files`.

5. **Status field logic** (used throughout DATA — `"good" | "warn" | "bad"`):
   - Protein/Carbs: good = 90-110% of target, warn = 75-90% or 110-125%, bad = <75% or >125%
   - Fat: good = 85-115%, warn = 70-85% or 115-140%, bad = <70% or >140%
   - Calories: good = within 100 kcal of TDEE, warn = 100-300 kcal off, bad = >300 kcal off
   - Gas/bloat risk and Protocol adherence: judge qualitatively from known triggers (raw onion, milk, legumes >1x/week, bread twice/day, stacked carb sources, stacked fat sources, etc.)

6. **DATA object fields to fill:**
   - `date`, `dayType` ("Rest day" / "Training day")
   - `verdict`: one-line headline status + short html text mentioning the kcal delta
   - `macros`: array of exactly 3 entries — Protein, Carbs, Fat — each with value, target, pct, status
   - `coverage`: array of rows, always including Calories, Protein, Carbs, Fat, Fiber, Gas/bloat risk, Protocol adherence — add 1-3 more only when something stands out that day (e.g. low vitamin D, good omega-3)
   - `good`: 2-4 short bullet strings
   - `bad`: 2-4 short bullet strings (use this key even though the UI labels it "Watch")
   - `loggedItems`: array of strings — the exact food list Mehdi gave, lightly cleaned up (one item per line, in the order he ate them)
   - `adjustments`: array of 2-5 suggested tweaks, each with `from` (what he ate), `to` (the small adjustment), `reason` (one short clause tying it to a protocol rule or goal). Keep adjustments SMALL and realistic — e.g. "70g → 50g", "skip avocado on kefta days", "swap jaouda → raib", "walnuts only instead of 5-nut mix". Never suggest removing a whole meal or a structural protocol change here; this is a same-day, same-ingredients optimization, not a redesign. Ground every suggestion in something already in the Notion protocol (the rotation rules, the fat-source-max rule, the approved dairy list, the gas triggers, or the stated goals — fat loss, muscle gain, footballer body, reduce bloating). If the day is already well-balanced, it's fine to return only 1-2 minor adjustments or note that no changes are needed.
   - `fullTable`: the complete nutrient breakdown, ALWAYS all 32 rows matching the standard nutrient list used in Mehdi's Notion tracker (Protein, Water, Fiber, Omega-3, Vitamin D, Iron, B12, Magnesium, Calcium, Zinc, Potassium, Folate, Vitamin C, Vitamin A, Iodine, Vitamin E, Vitamin K, B6, Selenium, Thiamine, Riboflavin, Niacin, Copper, Choline, Probiotics, Sodium, Antioxidants, Phosphorus, Manganese, Chromium, B5, Biotin). Each row needs: `n` (priority number), `nutrient`, `impact` (impact if missing, short), `status` (good/warn/bad), `coverage` (amount/target (%) format), `note` (short food-source breakdown, same style as Mehdi's Notion notes — e.g. "Kefta ~3.5mg, eggs ~2mg"). Calculate each value from the actual foods logged that day — don't copy the example numbers verbatim.

7. **Don't touch Notion** unless Mehdi explicitly asks to update/log it there.

8. **Never redesign the UI.** If Mehdi asks for a different look later, edit `assets/tracking_template.html` once (the shared template), not per-report. Every report after that should still look identical to every other report.

## Output

- The artifact (HTML file) is the primary deliverable — present it via `present_files`.
- Accompany it with at most 1-2 sentences of plain text (e.g. "Here's today's tracking — fat's running high again, same pattern as the 22nd."). Do not also repeat the full breakdown as a separate markdown report; the artifact already contains it. Keep chat text minimal since the dashboard is the report.
