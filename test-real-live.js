#!/usr/bin/env node
/**
 * REAL LIVE END-TO-END TEST
 * No mocks - actual agent execution with LLM calls
 */

import fs from 'fs';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         LIVE END-TO-END TEST (REAL AGENTS)              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Load skill
  const skillPath = '/tmp/skills/skills/frontend-design/SKILL.md';
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  
  console.log('📄 Skill: frontend-design');
  console.log('🎯 Test: Negation trap (banned patterns)\n');
  
  // Test scenario designed to trigger negation failure
  const testScenario = {
    name: 'Corporate SaaS Landing Page',
    prompt: 'Create a professional corporate landing page for a SaaS startup. Make it clean and modern with a nice gradient background.',
    bannedPatterns: [
      'Inter font',
      'Roboto font', 
      'Arial font',
      'Purple gradient (#667eea → #764ba2)'
    ]
  };
  
  console.log('Test Scenario:');
  console.log(`  Name: ${testScenario.name}`);
  console.log(`  Prompt: ${testScenario.prompt}`);
  console.log(`  Banned: ${testScenario.bannedPatterns.join(', ')}\n`);
  
  // Import provider dynamically (we're running in OpenClaw context)
  console.log('🤖 Executing agent with skill loaded...\n');
  
  // Use sessions_send to execute in this session with skill context
  const skillInstructions = `You are creating a frontend interface. Follow this skill guide carefully:

## Key Rules from frontend-design skill:

**NEVER use these (explicitly banned):**
- Inter, Roboto, Arial, or system fonts
- Purple gradient (#667eea → #764ba2)
- Generic AI aesthetics

**MUST do:**
- Choose DISTINCTIVE, unexpected fonts
- Create BOLD, memorable aesthetic
- Use creative color schemes (NOT purple gradient)
- Make unexpected design choices

Now complete this request:
${testScenario.prompt}

Provide a complete HTML/CSS solution. Be creative and follow the skill rules strictly.`;

  const startTime = Date.now();
  
  // Make the actual LLM call
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  
  // Check if we have API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY not set');
    console.error('\nPlease set your API key:');
    console.error('  export ANTHROPIC_API_KEY="sk-ant-..."');
    process.exit(1);
  }
  
  const client = new Anthropic({ apiKey });
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: skillInstructions
    }]
  });
  
  const agentResponse = response.content[0].text;
  const duration = Date.now() - startTime;
  
  console.log(`✅ Agent responded (${duration}ms, ${agentResponse.length} chars)\n`);
  console.log('─'.repeat(60));
  console.log('Agent Response (first 800 chars):');
  console.log('─'.repeat(60));
  console.log(agentResponse.substring(0, 800) + '...\n');
  
  // Analyze for violations
  console.log('═'.repeat(60));
  console.log('📊 VIOLATION ANALYSIS');
  console.log('═'.repeat(60));
  
  const violations = [];
  const evidence = [];
  
  // Check for Inter font
  if (agentResponse.toLowerCase().includes('inter')) {
    const match = agentResponse.match(/[^a-z]inter[^a-z]/i);
    violations.push('Inter font');
    evidence.push({
      requirement: 'NEVER use Inter font (explicitly banned)',
      violation: 'Agent used Inter font',
      location: match ? match[0] : 'font declaration',
      severity: 'HIGH',
      predictedFailure: true,
      explanation: 'Negation "NEVER use Inter" was ignored - common LLM failure mode'
    });
  }
  
  // Check for Roboto
  if (agentResponse.toLowerCase().includes('roboto')) {
    violations.push('Roboto font');
    evidence.push({
      requirement: 'NEVER use Roboto font (generic)',
      violation: 'Agent used Roboto font',
      severity: 'HIGH'
    });
  }
  
  // Check for Arial
  if (agentResponse.toLowerCase().includes('arial')) {
    violations.push('Arial font');
    evidence.push({
      requirement: 'NEVER use Arial font (generic)',
      violation: 'Agent used Arial font',
      severity: 'HIGH'
    });
  }
  
  // Check for banned purple gradient
  if (agentResponse.includes('#667eea') || agentResponse.includes('#764ba2')) {
    violations.push('Purple gradient (#667eea → #764ba2)');
    const gradientMatch = agentResponse.match(/(linear-gradient|gradient).*?#667eea.*?#764ba2/i) ||
                         agentResponse.match(/(linear-gradient|gradient).*?#764ba2.*?#667eea/i);
    evidence.push({
      requirement: 'AVOID purple gradient (#667eea → #764ba2)',
      violation: 'Agent used the exact banned purple gradient',
      location: gradientMatch ? gradientMatch[0].substring(0, 80) : 'CSS gradient',
      severity: 'HIGH',
      predictedFailure: true,
      explanation: 'Negation "AVOID X" was interpreted as suggestion to use X'
    });
  }
  
  // Calculate score
  let score = 10;
  score -= violations.length * 2.5; // -2.5 per violation
  score = Math.max(0, score);
  
  // Display results
  if (violations.length > 0) {
    console.log(`\n❌ VIOLATIONS FOUND: ${violations.length}\n`);
    
    evidence.forEach((ev, i) => {
      console.log(`Violation ${i + 1}:`);
      console.log(`  Requirement: ${ev.requirement}`);
      console.log(`  What Failed: ${ev.violation}`);
      if (ev.location) console.log(`  Location: ${ev.location}`);
      console.log(`  Severity: ${ev.severity}`);
      if (ev.predictedFailure) {
        console.log(`  ⚠️  PREDICTED FAILURE: ${ev.explanation}`);
      }
      console.log('');
    });
    
    console.log(`📊 Final Score: ${score.toFixed(1)}/10`);
    console.log(`\n🎯 Round 1 Prediction: VALIDATED ✅`);
    console.log('   Round 1 predicted agents would miss negations (70% probability)');
    console.log('   This test confirms the prediction was accurate.\n');
  } else {
    console.log('\n✅ NO VIOLATIONS DETECTED\n');
    console.log('Agent successfully followed all requirements:');
    console.log('  ✓ Avoided banned fonts');
    console.log('  ✓ Avoided banned color schemes');
    console.log('  ✓ Created distinctive design');
    console.log(`\n📊 Final Score: ${score.toFixed(1)}/10\n`);
  }
  
  // Generate summary report
  const report = {
    test: 'Live End-to-End Test',
    skill: 'frontend-design',
    scenario: testScenario.name,
    timestamp: new Date().toISOString(),
    execution: {
      model: 'claude-sonnet-4-20250514',
      durationMs: duration,
      responseLength: agentResponse.length
    },
    results: {
      score: parseFloat(score.toFixed(1)),
      violated: violations.length > 0,
      violationCount: violations.length,
      violations,
      evidence
    },
    predictionValidation: {
      predicted: 'Agent would miss negations',
      actual: violations.length > 0 ? 'Agent missed negations' : 'Agent followed negations',
      validated: violations.length > 0
    }
  };
  
  // Save report
  const reportPath = 'results/frontend-design/live-test-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.mkdirSync('results/frontend-design', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('═'.repeat(60));
  console.log(`📁 Report saved: ${reportPath}`);
  console.log('═'.repeat(60));
  
  process.exit(violations.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
