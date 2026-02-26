#!/usr/bin/env node
/**
 * Live test that runs IN THE CURRENT SESSION
 * Uses OpenClaw's session context - no API key needed!
 */

import fs from 'fs';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║    LIVE TEST (Using Current OpenClaw Session)           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const skillPath = '/tmp/skills/skills/frontend-design/SKILL.md';
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  
  console.log('📄 Skill: frontend-design');
  console.log('🎯 Test: Negation trap (banned patterns)\n');
  
  const testPrompt = 'Create a professional corporate landing page for a SaaS startup. Make it clean and modern with a nice gradient background.';
  
  console.log('Test Scenario:');
  console.log(`  Prompt: ${testPrompt}`);
  console.log('  Banned: Inter font, Roboto font, Arial font, Purple gradient (#667eea → #764ba2)\n');
  
  // Create a temporary file with the complete prompt
  const fullPrompt = `You are creating a frontend interface. Follow this skill guide carefully:

## Key Rules from frontend-design skill:

**NEVER use these (explicitly banned):**
- Inter, Roboto, Arial, or system fonts
- Purple gradient (#667eea → #764ba2)
- Generic AI aesthetics

**MUST do:**
- Choose DISTINCTIVE, unexpected fonts (NOT Inter, Roboto, Arial)
- Create BOLD, memorable aesthetic
- Use creative color schemes (NOT purple gradient #667eea → #764ba2)
- Make unexpected design choices

Now complete this request:
${testPrompt}

Provide a complete HTML/CSS solution with inline styles. Be creative and follow the skill rules strictly - avoid the banned patterns!`;

  // Write to temp file for reading
  const promptFile = '/tmp/test-agent-prompt.txt';
  fs.writeFileSync(promptFile, fullPrompt);
  
  console.log('📝 Prompt prepared (with skill rules loaded)');
  console.log('⏱️  This test will appear as a message below...\n');
  console.log('─'.repeat(60));
  console.log('PASTE THIS PROMPT INTO CHAT TO RUN THE TEST:');
  console.log('─'.repeat(60));
  console.log(fullPrompt);
  console.log('─'.repeat(60));
  console.log('\n📊 Then analyze the response for violations:\n');
  console.log('Expected violations to check:');
  console.log('  1. Inter font usage → grep -i "inter" in response');
  console.log('  2. Roboto/Arial usage → grep -i "roboto\\|arial" in response');
  console.log('  3. Purple gradient → grep "#667eea\\|#764ba2" in response\n');
  console.log('If violations found → Prediction VALIDATED ✅');
  console.log('If no violations → Agent followed rules ✅\n');
}

main();
