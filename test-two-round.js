#!/usr/bin/env node
/**
 * Two-Round Skill Evaluation
 *
 * Round 1: Static analysis (skill quality, best practices, followability)
 * Round 2: Agent testing (LLM-generated compliance + stress testing)
 *
 * Usage:
 *   node test-two-round.js <path-to-SKILL.md> [--scenarios N]
 *
 * Options:
 *   --scenarios N   Number of LLM-generated scenarios per requirement (default: 2)
 *
 * Provider auto-detection (in priority order):
 *   ANTHROPIC_API_KEY → anthropic
 *   OPENAI_API_KEY    → openai
 *   (none)            → claude-code (uses local Claude subscription)
 */

import { TwoRoundEvaluator } from './src/two-round-evaluator.js';

const args = process.argv.slice(2);

// Parse skill path (first non-flag argument)
const skillPath = args.find(a => !a.startsWith('--')) || '/tmp/skills/SKILL.md';

// Parse --scenarios N
const scenariosIdx = args.indexOf('--scenarios');
const scenariosPerRequirement = scenariosIdx !== -1 ? parseInt(args[scenariosIdx + 1], 10) : 2;

if (isNaN(scenariosPerRequirement) || scenariosPerRequirement < 1) {
  console.error('❌ --scenarios must be a positive integer');
  process.exit(1);
}

// Parse --max-scenarios N
const maxIdx = args.indexOf('--max-scenarios');
const maxScenarios = maxIdx !== -1 ? parseInt(args[maxIdx + 1], 10) : 20;

if (isNaN(maxScenarios) || maxScenarios < 1) {
  console.error('❌ --max-scenarios must be a positive integer');
  process.exit(1);
}

const provider = process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : 'claude-code';
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

async function main() {
  const evaluator = new TwoRoundEvaluator();

  const report = await evaluator.evaluate({
    skillPath,
    provider,
    apiKey,
    outputDir: 'results',
    scenariosPerRequirement,
    maxScenarios
  });

  process.exit(report.overallAssessment.status === 'EXCELLENT' || report.overallAssessment.status === 'GOOD' ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Evaluation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
