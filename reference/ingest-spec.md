# Ingest spec — turning an interview dump into a LifeOS v7 TELOS

This is the **terminal-side** half of the contract. The voice interview produces a version-neutral dump;
this document tells the receiving assistant (in the LifeOS/PAI terminal) exactly how to write it onto
disk. The person being interviewed never reads this.

The dump itself carries a compact version of these instructions in its header, so ingest works even if
this file isn't present. This is the fuller reference.

## Target (verified against LifeOS v7.1.1)

- **Single source of truth:** `~/.claude/LIFEOS/USER/TELOS/TELOS.md` — one file, sections are H2 (`## `)
  headings. The per-file `MISSION.md`, `GOALS.md`, … in that folder are **legacy back-compat samples**;
  do not write there.
- **Identity files are separate and nested:**
  - `~/.claude/LIFEOS/USER/DIGITAL_ASSISTANT/DA_IDENTITY.md`
  - `~/.claude/LIFEOS/USER/PRINCIPAL/PRINCIPAL_IDENTITY.md`
- **Snapshot:** `~/.claude/LIFEOS/USER/TELOS/CURRENT_STATE/SNAPSHOT.md`
- (PAI v5 target instead: flat files `USER/TELOS/MISSION.md`, `USER/TELOS/IDEAL_STATE/HEALTH.md`, etc.,
  and flat `USER/PRINCIPAL_IDENTITY.md` / `USER/DA_IDENTITY.md`.)

## Section → destination map

| Dump `=== SECTION ===` | Destination | ID prefix |
|---|---|---|
| YOUR ASSISTANT | `DIGITAL_ASSISTANT/DA_IDENTITY.md` (name, color, personality) | — |
| WHO YOU ARE | `PRINCIPAL/PRINCIPAL_IDENTITY.md` (name, location, role, focus) | — |
| MISSION | `TELOS.md` `## Mission` | `M` |
| GOALS | `TELOS.md` `## GOALS` | `G` |
| PROBLEMS | `TELOS.md` `## Problems` | `P` |
| CHALLENGES | `TELOS.md` `## Challenges` | `C` |
| THE LIFE YOU'RE AIMING FOR | `TELOS.md` `## Ideal State` (group by dimension; keep prose) | — |
| RIGHT NOW | `TELOS.md` `## Current State` + `CURRENT_STATE/SNAPSHOT.md` | — |
| HOW YOU OPERATE | `TELOS.md` `## Strategies` | `S` |
| HOW YOU TELL YOUR STORY | `TELOS.md` `## Narratives` | `N` |
| WHAT YOU BELIEVE | `TELOS.md` `## Beliefs` (`B`), `## Models` (`MO`), `## Frames` (`FR`) — create H2s | mixed |
| HARD-WON WISDOM | `TELOS.md` `## Wisdom` | — |
| CREATIVE SPARKS | `TELOS.md` `## Sparks` (create H2) | — |
| FORMATIVE EXPERIENCES | `TELOS.md` `## Traumas` (create H2) — private, handle gently | `TR` |
| WHERE YOU'VE BEEN WRONG | `TELOS.md` `## Wrong` (create H2) | — |
| PREDICTIONS & IDEAS | `TELOS.md` `## Predictions` + `## Ideas` (create H2s) | — |
| YOUR TASTES | `TELOS.md` `## Books` / `## Authors` / `## Bands` / `## Movies` / `## Food` / `## Learning Interests` (create as needed) | — |
| NOTES | not written to TELOS — surface as follow-ups / cross-refs (contacts, etc.) | — |

## Rules

1. **Back up first.** Copy `TELOS.md` to a dated backup before editing (the LifeOS Interview/Telos skill
   does this; if writing by hand, do it yourself).
2. **ID form: Format B.** Write `- **M0**: text` — the `**` closes *before* the colon. Never `- **M0:**
   text` (Format A leaks `**` into the parsed text; it's a known upstream template bug — don't copy it).
   Note: the unified `TELOS.md` also accepts H3 headings (`### M0:`) and ID-less prose; the tolerant
   parser in `GenerateTelosSummary.ts` reads all three. Format-B bullets are the safest choice.
3. **Never renumber existing entries.** Append new points at the next sequential ID.
4. **Create missing H2 sections.** The shipped `TELOS.md` template has only ~10 H2s; the scanner expects
   ~30. Any section in the map above that lacks an H2 in the file should be created (a `## Name` heading
   plus the entries). This makes the install *more* complete than stock.
5. **Ideal State stays prose, grouped by dimension.** v7 has no `type: target|north-star` convention —
   don't invent one. Write the dimensions (health, money, freedom, relationships, creative) as labeled
   prose under `## Ideal State`. (If populating the per-dimension `IDEAL_STATE/*.md` files as well, those
   use a `## Targets` list of plain lines — Pulse reads them for its rings.)
6. **Secrets are out of scope.** The dump never contains credentials, API keys, or Pulse voice config by
   design. Those are Phase-0 setup done separately in the terminal — do not solicit them from this file.
7. **After writing:** bump per-section freshness, regenerate the TELOS summary, reload Pulse:
   ```bash
   bun ~/.claude/LIFEOS/TOOLS/TelosFreshness.ts --bump <slug>     # per edited section
   bun ~/.claude/LIFEOS/TOOLS/GenerateTelosSummary.ts             # regenerate PRINCIPAL_TELOS.md
   curl -s -X POST http://localhost:31337/reload                  # Pulse (60s freshness cache)
   ```
   If unsure of the exact commands for the installed version, say so and ask — don't guess at a write
   that touches constitutional files.

## Frontmatter (v7)

`TELOS.md` and templates carry:
```yaml
---
provenance: template            # change to "interview" once populated
last_updated: <ISO date>
last_updated_by: <user>
convention: pai-freshness-v1
---
```
Preserve the frontmatter; update `last_updated` / `last_updated_by` on write (or let `TelosFreshness.ts`
do it).
