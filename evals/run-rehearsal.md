# Running the rehearsal (Layer 1)

Automated proof that the packet produces a contract-valid dump, for personas deliberately unlike any
real user. This is the regression suite — run it whenever `INTERVIEW-PACKET.md` changes.

## What it does

For each persona in `personas/personas.md`, an agent simulates a full Express-tier interview (playing
both the packet-following interviewer and the persona), then produces the dump. The dump is validated by
`assert-dump.ts`. A neutral packet yields a clean, contamination-free dump for every persona; if someone
else's life-shape leaks into a persona's dump, the questions weren't neutral.

## Run it (from a Claude Code / LifeOS session)

Spawn one agent per persona with a prompt like:

> Read `INTERVIEW-PACKET.md` (follow it as the interviewer) and `evals/personas/personas.md` (persona
> `<NAME>`). Simulate a realistic Express-tier interview — interviewer follows the packet exactly;
> subject answers ONLY from the brief, may say "pass", never invents interests outside the brief. Start
> with PREFLIGHT, then interview all Express sections. Produce THE DUMP per the packet's output contract.
> Write the transcript to `evals/out/<name>-transcript.txt` and the dump alone to
> `evals/out/<name>-dump.txt`. Report friction as a critical tester.

Then validate every dump:

```bash
for d in evals/out/*-dump.txt; do
  bun evals/assert-dump.ts "$d" --transcript "${d%-dump.txt}-transcript.txt"
done
```

## Pass criteria

- `assert-dump.ts` exits 0 for every persona (no FAIL findings).
- No contamination WARN that traces to the interviewer injecting another person's life-shape (a persona
  coincidentally naming something is fine; the interviewer *suggesting* it is not — check the transcript).
- Each tester report confirms neutral phrasing held (no assumed partner/kids/job/instrument/city).

## Limits (be honest)

This proves the **contract and the neutrality**, not the **experience**. Self-play interviews are
cleaner than reality — the interviewer never mishears, never gets a rambling non-answer it can't parse.
Only a real human on a real platform (Layer 2) proves that voice mode sees the pasted packet and that the
cadence is bearable. Do Layer 2 before any real person uses the kit.
