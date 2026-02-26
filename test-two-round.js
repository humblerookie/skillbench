#!/usr/bin/env node
/**
 * Test Two-Round Evaluation System
 * 
 * Round 1: Skill Quality (best practices compliance)
 * Round 2: Agent Effectiveness (do agents follow it?)
 */

import { TwoRoundEvaluator } from './src/two-round-evaluator.js';

const skillPath = process.argv[2] || '/tmp/skills/skills/frontend-design/SKILL.md';

async function main() {
  const evaluator = new TwoRoundEvaluator();

  const report = await evaluator.evaluate({
    skillPath,
    provider: 'openclaw', // Use OpenClaw provider (no API key needed)
    outputDir: 'results',
    scenariosPerRequirement: 2
  });

  process.exit(report.overallAssessment.status === 'EXCELLENT' || report.overallAssessment.status === 'GOOD' ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Evaluation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
