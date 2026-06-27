---
name: health-food-reference
description: Use this skill whenever Mehdi wants to add a food or product to his Health & Body Food Reference in the GitHub repo. Triggers include him sending a photo of a nutrition label/packaging, or describing a food/product in text (e.g. "add Jaouda fromage frais 110g, 8g protein") and asking to add/log/save it to the reference. This is for building his personal food database, NOT for daily food tracking/feedback (use health-tracking for that).
---

# Food Reference Add

Adds a new food/product entry to `data/food-reference.json` in the **chaouielmehdi/health-tracking** GitHub repo, via a dedicated branch + PR merged to main — so every addition is tracked in git history.

## Workflow

1. **Extract given info — capture everything, not just the baseline 5.**
   - If Mehdi sends an image of a label/packaging, read the FULL nutrition facts panel: kcal, protein, carbs, fat, fiber, serving size/unit, brand name, AND any other listed nutrients (sugar, saturated fat, sodium, vitamins, minerals, omega-3, calcium, etc.).
   - If he gives text only, extract whatever values he states, baseline or not.
   - Note explicitly what was *given* vs what's *missing* for the baseline 5, and list any extra nutrients found.

2. **Web search the exact product.** Search for the specific brand + product name (e.g. "Jaouda fromage frais 110g nutrition facts"), not a generic category search. Use this to:
   - Fill in any missing baseline values (carbs, fiber, etc. that weren't on the label or in his text).
   - Pull in extra nutrients if the label didn't show them but a reliable source has them.
   - Cross-check the values he gave.

3. **Conflict handling — never silently overwrite.** If a web-search value disagrees with what Mehdi provided by a meaningful margin, STOP and show both side by side:
   > "Label/you said: 8g protein. [Source] says: 6.5g protein for this product. Which should I use?"
   Wait for his answer before proceeding.

4. **Fallback if exact product isn't found.** If web search can't find the specific branded product, fall back to a generic per-category estimate and set `"note"` to flag it (e.g. `"Generic estimate — update when exact label found"`).

5. **Assign a category.** Must be one of the existing categories in the `"categories"` array of the JSON. Current valid values: `Supplement`, `Poultry`, `Meat`, `Fish`, `Egg`, `Grain/Carb`, `Fat/Nut`, `Vegetable`, `Fruit`. If a new category is genuinely needed (e.g. Dairy, Spice), add it to the `"categories"` array too.

6. **Build the JSON entry.** Generate a slug `id` from the food name (lowercase, hyphens, no accents). Match the schema exactly:

```json
{
  "id": "jaouda-fromage-frais-110g",
  "emoji": "🧀",
  "name": "Jaouda Fromage Frais",
  "note": "[Dairy] Plain, unsweetened — Jaouda brand",
  "category": "Dairy",
  "serving": "per 110g",
  "kcal": 95,
  "protein": 8.0,
  "carbs": 5.2,
  "fat": 4.1,
  "fiber": 0,
  "extra": [
    {"name": "Calcium", "value": "140mg"},
    {"name": "Sugar", "value": "4.8g"}
  ]
}
```

   Rules:
   - Baseline 5 fields (`kcal`, `protein`, `carbs`, `fat`, `fiber`) are always present — use `0` for genuinely zero, never omit.
   - `extra` array: only include nutrients with actual known values; omit the array entirely if none.
   - `note`: one short line — brand/source notes, generic-estimate flag if applicable.

7. **Show the final entry and get confirmation.** Print the JSON block you're about to commit. No separate confirmation round-trip needed unless a conflict was flagged in step 3 — proceed in the same turn.

8. **Push to GitHub via PR:**
   a. Read the current file: `mcp__github__get_file_contents` on `data/food-reference.json` (repo: `chaouielmehdi/health-tracking`, branch `main`).
   b. Parse the JSON, append the new entry to `"foods"`, update `meta.updated` to today's date (YYYY-MM-DD), and add any new category to `"categories"`.
   c. Create a branch named `food/add-{slug}` using `mcp__github__create_branch` (from `main`).
   d. Commit the updated file with `mcp__github__push_files` to that branch.
   e. Open a PR to `main` with `mcp__github__create_pull_request` — title: `Add food: {Food Name}`.
   f. Merge immediately with `mcp__github__merge_pull_request` (squash).
   g. Report the merged PR URL to Mehdi.

9. **One food per call.** If Mehdi sends multiple products at once, add them one at a time sequentially (read → append → push → PR → merge, then repeat for the next). Don't batch multiple foods into one commit.

## Notes

- Never modify any file other than `data/food-reference.json`.
- Don't recalculate or touch existing entries unless Mehdi explicitly asks to correct one.
- Keep `note` short — one line, same tone as existing entries (e.g. `"~20% fat raw mince, standard Moroccan kefta"`).
