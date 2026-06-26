---
name: health-food-reference
description: Use this skill whenever Mehdi wants to add a food or product to his Health & Body Food Reference page in Notion. Triggers include him sending a photo of a nutrition label/packaging, or describing a food/product in text (e.g. "add Jaouda fromage frais 110g, 8g protein") and asking to add/log/save it to the reference. This is for building his personal food database, NOT for daily food tracking/feedback (use health-tracking for that).
---

# Food Reference Add

Adds a new food/product entry to Mehdi's **Health & Body Food Reference** Notion page (id `389c5670-6687-81b0-bc23-dc1d7ff0b7e7`), using whatever info he provides (image and/or text) plus a web search to fill gaps and verify.

## Workflow

1. **Extract given info — capture everything, not just the baseline 5.**
   - If Mehdi sends an image of a label/packaging, read the FULL nutrition facts panel: kcal, protein, carbs, fat, fiber, serving size/unit, brand name, AND any other listed nutrients (sugar, saturated fat, sodium, salt, vitamins, minerals, omega-3, calcium, etc.).
   - If he gives text only, extract whatever values he states, baseline or not.
   - Note explicitly what was *given* vs what's *missing* for the baseline 5, and list any extra nutrients found.

2. **Web search the exact product.** Search for the specific brand + product name (e.g. "Jaouda fromage frais 110g nutrition facts"), not a generic category search. Use this to:
   - Fill in any missing baseline values (carbs, fiber, etc. that weren't on the label or in his text).
   - Pull in extra nutrients if the label didn't show them but a reliable source has them (e.g. vitamin D on a supplement, sugar content on a dairy product).
   - Cross-check the values he gave.

3. **Conflict handling — never silently overwrite.** If a web-search value disagrees with what Mehdi provided (label photo or text) by a meaningful margin, STOP and show both side by side:
   > "Label/you said: 8g protein. [Source] says: 6.5g protein for this product. Which should I use?"
   Wait for his answer before writing anything to Notion.

4. **Fallback if exact product isn't found.** If web search can't find the specific branded product, fall back to a generic per-category estimate (e.g. generic "fromage frais nature" values) and clearly mark the entry as a generic estimate in the comment line — same convention as the existing Whey protein entry on the page — so Mehdi knows to correct it later if he finds the real label.

5. **Assign a category** (tag, even though the page itself is not grouped/sectioned). Use simple categories: Meat, Poultry, Fish, Egg, Dairy, Supplement, Grain/Carb, Fat/Nut, Vegetable, Fruit, Spice, Other. Put the category as a small tag at the start of the comment line, e.g. `**[Dairy]** Plain, unsweetened — ...`.

6. **Show the final entry before writing.** Present the exact block (heading, comment, table) you're about to add and get implicit go-ahead in the same turn (no need for a separate confirmation round-trip unless a conflict was flagged in step 3).

7. **Write to Notion** using `update_content` (insert at end) on page `389c5670-6687-81b0-bc23-dc1d7ff0b7e7`, matching the existing format. The table ALWAYS has the 5 baseline columns first (Kcal, Protein, Carbs, Fat, Fiber — use `0` for any that are genuinely zero, not "unknown"), then appends one extra column per additional known nutrient (sugar, sodium, vitamin D, calcium, omega-3, etc.) — only the ones actually known for that specific food, so column count varies food to food:

```
## {emoji} {Food Name}
**[{Category}]** {one-line comment — source/brand notes, generic-estimate flag if applicable} — per {unit}
<table header-row="true">
<tr>
<td>Kcal</td>
<td>Protein</td>
<td>Carbs</td>
<td>Fat</td>
<td>Fiber</td>
<td>{Extra Nutrient 1}</td>
<td>{Extra Nutrient 2}</td>
</tr>
<tr>
<td>{X} kcal</td>
<td>{X}g</td>
<td>{X}g</td>
<td>{X}g</td>
<td>{X}g</td>
<td>{X}{unit}</td>
<td>{X}{unit}</td>
</tr>
</table>

---
```

   Don't pad with empty/placeholder columns for nutrients that aren't known — only add a column when there's an actual value for it. Insert before the final closing of the page content (after the last existing food block's table, before/replacing the trailing `---` so spacing stays consistent — check current page content first with `notion-fetch` to get the exact tail to anchor the insert).

8. **One food per call.** If Mehdi sends multiple products at once, add them one at a time (one heading block each), but they can all be written in a single Notion update if there's no conflict to resolve.

## Notes

- Don't touch any other page (Protocol, History, etc.) — this skill only writes to the Food Reference page.
- Don't recalculate or touch existing entries unless Mehdi explicitly asks to correct one.
- Keep comments short — one line, same tone as existing entries (e.g. "~20% fat raw mince, standard Moroccan kefta").
