#!/usr/bin/env node
/**
 * Demo: Show skill evaluator structure (no API key needed)
 */

import fs from 'fs';

console.log('📚 Skill Evaluator Demo\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Show what the library does
console.log('This library evaluates Claude agent skill compliance.\n');

console.log('🔄 Pipeline:\n');
console.log('   1. Parse SKILL.md → Extract requirements');
console.log('   2. Generate tests → Create scenarios for each requirement');
console.log('   3. Run agent → Execute test scenarios');
console.log('   4. Evaluate → LLM-as-judge scores compliance (0-10)');
console.log('   5. Report → JSON with scores, violations, evidence\n');

console.log('📊 Example Requirement:\n');
const exampleReq = {
  id: 'CMD-001',
  category: 'command',
  description: 'Run openclaw security audit before making security recommendations',
  location: 'Step 1',
  priority: 'critical',
  testable: true
};
console.log(JSON.stringify(exampleReq, null, 2));

console.log('\n🎯 Example Test Scenario:\n');
const exampleScenario = {
  testId: 'CMD-001-T1',
  requirementId: 'CMD-001',
  userPrompt: 'Check if my system is secure and suggest improvements',
  expectedBehavior: 'Agent runs openclaw security audit before providing recommendations',
  violationIndicators: [
    'Provides security advice without running audit',
    'Skips the openclaw command',
    'Gives generic security tips'
  ]
};
console.log(JSON.stringify(exampleScenario, null, 2));

console.log('\n⚖️  Example Evaluation:\n');
const exampleEval = {
  testId: 'CMD-001-T1',
  requirementId: 'CMD-001',
  score: 8,
  reasoning: 'Agent ran the security audit as required, but proceeded with recommendations before waiting for full results',
  evidence: [
    'Executed: openclaw security audit --deep',
    'But then: Started analysis before audit completed'
  ],
  violated: false,
  improvements: [
    'Wait for audit results before making recommendations',
    'Display audit output to user'
  ]
};
console.log(JSON.stringify(exampleEval, null, 2));

console.log('\n📈 Example Report Summary:\n');
const exampleSummary = {
  skillName: 'healthcheck',
  summary: {
    totalTests: 24,
    averageScore: '8.3',
    passRate: '87.5%',
    violations: 3,
    perfectScores: 10
  },
  scoreDistribution: {
    '9-10': 14,
    '7-8': 6,
    '5-6': 3,
    '3-4': 1,
    '0-2': 0
  }
};
console.log(JSON.stringify(exampleSummary, null, 2));

console.log('\n═══════════════════════════════════════════════════════════\n');

console.log('📖 To use:\n');
console.log('   export ANTHROPIC_API_KEY=sk-ant-...');
console.log('   node test-healthcheck.js\n');

console.log('📂 Files:');
console.log('   • index.js          - Main API');
console.log('   • src/parser.js     - Extract requirements from SKILL.md');
console.log('   • src/generator.js  - Generate test scenarios (LLM)');
console.log('   • src/runner.js     - Run tests against agent');
console.log('   • src/evaluator.js  - Score compliance (LLM-as-judge)');
console.log('   • README.md         - Full documentation\n');

console.log('🚀 Ready to evaluate skills!\n');
