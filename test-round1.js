#!/usr/bin/env node
/**
 * Round 1 Evaluation - Static Analysis
 * 
 * Fast pre-flight check (no agent testing):
 * - 1a. Skill Quality
 * - 1b. Best Practices (Anthropic guidelines)
 * - 1c. Followability (predictive)
 * 
 * Cost: ~$0.02 (1 API call)
 * Time: 5-10 seconds
 */

import { Round1Evaluator } from './src/round1-evaluator.js';
import { ProviderFactory } from './src/providers/provider-factory.js';
import fs from 'fs';

const skillPath = process.argv[2];

if (!skillPath) {
  console.error('Usage: node test-round1.js <path-to-SKILL.md>');
  console.error('');
  console.error('Example:');
  console.error('  node test-round1.js /tmp/skills/skills/frontend-design/SKILL.md');
  process.exit(1);
}

async function main() {
  // Read skill
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  const skillName = skillPath.split('/').pop().replace(/\.md$/, '').replace('SKILL', 'skill');

  console.log(`\n📄 Skill: ${skillName}`);
  console.log(`📂 Path: ${skillPath}`);
  console.log(`💰 Cost: ~$0.02 (1 API call)`);
  console.log(`⏱️  Time: 5-10 seconds\n`);

  // Initialize provider (OpenClaw by default)
  const provider = ProviderFactory.autoDetect();
  
  // Run Round 1
  const evaluator = new Round1Evaluator(provider);
  const report = await evaluator.evaluate(skillContent, skillName);

  // Save report
  const outputDir = `results/${skillName}`;
  fs.mkdirSync(outputDir, { recursive: true});
  
  const outputFile = `${outputDir}/round1-report.json`;
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

  console.log(`💾 Report saved: ${outputFile}\n`);

  // Final recommendation
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Next Steps');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (report.summary.proceedToRound2) {
    if (report.summary.criticalIssues === 0) {
      console.log('✅ Ready for Round 2 (Agent Testing)');
      console.log('   Run: node test-two-round.js ' + skillPath);
    } else {
      console.log('⚠️  Can proceed to Round 2, but recommend fixing issues first');
      console.log('   Critical issues: ' + report.summary.criticalIssues);
      console.log('');
      console.log('   Fix issues, then re-run:');
      console.log('   node test-round1.js ' + skillPath);
    }
  } else {
    console.log('❌ Not ready for Round 2');
    console.log('   Fix critical issues from Round 1 first');
    console.log('');
    console.log('   Top recommendations:');
    report.recommendations.slice(0, 3).forEach(rec => {
      console.log('   • ' + rec);
    });
    console.log('');
    console.log('   After fixes, re-run:');
    console.log('   node test-round1.js ' + skillPath);
  }

  console.log('\n📚 See TWO-ROUND-SYSTEM.md for full documentation\n');

  process.exit(report.summary.proceedToRound2 ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Round 1 evaluation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
