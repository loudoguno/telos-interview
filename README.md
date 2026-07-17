# TELOS Voice Interview — onboarding kit for LifeOS / PAI

Talk to a voice AI for 25–90 minutes; walk away with a block of text that teaches your personal AI who
you are. A portable, platform-agnostic replacement for typing out your [LifeOS](https://github.com/danielmiessler/LifeOS)
/ PAI onboarding by hand.

**Two deliverables, both plain markdown:**

| File | For | What it is |
|---|---|---|
| **[`INTERVIEW-PACKET.md`](./INTERVIEW-PACKET.md)** | the person being interviewed | Paste it into a voice AI, turn on voice, get interviewed, get a structured dump back. |
| **[`WELCOME.md`](./WELCOME.md)** | a brand-new installer | Plain-English "what is this and what do I do first" guide for the first hour. |

## Quick start (for a new LifeOS/PAI user)

1. Read `WELCOME.md`.
2. Open a fresh chat (ChatGPT / Claude / Gemini), **paste the text of `INTERVIEW-PACKET.md`**, turn on
   voice, say **"preflight."** If it replies with the codeword `TELOS-READY`, say **"begin."**
3. Talk for ~25 minutes. Say **"give me the dump"** at the end and copy the output.
4. In your terminal, paste it to your assistant: *"here's my completed onboarding interview, read it in."*

## Why this exists

The stock onboarding is a typed, terminal-bound `/interview` that walks a scanner
(`InterviewScan.ts`). Three problems make it a poor fit for onboarding real people — especially
non-technical family:

1. **Typing is the wrong medium for identity work.** Spoken answers are richer, more honest, and lower
   effort. Voice cadence surfaces the tangents where the real material lives.
2. **The stock question set is contaminated with one person's life.** The upstream scanner literally
   asks about "Meshuggah," "kickboxing," "drums," and "your partner." A stranger's questions produce a
   stranger's answers. This kit rewrites every question **life-shape-neutral** — no assumed partner,
   kids, job, city, instrument, or hobby.
3. **It's terminal-only.** A non-technical person can't run it. This kit runs anywhere they can already
   hold a voice conversation.

## Design principles

- **Split the contract.** The voice side emits a clean, version-neutral intermediate (delimited
  `=== SECTION ===` blocks with ID'd prose). The terminal side owns all the schema ugliness (heading
  vs. list per section, ID format, backups, freshness stamps). The person never meets a regex.
- **PREFLIGHT before you invest.** The catastrophic failure is talking for 90 minutes into a model that
  never read the packet. A 60-second codeword self-test (`TELOS-READY`) catches it in minute one.
- **Tiered depth.** Express (~25 min) is enough to make a DA genuinely know you. Standard and Deep are
  opt-in, later, after the payoff is felt.
- **Self-executing output.** The dump carries its own ingest header — mapping table, ID rules, gotchas —
  so the receiving assistant knows what to do without any matching skill installed. Survives version
  bumps.
- **Privacy is a section, not a footnote.** The interview can touch money, health, and hard
  experiences. "Pass" is always valid; secrets never enter the chat; the terminal half never sees a
  consumer cloud.

## Repo layout

```
INTERVIEW-PACKET.md     the packet the person pastes into a voice AI       (deliverable)
WELCOME.md              first-hour onboarding guide                        (deliverable)
reference/
  ingest-spec.md        terminal-side contract: how a dump maps onto v7    (for the receiving DA)
  v7-ground-truth.md    verified LifeOS v7.1.1 schema notes + upstream bugs
evals/
  assert-dump.ts        deterministic validator for a dump (the regression suite)
  personas/personas.md  synthetic principals for automated rehearsal
  run-rehearsal.md      how to run the two-agent rehearsal
  out/                  rehearsal transcripts + dumps (gitignored)
```

## Proving it works

Two layers, honestly scoped:

- **Layer 1 — automated (in-repo):** simulate the interview against synthetic personas deliberately
  unlike any real user, run the real dump through `evals/assert-dump.ts`. This proves the *contract*:
  correct structure, Format-B IDs, no template-token leaks, no contamination, all Express sections
  present. Runs on every packet edit. See [`evals/run-rehearsal.md`](./evals/run-rehearsal.md).
- **Layer 2 — human (unavoidable):** an actual person on an actual platform running PREFLIGHT. No agent
  can confirm ChatGPT's voice model truly sees a pasted packet, or that the interviewer's cadence is
  bearable in your ear. This is the smoke test before any family member uses it.

Layer 1 proves the contract; only Layer 2 proves the experience.

## Compatibility

Built and verified against **LifeOS v7.1.1** (unified `USER/TELOS/TELOS.md`, H2 sections). The version-
specific mapping lives only in the dump's ingest header and in `reference/ingest-spec.md`; the interview
questions themselves are version-neutral. Also works for PAI v5/v6 with a different ingest header.

## Status

v1 — Express tier + eval harness. See issues for Standard/Deep expansion and upstream bug reports.

---
Part of one person's LifeOS/PAI work; shared because the onboarding-contamination and template-vs-scanner
issues are upstream's, and fixing them in the open helps anyone installing LifeOS.
