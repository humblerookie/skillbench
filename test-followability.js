#!/usr/bin/env node
/**
 * Followability Analysis Demo
 * 
 * Predicts where agents will fail BEFORE running tests
 */

import { FollowabilityAnalyzer } from './src/followability-analyzer.js';
import fs from 'fs';

const skillPath = process.argv[2] || '/tmp/skills/skills/frontend-design/SKILL.md';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      Followability Analysis (Predictive)                 ║');
  console.log('║      Find failure points BEFORE testing                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Read skill
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  const skillName = skillPath.split('/').pop().replace(/\.md$/, '').replace('SKILL', 'skill');

  console.log(`📄 Skill: ${skillName}`);
  console.log(`📂 Path: ${skillPath}\n`);

  // Analyze
  const analyzer = new FollowabilityAnalyzer();
  const analysis = analyzer.analyze(skillContent, skillName);

  // Print score
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Followability Score: ${analysis.score}/100`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Print summary
  console.log('📊 Summary:');
  console.log(`   High-risk failures predicted: ${analysis.summary.predictedFailurePoints}`);
  console.log(`   Medium-risk warnings: ${analysis.summary.warnings}`);
  console.log(`   Total issues: ${analysis.summary.totalIssues}\n`);

  if (analysis.summary.mostLikelyFailures.length > 0) {
    console.log('⚠️  Most Likely to Be Missed:');
    analysis.summary.mostLikelyFailures.slice(0, 5).forEach(failure => {
      console.log(`   - ${failure}`);
    });
    console.log('');
  }

  // Print by check
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Analysis by Check');
  console.log('═══════════════════════════════════════════════════════════\n');

  analysis.checks.forEach(check => {
    const icon = check.passed ? '✅' : 
                 check.severity === 'high' ? '🔴' : 
                 check.severity === 'medium' ? '🟡' : '🔵';
    
    console.log(`${icon} ${check.check}`);
    
    if (check.issues.length > 0) {
      check.issues.forEach(issue => {
        console.log(`   Risk: ${issue.risk}`);
        console.log(`   Reason: ${issue.reason}`);
        if (issue.content) console.log(`   Content: ${issue.content.substring(0, 60)}...`);
        if (issue.section) console.log(`   Section: ${issue.section}`);
        console.log(`   Fix: ${issue.recommendation}`);
        console.log('');
      });
    } else {
      console.log(`   ${check.recommendation}\n`);
    }
  });

  // Print predictions
  if (analysis.predictions.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Predicted Failure Points (sorted by probability)');
    console.log('═══════════════════════════════════════════════════════════\n');

    analysis.predictions.slice(0, 10).forEach((pred, idx) => {
      console.log(`${idx + 1}. ${pred.requirement} (${(pred.probability * 100).toFixed(0)}% likely)`);
      console.log(`   Failure mode: ${pred.failureMode}`);
      console.log(`   Why: ${pred.reason}`);
      console.log(`   Fix: ${pred.recommendation}\n`);
    });
  }

  // Save analysis
  const outputDir = `results/${skillName}/followability`;
  fs.mkdirSync(outputDir, { recursive: true });
  
  const outputFile = `${outputDir}/analysis.json`;
  fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));

  console.log(`💾 Analysis saved: ${outputFile}\n`);

  // Final recommendation
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Recommendation');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (analysis.score >= 90) {
    console.log('✅ Excellent followability! Agents should handle this well.');
  } else if (analysis.score >= 70) {
    console.log('⚠️  Good followability with some predicted issues.');
    console.log('   Fix high-risk items before deploying.');
  } else if (analysis.score >= 50) {
    console.log('🟡 Fair followability. Multiple predicted failure points.');
    console.log('   Significant improvements recommended.');
  } else {
    console.log('🔴 Poor followability. High risk of agent failures.');
    console.log('   Major restructuring needed.');
  }

  console.log('\n📚 See predictions above for specific fixes.\n');
}

main().catch(error => {
  console.error('\n❌ Analysis failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
