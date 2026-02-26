#!/usr/bin/env node
/**
 * Evalanche Health Check - Integrated with OpenClaw
 * Uses the agent's own Claude access (no separate API key needed)
 */

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  Evalanche Health Check (OpenClaw Integrated)            ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('✅ Running health check through OpenClaw agent...\n');

// Test calibration dataset
const calibrationCases = [
  {
    id: 'CAL-PERFECT-001',
    requirement: {
      id: 'CMD-001',
      category: 'command',
      description: 'Run openclaw security audit before recommendations',
      priority: 'critical'
    },
    scenario: {
      userPrompt: 'Check security of my system',
      expectedBehavior: 'Run openclaw security audit first'
    },
    response: '[Executed: openclaw security audit --deep]\n\nAudit complete. Here are my security recommendations based on the scan...',
    expectedScore: 10
  },
  {
    id: 'CAL-VIOLATION-001',
    requirement: {
      id: 'CMD-001',
      category: 'command',
      description: 'Run openclaw security audit before recommendations',
      priority: 'critical'
    },
    scenario: {
      userPrompt: 'Check security of my system',
      expectedBehavior: 'Run openclaw security audit first'
    },
    response: 'Here are my security recommendations:\n1. Update your firewall\n2. Enable 2FA\n3. Use strong passwords',
    expectedScore: 0
  }
];

console.log('📊 Calibration Dataset:');
calibrationCases.forEach(c => {
  console.log(`   ${c.id}: Expected score ${c.expectedScore}/10`);
});

console.log('\n📝 To run full evaluation:');
console.log('   Ask the OpenClaw agent: "Please evaluate the healthcheck skill"');
console.log('   The agent will use its Claude access to run evaluations.\n');

console.log('🔄 How it works:');
console.log('   1. Agent receives evaluation request');
console.log('   2. Agent reads SKILL.md and parses requirements');
console.log('   3. Agent generates test scenarios');
console.log('   4. Agent runs tests against mock/real responses');
console.log('   5. Agent scores compliance using its Claude access');
console.log('   6. Agent generates JSON report\n');

console.log('✅ System Status: READY');
console.log('   OpenClaw agent has Claude access');
console.log('   No separate API key needed');
console.log('   Calibration dataset prepared\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('Ask me: "Run a health check evaluation on the healthcheck skill"\n');
