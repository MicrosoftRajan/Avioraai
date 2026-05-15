/**
 * Aviora accuracy eval — golden fixtures + optional live API checks.
 *
 * Usage:
 *   npm run eval:accuracy              # heuristic + rule-based debrief (no server)
 *   npm run eval:accuracy -- --ai      # also hit /api/* (dev server must be running)
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import {
  runAiDebriefGroundingEval,
  runAiJdMatchEval,
  runDebriefEval,
  runHeuristicJdMatchEval,
  summarizeChecks,
  type EvalCheck,
} from "../lib/eval/accuracy-eval";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function printReport(checks: EvalCheck[]) {
  const { passed, total, rate, bySuite } = summarizeChecks(checks);

  console.log("\n═══════════════════════════════════════");
  console.log("  Aviora accuracy eval");
  console.log("═══════════════════════════════════════\n");

  for (const [suite, suiteChecks] of bySuite) {
    const suitePassed = suiteChecks.filter((c) => c.pass).length;
    console.log(`▸ ${suite}  (${suitePassed}/${suiteChecks.length})`);
    for (const c of suiteChecks) {
      const mark = c.pass ? "✓" : "✗";
      console.log(`  ${mark} ${c.id}: ${c.detail}`);
    }
    console.log("");
  }

  console.log("───────────────────────────────────────");
  console.log(
    `Overall: ${passed}/${total} checks passed (${rate.toFixed(1)}% accuracy rate)`,
  );
  console.log("───────────────────────────────────────\n");

  if (rate < 100) {
    console.log(
      "Note: This measures fixture expectations, not real-world hiring accuracy.",
    );
    console.log(
      "Add cases in eval/fixtures/ and re-run after prompt or logic changes.\n",
    );
  }
}

async function main() {
  loadEnvLocal();
  const withAi = process.argv.includes("--ai");
  const baseUrl =
    process.env.EVAL_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  const checks: EvalCheck[] = [
    ...runHeuristicJdMatchEval(),
    ...runDebriefEval(),
  ];

  if (withAi) {
    console.log(`AI suites → ${baseUrl} (OPENAI_API_KEY ${process.env.OPENAI_API_KEY ? "set" : "missing"})\n`);
    checks.push(...(await runAiJdMatchEval(baseUrl)));
    checks.push(...(await runAiDebriefGroundingEval(baseUrl)));
  } else {
    console.log("Rule-based suites only. Pass --ai to test live OpenAI routes.\n");
  }

  printReport(checks);
  const { rate } = summarizeChecks(checks);
  process.exit(rate >= 100 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
