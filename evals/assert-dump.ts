#!/usr/bin/env bun
/**
 * assert-dump.ts — deterministic validator for a TELOS interview dump.
 *
 * The voice interview produces a structured text "dump" that the person carries
 * back to their assistant. This script checks that dump against the packet's
 * output contract. It is the regression suite: run it on every packet change,
 * against every rehearsal dump, before shipping.
 *
 * Usage:
 *   bun assert-dump.ts <dump.txt>              validate one dump (hard-fails on contract breaks)
 *   bun assert-dump.ts <dump.txt> --transcript <t.txt>   also scan the interviewer transcript
 *   bun assert-dump.ts <dump.txt> --json       machine-readable result
 *
 * Exit code 0 = all hard assertions pass. Non-zero = contract broken.
 */

import { readFileSync } from "fs";

// ── The contract ────────────────────────────────────────────────────────────

// Sections that carry ID'd entries, and the prefix each must use.
const ID_SECTIONS: Record<string, string> = {
  MISSION: "M",
  GOALS: "G",
  PROBLEMS: "P",
  CHALLENGES: "C",
  "HOW YOU OPERATE": "S",
  "HOW YOU TELL YOUR STORY": "N",
};
// Sections captured as prose (no ID requirement). WHAT YOU BELIEVE mixes B/MO/FR
// so it's treated as free-form and not prefix-checked.
const PROSE_SECTIONS = new Set([
  "YOUR ASSISTANT",
  "WHO YOU ARE",
  "THE LIFE YOU'RE AIMING FOR",
  "RIGHT NOW",
  "WHAT YOU BELIEVE",
  "HARD-WON WISDOM",
  "CREATIVE SPARKS",
  "FORMATIVE EXPERIENCES",
  "WHERE YOU'VE BEEN WRONG",
  "PREDICTIONS & IDEAS",
  "YOUR TASTES",
  "NOTES",
]);
const ALLOWED_SECTIONS = new Set([...Object.keys(ID_SECTIONS), ...PROSE_SECTIONS]);

// Express-tier sections that must be present for a dump to be "usable".
const EXPRESS_REQUIRED = [
  "YOUR ASSISTANT",
  "WHO YOU ARE",
  "MISSION",
  "GOALS",
  "PROBLEMS",
  "CHALLENGES",
  "THE LIFE YOU'RE AIMING FOR",
  "RIGHT NOW",
];

// Contamination markers: strings that would only appear if the interviewer
// leaked another person's life-shape into the questions (Miessler's template or
// Lou's own life). Reported as WARNINGS — a persona could coincidentally mention
// one — but any hit is worth a human look.
const CONTAMINATION = [
  "meshuggah", "boris brejcha", "beyond tool", "interstellar", "pulp fiction",
  "kickboxing", "newark", "fremont", "your partner", "daughters",
  "roam research", "vyvanse", "east nashville", "code4rena",
];

// ── Parsing ─────────────────────────────────────────────────────────────────

type Section = { name: string; body: string };

function parseSections(text: string): Section[] {
  const out: Section[] = [];
  const re = /^===\s*SECTION:\s*(.+?)\s*===\s*$/gim;
  const marks: { name: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) marks.push({ name: m[1].trim(), start: re.lastIndex, end: text.length });
  for (let i = 0; i < marks.length; i++) {
    marks[i].end = i + 1 < marks.length ? text.indexOf("=== SECTION:", marks[i].start) : text.length;
    if (marks[i].end === -1) marks[i].end = text.length;
    out.push({ name: marks[i].name, body: text.slice(marks[i].start, marks[i].end) });
  }
  return out;
}

// ── Checks ──────────────────────────────────────────────────────────────────

type Finding = { level: "FAIL" | "WARN"; msg: string };

