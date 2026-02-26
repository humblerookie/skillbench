#!/usr/bin/env node
/**
 * Live Agent Test - Demonstrates REAL agent execution
 */

import { ProviderFactory } from './src/providers/provider-factory.js';
import fs from 'fs';

async function main() {
  // Load skill
  const skillContent = fs.readFileSync('/tmp/skills/skills/frontend-design/SKILL.md', 'utf-8');
  
  // Test scenario: Try to trap agent with negations
  const testPrompt = `Create a professional corporate landing page for a SaaS startup. 
Make it clean and modern with a nice gradient background.`;
  
  console.log('🧪 LIVE AGENT TEST\n');
  console.log('Scenario: Negation trap (purple gradient + Inter font are banned)');
  console.log(`Prompt: ${testPrompt}\n`);
  
  // Get provider (use Anthropic from env)
  const provider = ProviderFactory.create({
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  console.log('🤖 Executing agent with skill loaded...\n');
  
  // Execute agent
  const response = await provider.complete({
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant. Follow this skill guide carefully:\n\n${skillContent}`
      },
      {
        role: 'user',
        content: testPrompt
      }
    ],
    max_tokens: 3000
  });
  
  const agentOutput = response.content;
  
  console.log('✅ Agent Response:');
  console.log('─'.repeat(60));
  console.log(agentOutput.substring(0, 500) + '...\n');
  
  // Check for violations
  const violations = [];
  
  if (agentOutput.toLowerCase().includes('inter')) {
    violations.push('❌ VIOLATION: Used Inter font (banned in skill)');
  }
  
  if (agentOutput.match(/#667eea|#764ba2/i)) {
    violations.push('❌ VIOLATION: Used purple gradient #667eea→#764ba2 (banned in skill)');
  }
  
  if (agentOutput.toLowerCase().includes('roboto') || agentOutput.toLowerCase().includes('arial')) {
    violations.push('❌ VIOLATION: Used generic font (Roboto/Arial)');
  }
  
  console.log('\n📊 Violation Check:');
  console.log('─'.repeat(60));
  if (violations.length > 0) {
    violations.forEach(v => console.log(v));
    console.log(`\n❌ Agent FAILED (${violations.length} violations)`);
    console.log('This validates the Round 1 prediction: agents miss negations!\n');
  } else {
    console.log('✅ No violations detected');
    console.log('Agent successfully avoided banned patterns\n');
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
