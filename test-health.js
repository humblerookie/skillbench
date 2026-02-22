#!/usr/bin/env node
/**
 * Evaluator Health Check - Test all safeguards
 */

import { SkillEvaluatorV2 } from './src/evaluator-v2.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable required');
  console.error('   Export it with: export ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       Skill Evaluator V2 - Health Check                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const evaluator = new SkillEvaluatorV2(ANTHROPIC_API_KEY, {
    validateEvidence: true,
    runCalibration: true,
    acceptableVariance: 1.0
  });

  // Run full diagnostic suite
  const health = await evaluator.runDiagnostics();

  // Print detailed results
  console.log('\n📋 Detailed Results:\n');

  // Consistency
  console.log('1. Consistency Test:');
  console.log(`   Status: ${health.tests.consistency.status}`);
  console.log(`   Variance: ${health.tests.consistency.variance} (threshold: ${health.tests.consistency.threshold})`);
  console.log(`   Scores: [${health.tests.consistency.scores.join(', ')}]`);
  
  if (health.tests.consistency.status !== 'PASS') {
    console.log('   ⚠️  WARNING: Evaluator producing inconsistent scores!');
  }
  console.log('');

  // Calibration
  console.log('2. Calibration Test:');
  console.log(`   Status: ${health.tests.calibration.status}`);
  console.log(`   Pass rate: ${health.tests.calibration.summary.passRate}`);
  console.log(`   Avg drift: ${health.tests.calibration.summary.avgDrift}`);
  console.log(`   Cases: ${health.tests.calibration.summary.passed}/${health.tests.calibration.dataset.cases} passed`);
  
  if (health.tests.calibration.status !== 'PASS') {
    console.log('   ⚠️  Failed cases:');
    health.tests.calibration.failedCases.forEach(fc => {
      console.log(`      ${fc.id}: expected ${fc.expected}, got ${fc.actual} (drift: ${fc.drift})`);
    });
  }
  console.log('');

  // Evidence validation
  console.log('3. Evidence Validation:');
  console.log(`   Status: ${health.tests.evidenceValidation.status}`);
  console.log(`   Quality score: ${health.tests.evidenceValidation.qualityScore}/10`);
  console.log(`   Issues detected: ${health.tests.evidenceValidation.issuesDetected}`);
  console.log(`   Warnings: ${health.tests.evidenceValidation.warningsDetected}`);
  console.log('');

  // Drift detection
  console.log('4. Drift Detection:');
  console.log(`   Status: ${health.tests.drift.status}`);
  if (health.tests.drift.status !== 'NO_BASELINE') {
    console.log(`   Avg drift: ${health.tests.drift.avgDrift}`);
    console.log(`   Max drift: ${health.tests.drift.maxDrift}`);
    
    if (health.tests.drift.drifts && health.tests.drift.drifts.length > 0) {
      console.log('   Top drifters:');
      health.tests.drift.drifts.slice(0, 3).forEach(d => {
        console.log(`      ${d.id}: ${d.baselineScore} → ${d.currentScore} (drift: ${d.drift})`);
      });
    }
  }
  console.log('');

  // Overall assessment
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  OVERALL STATUS: ${health.overallStatus}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (health.overallStatus === 'HEALTHY') {
    console.log('✅ All systems operational. Evaluator is reliable.\n');
    console.log('Recommendations:');
    console.log('  • Run this health check weekly');
    console.log('  • Review calibration dataset monthly');
    console.log('  • Track drift over time');
    console.log('');
  } else {
    console.log('⚠️  HEALTH ISSUES DETECTED!\n');
    console.log('Action required:');
    
    if (health.tests.consistency.status !== 'PASS') {
      console.log('  • Fix consistency: Reduce temperature, increase retries');
    }
    
    if (health.tests.calibration.status !== 'PASS') {
      console.log('  • Fix calibration: Review failed cases, update rubric');
    }
    
    if (health.tests.evidenceValidation.qualityScore < 7) {
      console.log('  • Fix evidence validation: Stricter quote matching');
    }
    
    if (health.tests.drift.status === 'SIGNIFICANT_DRIFT') {
      console.log('  • Fix drift: Recalibrate or roll back rubric changes');
    }
    
    console.log('');
  }

  // Save report
  const fs = await import('fs');
  fs.writeFileSync(
    'health-report.json',
    JSON.stringify(health, null, 2)
  );
  console.log('📄 Full report saved: health-report.json\n');

  process.exit(health.overallStatus === 'HEALTHY' ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
