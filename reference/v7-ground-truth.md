# LifeOS v7 ground truth (verified 2026-07-16)

Source: `git clone` of `danielmiessler/PAI` (301-redirects to `danielmiessler/LifeOS`), plus a live
v7.0.0 install. Latest tag at capture: **v7.1.1** (2026-07-13, "Install Awareness"). Everything here is
verified from source unless flagged.

## The structural change that matters most

**TELOS went from ~30 separate files to one file with H2 sections.** In v5, targets were files
(`TELOS/MISSION.md`, `TELOS/IDEAL_STATE/HEALTH.md`). In v7, they're H2 headings inside a single
`USER/TELOS/TELOS.md`, addressed by the scanner as `TELOS.md#<slug>`. The old split files still ship as
**legacy back-compat samples** and are superseded on populate.

`GenerateTelosSummary.ts` maps legacy filenames → H2 section names, and the unified file's parser
tolerates three ID forms: `- **M0**: text` (bullet), `### M0:` (H3 heading), and ID-less prose.

## Two skills, two jobs

- **`/lifeos-setup`** — install + **first-ever** onboarding. "Setup ALWAYS runs first; hooks must be
  wired before the interview seeds anything."
- **`/interview`** — recurring, **freshness-driven** review of an already-populated system. In v7 it is
  explicitly *not* a blank-slate intake: "Forbidden when context is populated: generic prompts like
  'What's your mission?' … The files are on disk. Reference them."

**Implication for this kit:** our packet serves the *blank-slate* case (a fresh install with an empty
`USER/`), which is `/lifeos-setup`'s Interview phase — not `/interview`. For a populated install (e.g.
migrating an old PAI v5), the intended on-ramp is the **`/migrate`** skill pointed at the old
`USER/TELOS/`, not a re-interview.

## USER/ tree (v7, abbreviated)

```
USER/
├── DIGITAL_ASSISTANT/DA_IDENTITY.md      (nested; was flat USER/DA_IDENTITY.md in v5)
├── PRINCIPAL/PRINCIPAL_IDENTITY.md       (nested; + RESUME, WRITINGSTYLE, RHETORICALSTYLE moved here)
├── CONFIG/LIFEOS_CONFIG.toml             (TOML now, not PAI_CONFIG.yaml)
├── PROJECTS.md
├── WORK/config.yaml
└── TELOS/
    ├── TELOS.md                          ← single source of truth (H2 sections)
    ├── PRINCIPAL_TELOS.md                (auto-generated)
    ├── LIFEOS_STATE.json                 (Pulse rings)
    ├── CURRENT_STATE/{SNAPSHOT,HEALTH,...}.md
    ├── IDEAL_STATE/{HEALTH,MONEY,FREEDOM,CREATIVE,RELATIONSHIPS,RHYTHMS}.md
    ├── FINANCES/… HEALTH/…               (new subsystems w/ schema.yaml)
    └── {MISSION,GOALS,...}.md            ← legacy samples
```

## Scanner phases (v7 `InterviewScan.ts` REGISTRY)

- **Phase 0 — setup:** DA_IDENTITY, PRINCIPAL_IDENTITY, PULSE.toml voice, **.env credentials**,
  PROJECTS, WORK config. *(This kit excludes Phase 0 secrets from anything touching a consumer chat.)*
- **Phase 1 — foundational:** Mission, Goals, Problems, Strategies, Challenges, Narratives, Sparks,
  Beliefs, Traumas, Wrong, Predictions, Ideas, Models, Frames, Wisdom.
- **Phase 2 — Ideal State:** one unified section.
- **Phase 3 — preferences:** 2036-day-in-the-life, Books, Authors, Bands, Movies, Restaurants, Food,
  Meetups, Civic, Learning Interests, Team, Context Filter.
- **Phase 4:** PRINCIPAL_IDENTITY, Current State, Status.

## Upstream bugs this kit routes around (candidates to file)

1. **Template vs. scanner mismatch.** Shipped `TELOS.md` has ~10 H2 sections; the scanner expects ~30.
   ~20 targets (Beliefs, Models, Frames, Traumas, Predictions, Ideas, Sparks, all of Phase 3) point at
   H2s that don't exist → a fresh install permanently reports phantom gaps. *(Our ingest creates them.)*
2. **Format-A parser bug persists.** Templates ship `- **M0:** (sample)` — colon inside the bold — which
   leaks `**` into parsed text. Format B (`- **M0**:`) parses clean. *(Our dump emits B.)*
3. **Life-shape contamination in the question set.** The scanner's prompts hardcode one person's tastes
   ("Meshuggah," "kickboxing," "drums," "your partner," "Newark/Fremont"). *(Our registry is neutral.)*
4. **Issue #1290 not fixed.** `GenerateTelosSummary.ts` still emits deferred goals as ID-only in the
   summary (it now hard-fails on silent drops rather than dropping silently — partial improvement).

## Platform mechanics for voice delivery (mid-2026, verified + community)

- All three consumer assistants now run voice as a layer over the same text context — the old "voice
  can't see attachments" limitation is largely gone.
- **Most reliable across all three: paste the packet text into the first message of a plain chat,
  confirm comprehension in text, then switch to voice in that same conversation.**
- Ranking: ChatGPT (best for long sessions) > Claude (plain chat, **not** a Project — voice can detach
  from Project knowledge; watch mid-conversation auto-summarization) > Gemini Live (mobile-focused,
  weakest file handling).
- **Untested anywhere:** faithful adherence to a 5–15K-word instruction doc across a full 90-min spoken
  session. Validate empirically (this is what PREFLIGHT + Express length + checkpoints hedge against).
