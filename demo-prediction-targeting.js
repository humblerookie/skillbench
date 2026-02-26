#!/usr/bin/env node
/**
 * Demo: Prediction-Targeted Testing
 * 
 * Shows how Round 1 predictions automatically generate Round 2 test scenarios
 */

import { PredictionTargetedTesting } from './src/prediction-targeted-testing.js';
import fs from 'fs';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Prediction-Targeted Testing Demo                     ║');
  console.log('║     Round 1 predictions → Round 2 targeted tests         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Load Round 1 report (from previous run)
  const round1Report = JSON.parse(
    fs.readFileSync('results/skill/round1-report.json', 'utf-8')
  );

  // Load skill content
  const skillContent = fs.readFileSync('/tmp/skills/skills/frontend-design/SKILL.md', 'utf-8');

  console.log('📊 Round 1 Summary:\n');
  console.log(`  Overall Score: ${round1Report.summary.overallRound1Score}/10`);
  console.log(`  Followability: ${round1Report.summary.followabilityScore}/100`);
  console.log(`  Predicted Issues: ${round1Report.summary.totalIssues}`);
  console.log(`  High-Risk Predictions: ${round1Report.phases['1c_followability'].predictions.filter(p => p.probability >= 0.6).length}\n`);

  // Show predictions
  console.log('🎯 High-Risk Predictions (≥60% probability):\n');
  const highRiskPredictions = round1Report.phases['1c_followability'].predictions
    .filter(p => p.probability >= 0.6)
    .slice(0, 5);

  highRiskPredictions.forEach((pred, idx) => {
    console.log(`${idx + 1}. ${pred.checkName}`);
    console.log(`   Probability: ${(pred.probability * 100).toFixed(0)}%`);
    console.log(`   Issue: ${pred.reason}`);
    console.log(`   Failure Mode: ${pred.failureMode}\n`);
  });

  // Generate targeted test scenarios
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Generating Targeted Test Scenarios');
  console.log('─────────────────────────────────────────────────────────────\n');

  const tester = new PredictionTargetedTesting();
  const targetedScenarios = tester.generateTargetedScenarios(round1Report, skillContent);

  console.log(`✅ Generated ${targetedScenarios.length} targeted test scenarios\n`);

  // Show generated scenarios
  targetedScenarios.forEach((scenario, idx) => {
    console.log(`╭─ Targeted Test ${idx + 1}: ${scenario.id}`);
    console.log(`│`);
    console.log(`│  🎯 Targets: ${scenario.targetedPrediction.checkName}`);
    console.log(`│  📊 Predicted Failure: ${(scenario.targetedPrediction.probability * 100).toFixed(0)}%`);
    console.log(`│`);
    console.log(`│  📝 User Prompt:`);
    console.log(`│     "${scenario.userPrompt}"`);
    console.log(`│`);
    console.log(`│  ✅ Expected Behavior:`);
    console.log(`│     ${scenario.expectedBehavior}`);
    console.log(`│`);
    console.log(`│  ❌ Predicted Failure:`);
    console.log(`│     ${scenario.predictedFailure}`);
    console.log(`│`);
    console.log(`│  🔍 Validation Criteria:`);
    scenario.validationCriteria.forEach(criteria => {
      console.log(`│     • ${criteria}`);
    });
    console.log(`╰─────────────────────────────────────────────────────────\n`);
  });

  // Show mixed test suite
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Recommended Round 2 Test Suite');
  console.log('─────────────────────────────────────────────────────────────\n');

  const normalScenarios = [
    { id: 'NORMAL-1', name: 'Architect Portfolio (Baseline)' },
    { id: 'NORMAL-2', name: 'Crypto Dashboard (Baseline)' },
    { id: 'VALIDATION-1', name: 'Intentional Violation (Evaluator Check)' }
  ];

  const mixedSuite = tester.mixScenarios(targetedScenarios, normalScenarios);

  console.log('Test Suite (Mixed - Targeted + Normal):\n');
  mixedSuite.forEach((scenario, idx) => {
    const type = scenario.type === 'prediction-targeted' ? '🎯' : '📋';
    const name = scenario.name || scenario.id;
    console.log(`  ${idx + 1}. ${type} ${name}`);
    if (scenario.type === 'prediction-targeted') {
      console.log(`     → Tests: ${scenario.targetedPrediction.checkName} (${(scenario.targetedPrediction.probability * 100).toFixed(0)}% failure predicted)`);
    }
  });

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('  What This Achieves');
  console.log('─────────────────────────────────────────────────────────────\n');

  console.log('✅ Validates Predictions:');
  console.log('   Targeted tests prove whether Round 1 was accurate\n');

  console.log('✅ Provides Evidence:');
  console.log('   Not just "might fail" - actual test shows it DOES fail\n');

  console.log('✅ Saves Cost:');
  console.log(`   ${targetedScenarios.length} targeted + 3 normal = ${targetedScenarios.length + 3} tests total`);
  console.log(`   vs. 10+ blind tests to maybe catch issues\n`);

  console.log('✅ Prioritizes Fixes:');
  console.log('   Fix validated high-probability issues first\n');

  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Next Steps');
  console.log('─────────────────────────────────────────────────────────────\n');

  console.log('1. Run these targeted tests (Round 2)');
  console.log('2. Compare predictions vs actual results');
  console.log('3. Generate validation report (accuracy %)');
  console.log('4. Fix validated high-priority issues');
  console.log('5. Re-run to verify fixes\n');

  console.log('💡 This is already integrated into test-two-round.js!\n');
  console.log('   Just run: node test-two-round.js skill.md\n');
}

main().catch(error => {
  console.error('\n❌ Demo failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
