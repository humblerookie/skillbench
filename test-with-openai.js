#!/usr/bin/env node
/**
 * Run Evalanche with OpenAI (GPT-4) instead of Claude
 */

import { SkillEvaluatorV2 } from './src/evaluator-v2.js';
import { OpenAIAdapter } from './src/openai-adapter.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable required');
  console.error('   Export it with: export OPENAI_API_KEY=sk-...');
  process.exit(1);
}

console.log('🔧 Mode: OpenAI (GPT-4)');
console.log('⚠️  Note: Evaluating Claude skills with GPT-4 may give different results\n');

async function main() {
  // Would need to modify SkillEvaluatorV2 to accept custom client
  // For now, this is a template showing the approach
  
  console.log('📝 To use OpenAI with Evalanche:');
  console.log('');
  console.log('1. Install OpenAI SDK:');
  console.log('   npm install openai');
  console.log('');
  console.log('2. Modify src/deterministic-evaluator.js:');
  console.log('   - Import OpenAIAdapter instead of Anthropic');
  console.log('   - Use this.client = new OpenAIAdapter(apiKey)');
  console.log('');
  console.log('3. Run evaluation:');
  console.log('   export OPENAI_API_KEY=sk-...');
  console.log('   node test-with-openai.js');
  console.log('');
  console.log('⚠️  Caveat: The frontend-design skill is written FOR Claude.');
  console.log('   Evaluating it with GPT-4 tests different agent behavior.');
}

main();
