# Upstream issue drafts (for danielmiessler/LifeOS)

Three verified onboarding bugs found while building this kit against LifeOS v7.1.1. Drafted ready to
post; **not yet filed** — posting under a personal GitHub identity is the maintainer's call. Each is
independently reproducible from a fresh clone.

---

## Issue 1 — Fresh install reports ~20 phantom TELOS gaps (template vs. scanner mismatch)

**Version:** v7.1.1

**Problem:** On a fresh install, `InterviewScan.ts`'s REGISTRY expects ~30 TELOS sections (Mission,
Goals, Beliefs, Models, Frames, Traumas, Predictions, Ideas, Sparks, and all of Phase 3), addressed as
`TELOS.md#<slug>`. But the shipped `USER/TELOS/TELOS.md` template ships only ~10 H2 sections (Current
State, Ideal State, Mission, Problems, GOALS, Challenges, Strategies, Projects, Narratives, Wisdom). The
~20 sections without a matching H2 score 0 / "file does not exist," so a brand-new install permanently
reports phantom gaps for sections the template never created.

**Repro:** `grep '^## ' USER/TELOS/TELOS.md` (10 headings) vs. the REGISTRY section list (~30).

**Fix options:** (a) ship a `TELOS.md` template containing every H2 the scanner references (each with a
`- **X0**: (sample)` line), or (b) have the setup skill create missing H2s on first populate.

---

## Issue 2 — TELOS template ships the Format-A bold-bullet that the parser mis-reads

**Version:** v7.1.1

**Problem:** `TELOS.md` (and legacy split templates) write IDs as `- **M0:** (sample)` — closing `**`
*after* the colon. `GenerateTelosSummary.ts`'s item regex (`/^-\s+\*?\*?(\w+)\*?\*?:\s*(.+)/`) then
captures a leading `**` into the entry text. Writing `- **M0**: text` (closing `**` before the colon)
parses cleanly. The template teaches the broken form, so hand-authored and DA-authored entries tend to
copy it.

**Fix:** change template samples to `- **M0**: text` (Format B). One-line change per template; removes a
class of parse artifacts from every downstream summary.

---

## Issue 3 — The interview question set hardcodes one person's life-shape

**Version:** v7.1.1

**Problem:** `InterviewScan.ts` REGISTRY prompts presuppose the template author's tastes and life
structure: "Beyond Tool, Meshuggah, Boris Brejcha…", "Sci-fi beyond Interstellar…", "Beyond
meditation / tennis / kickboxing…", "Drums — lessons or self-taught?", "Spanish refresh — active or
dormant?", "Dishes your partner makes you love?" A new user is asked about a partner, instruments,
languages, and bands that may not apply — which both feels off and biases their answers toward a
stranger's frame. (The `RELATIONSHIPS` prompts also assume a partner and daughters.)

**Fix:** rewrite prompts life-shape-neutral — ask "who are the people whose presence you'd protect
first?" instead of assuming a partner; "what do you make or want to make?" instead of naming instruments;
"artists that shaped you?" instead of naming bands. A neutral registry is in
[loudoguno/telos-interview](https://github.com/loudoguno/telos-interview) (`INTERVIEW-PACKET.md`) if
useful as a reference — happy to open a PR.

---

*Also noted but not filed: Issue #1290 (deferred goals rendered ID-only in the generated summary) is not
fixed in v7.1.1, though the generator now hard-fails on silent section drops rather than dropping
quietly.*
