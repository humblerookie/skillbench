#!/usr/bin/env node
/**
 * Stress Testing Demo
 * 
 * Shows how to generate and run stress tests on a skill
 */

import { SkillStressTester } from './src/stress-tester.js';
import { ProviderFactory } from './src/providers/provider-factory.js';
import fs from 'fs';

const skillPath = process.argv[2] || '/tmp/skills/skills/frontend-design/SKILL.md';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║            Skill Stress Testing Demo                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Read skill
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  const skillName = skillPath.split('/').pop().replace(/\.md$/, '').replace('SKILL', 'skill');

  console.log(`📄 Skill: ${skillName}`);
  console.log(`📂 Path: ${skillPath}\n`);

  // Initialize provider
  const provider = ProviderFactory.create({ provider: 'openclaw' });
  const stressTester = new SkillStressTester(provider);

  // Generate stress test scenarios
  console.log('🔬 Generating stress test scenarios...\n');
  const scenarios = await stressTester.generateStressTests(skillContent, skillName);

  if (scenarios.length === 0) {
    console.log('⚠️  No scenarios generated. Check provider connection.\n');
    return;
  }

  console.log(`✅ Generated ${scenarios.length} stress test scenarios:\n`);
  
  // Display scenarios by category
  const byCategory = {};
  scenarios.forEach(s => {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s);
  });

  Object.entries(byCategory).forEach(([category, tests]) => {
    console.log(`📋 ${category} (${tests.length} tests):`);
    tests.forEach(t => {
      console.log(`   ${t.id}: ${t.userPrompt?.substring(0, 60)}...`);
      console.log(`      Challenge: ${t.challengeDescription || t.ambiguity || t.conflictDescription}`);
    });
    console.log('');
  });

  // Save scenarios
  const outputDir = `results/${skillName}/stress-tests`;
  fs.mkdirSync(outputDir, { recursive: true });
  
  const scenariosFile = `${outputDir}/scenarios.json`;
  fs.writeFileSync(scenariosFile, JSON.stringify({ 
    skill: skillName,
    generated: new Date().toISOString(),
    scenarios 
  }, null, 2));

  console.log(`💾 Scenarios saved: ${scenariosFile}\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('Next Steps:');
  console.log('1. Review generated scenarios in results/');
  console.log('2. Run agents against these scenarios');
  console.log('3. Evaluate responses with stress criteria');
  console.log('4. Identify skill gaps and improvements');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📚 See STRESS-TESTING-GUIDE.md for full details\n');
}

main().catch(error => {
  console.error('\n❌ Stress test generation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
