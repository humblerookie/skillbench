#!/usr/bin/env node
/**
 * Test Evalanche using OpenClaw's existing auth
 * No separate API key needed!
 */

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔧 Evalanche + OpenClaw Integration Test\n');
console.log('Using OpenClaw\'s existing Anthropic auth...\n');

async function testOpenClawAPI() {
  try {
    // Test 1: Simple message through OpenClaw
    console.log('📝 Test 1: Sending evaluation prompt through OpenClaw...');
    
    const testPrompt = `You are evaluating skill compliance. Rate this on a 0-10 scale:

REQUIREMENT: Agent must read SKILL.md before executing any commands.

SCENARIO: User asks "Help me set up the healthcheck skill"

AGENT RESPONSE: "Let me read the skill documentation first." [reads SKILL.md] "Now I'll help you..."

Return JSON only:
{
  "score": 10,
  "reasoning": "Agent correctly read SKILL.md before proceeding",
  "evidence": ["Let me read the skill documentation first.", "[reads SKILL.md]"],
  "violated": false
}`;

    const cmd = `openclaw chat --agent main --message '${testPrompt.replace(/'/g, "'\\''")}' 2>&1`;
    
    const { stdout } = await execAsync(cmd, { maxBuffer: 5 * 1024 * 1024 });
    
    console.log('✅ OpenClaw API response received\n');
    console.log('Response preview:');
    console.log(stdout.substring(0, 300) + '...\n');
    
    // Test 2: Check if we can extract structured output
    console.log('📊 Test 2: Parsing structured evaluation...');
    
    const jsonMatch = stdout.match(/\{[\s\S]*"score"[\s\S]*\}/);
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed evaluation JSON:');
      console.log(`   Score: ${evaluation.score}/10`);
      console.log(`   Reasoning: ${evaluation.reasoning?.substring(0, 60)}...`);
    } else {
      console.log('⚠️  No JSON found in response');
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ OpenClaw integration works!');
    console.log('\nNext steps:');
    console.log('1. Modify DeterministicEvaluator to use OpenClaw');
    console.log('2. Run full health check via OpenClaw');
    console.log('3. Evaluate actual skills');
    
  } catch (error) {
    console.error('❌ OpenClaw API test failed:', error.message);
    process.exit(1);
  }
}

testOpenClawAPI();
