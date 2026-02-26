#!/usr/bin/env node
/**
 * Multi-Provider Health Check
 * Test Evalanche with different LLM providers
 */

import { SkillEvaluatorV2 } from './src/evaluator-v2.js';

const args = process.argv.slice(2);
const providerArg = args.find(a => a.startsWith('--provider='))?.split('=')[1] || 
                     (args.includes('--provider') ? args[args.indexOf('--provider') + 1] : null);

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     Evalanche Multi-Provider Health Check                ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function main() {
  let evaluator;

  if (providerArg) {
    // Explicit provider specified
    console.log(`🔧 Provider: ${providerArg} (explicit)\n`);
    
    if (providerArg === 'openai' || providerArg === 'gpt') {
      if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY required for OpenAI provider');
        console.error('   Export it with: export OPENAI_API_KEY=sk-...\n');
        process.exit(1);
      }
      evaluator = new SkillEvaluatorV2({
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY
      });
    } else if (providerArg === 'anthropic' || providerArg === 'claude') {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('❌ Error: ANTHROPIC_API_KEY required for Anthropic provider');
        console.error('   Export it with: export ANTHROPIC_API_KEY=sk-ant-...\n');
        process.exit(1);
      }
      evaluator = new SkillEvaluatorV2({
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    } else if (providerArg === 'openclaw') {
      evaluator = new SkillEvaluatorV2({
        provider: 'openclaw'
      });
    } else {
      console.error(`❌ Unknown provider: ${providerArg}`);
      console.error('   Supported: anthropic, openai, openclaw\n');
      process.exit(1);
    }
  } else {
    // Auto-detect from environment
    console.log('🔍 Auto-detecting provider from environment...\n');
    evaluator = new SkillEvaluatorV2({});
  }

  // Run health check
  const health = await evaluator.runDiagnostics();

  // Print results
  console.log('\n📋 Results:\n');
  console.log(`  1. Consistency: ${health.tests.consistency.status}`);
  console.log(`  2. Calibration: ${health.tests.calibration.status}`);
  console.log(`  3. Evidence: ${health.tests.evidenceValidation.status}`);
  console.log(`  4. Drift: ${health.tests.drift.status}`);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  OVERALL: ${health.overallStatus}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (health.overallStatus === 'HEALTHY') {
    console.log('✅ Evaluator is ready for skill testing!\n');
  } else {
    console.log('⚠️  Evaluator has issues. Review diagnostics above.\n');
  }
}

main().catch(error => {
  console.error('\n❌ Health check failed:', error.message);
  if (error.message.includes('openai')) {
    console.error('\n💡 Tip: Install OpenAI SDK:');
    console.error('   npm install openai\n');
  }
  process.exit(1);
});