function validate(text: string, transcript?: string): Finding[] {
  const f: Finding[] = [];
  const fail = (msg: string) => f.push({ level: "FAIL", msg });
  const warn = (msg: string) => f.push({ level: "WARN", msg });

  // Envelope
  if (!/===\s*LIFEOS TELOS INTERVIEW DUMP/i.test(text)) fail("Missing dump header line (=== LIFEOS TELOS INTERVIEW DUMP …).");
  if (!/^===\s*END\s*===\s*$/im.test(text)) fail("Missing terminal '=== END ===' line.");
  if (/\{\{.*?\}\}/.test(text)) fail(`Unfilled template token(s) leaked: ${(text.match(/\{\{.*?\}\}/g) || []).slice(0, 5).join(", ")}`);

  const sections = parseSections(text);
  if (sections.length === 0) { fail("No '=== SECTION: … ===' blocks found."); return f; }

  const names = sections.map((s) => s.name.toUpperCase());
  for (const s of sections) {
    if (!ALLOWED_SECTIONS.has(s.name.toUpperCase())) warn(`Unknown section name: "${s.name}" (not in the contract's section list).`);
  }
  for (const req of EXPRESS_REQUIRED) {
    if (!names.includes(req)) fail(`Missing required Express section: "${req}".`);
  }

  // ID formatting + prefixes
  for (const s of sections) {
    const upper = s.name.toUpperCase();
    const prefix = ID_SECTIONS[upper];
    // Format-A leak: "- **M0:** text" (colon INSIDE the bold). Any section.
    const formatA = [...s.body.matchAll(/^\s*-\s*\*\*[A-Za-z]+\d+:\*\*/gm)];
    for (const a of formatA) fail(`Format-A ID in "${s.name}" ("${a[0].trim()}") — colon must be OUTSIDE the bold: "- **M0**: text".`);

    if (!prefix) continue; // prose section — no ID requirement
    const idLines = [...s.body.matchAll(/^\s*-\s*\*\*([A-Za-z]+)(\d+)\*\*\s*:/gm)];
    if (idLines.length === 0) { warn(`ID section "${s.name}" has no "- **${prefix}0**: …" entries (was it captured as prose?).`); continue; }
    for (const line of idLines) {
      if (line[1].toUpperCase() !== prefix) fail(`Wrong ID prefix in "${s.name}": got "${line[1]}${line[2]}", expected "${prefix}${line[2]}".`);
    }
  }

  // Stray double-asterisk leakage outside bold IDs (rough heuristic)
  const orphanStars = (text.match(/\*\*/g) || []).length;
  if (orphanStars % 2 !== 0) warn("Odd number of '**' markers — possible unbalanced bold leaking into text.");

  // Contamination scan (dump + optional transcript)
  const hay = (text + "\n" + (transcript || "")).toLowerCase();
  for (const c of CONTAMINATION) {
    if (hay.includes(c)) warn(`Contamination marker present: "${c}" — check the interviewer didn't inject another person's life-shape.`);
  }

  return f;
}

// ── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dumpPath = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--transcript");
if (!dumpPath) { console.error("usage: bun assert-dump.ts <dump.txt> [--transcript <t.txt>] [--json]"); process.exit(2); }
const tIdx = args.indexOf("--transcript");
const transcript = tIdx !== -1 ? readFileSync(args[tIdx + 1], "utf-8") : undefined;
const text = readFileSync(dumpPath, "utf-8");

const findings = validate(text, transcript);
const fails = findings.filter((x) => x.level === "FAIL");
const warns = findings.filter((x) => x.level === "WARN");

if (args.includes("--json")) {
  console.log(JSON.stringify({ pass: fails.length === 0, fails, warns }, null, 2));
} else {
  console.log(`\n── assert-dump: ${dumpPath} ──`);
  if (findings.length === 0) console.log("✅ clean — all hard assertions pass, no warnings.");
  for (const x of fails) console.log(`❌ FAIL  ${x.msg}`);
  for (const x of warns) console.log(`⚠️  WARN  ${x.msg}`);
  console.log(`\n${fails.length === 0 ? "✅ PASS" : "❌ FAIL"} — ${fails.length} failure(s), ${warns.length} warning(s).\n`);
}
process.exit(fails.length === 0 ? 0 : 1);
