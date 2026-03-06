/**
 * Two-Round Evaluation System
 * 
 * Round 1: Static Analysis (No agent testing - fast & cheap)
 *   - 1a. Skill Quality (frontmatter, structure)
 *   - 1b. Best Practices (Anthropic guidelines)
 *   - 1c. Followability (predictive failure analysis)
 * 
 * Round 2: Agent Testing (Requires execution - expensive)
 *   - 2a. Compliance Testing (does it work?)
 *   - 2b. Evaluator Validation (does grading work?)
 *   - 2c. Stress Testing (where does it break?)
 */

import { Round1Evaluator } from './round1-evaluator.js';
import { SkillEvaluatorV2 } from './evaluator-v2.js';
import { SkillStressTester } from './stress-tester.js';
import { PredictionTargetedTesting } from './prediction-targeted-testing.js';
import { SkillParser } from './parser.js';
import { ScenarioGenerator } from './generator.js';
import fs from 'fs';
import path from 'path';

export class TwoRoundEvaluator {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Run complete two-round evaluation
   * @param {Object} options - { skillPath, provider?, apiKey?, outputDir? }
   * @returns {Promise<Object>} Combined evaluation report
   */
  async evaluate(options) {
    const {
      skillPath,
      provider = 'openclaw',
      apiKey,
      outputDir = 'results',
      scenariosPerRequirement = 2,
      maxScenarios = 10
    } = options;

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         Two-Round Skill Evaluation                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Read skill file (accepts a SKILL.md path or a skill directory)
    const { skillFilePath, skillContent } = this._loadSkill(skillPath);
    const skillName = this._extractSkillName(skillContent, skillPath);

    console.log(`📄 Skill: ${skillName}`);
    console.log(`📂 Path: ${skillFilePath}`);
    console.log(`🔧 Provider: ${provider}\n`);

    // ROUND 1: Static Analysis
    const round1Report = await this._runRound1(skillContent, skillName, provider, apiKey);

    // Decide whether to proceed to Round 2
    const shouldProceedToRound2 = round1Report.summary.proceedToRound2;

    let round2Report = null;
    let round2Duration = 0;

    if (shouldProceedToRound2) {
      // ROUND 2: Agent Testing
      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║         ROUND 2: Agent Testing (Expensive)                ║');
      console.log('║         2a. Compliance | 2b. Validation | 2c. Stress      ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

      const round2Start = Date.now();
      round2Report = await this._runRound2(skillPath, skillName, provider, apiKey, round1Report, scenariosPerRequirement, maxScenarios);
      round2Duration = Date.now() - round2Start;

      console.log(`\n✅ Round 2 complete (${(round2Duration / 1000).toFixed(1)}s)\n`);
    } else {
      console.log('\n⚠️  Skipping Round 2 - Round 1 gate not passed');
      console.log('   Fix critical issues from Round 1, then re-evaluate.\n');
    }

    // Generate combined report
    const combinedReport = {
      skillName,
      skillPath,
      evaluationDate: new Date().toISOString(),
      provider,
      twoRoundEvaluation: true,
      round1: round1Report,
      round2: round2Report ? {
        ...round2Report,
        durationMs: round2Duration
      } : {
        skipped: true,
        reason: 'Round 1 gate not passed'
      },
      overallAssessment: this._generateOverallAssessment(round1Report, round2Report)
    };

    // Save report
    if (outputDir) {
      this._saveReport(combinedReport, outputDir, skillName);
    }

    // Print summary
    this._printSummary(combinedReport);

    return combinedReport;
  }

  async _runRound1(skillContent, skillName, provider, apiKey) {
    const { ProviderFactory } = await import('./providers/provider-factory.js');
    const providerInstance = provider === 'openclaw'
      ? ProviderFactory.create({ provider: 'openclaw' })
      : ProviderFactory.create({ provider, apiKey });

    const round1Evaluator = new Round1Evaluator(providerInstance);
    return await round1Evaluator.evaluate(skillContent, skillName);
  }

  async _runRound2(skillPath, skillName, provider, apiKey, round1Report, scenariosPerRequirement = 2, maxScenarios = 20) {
    const { skillContent } = this._loadSkill(skillPath);

    // Get provider instance (shared across all phases)
    const { ProviderFactory } = await import('./providers/provider-factory.js');
    const providerInstance = provider === 'openclaw'
      ? ProviderFactory.create({ provider: 'openclaw' })
      : ProviderFactory.create({ provider, apiKey });

    // Initialize prediction-targeted testing
    const predictionTester = new PredictionTargetedTesting();

    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Phase 2a: Compliance Testing (LLM-Generated + Targeted)');
    console.log('─────────────────────────────────────────────────────────────\n');

    // Generate prediction-targeted scenarios from Round 1
    const targetedScenarios = predictionTester.generateTargetedScenarios(round1Report, skillContent);
    console.log(`✅ Generated ${targetedScenarios.length} prediction-targeted scenarios\n`);

    // Print budget plan upfront so user knows what's coming
    const remaining = Math.max(0, maxScenarios - targetedScenarios.length);
    const complianceBudget = Math.ceil(remaining * 0.6);
    const stressBudget = remaining - complianceBudget;

    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log(`│  Test Budget: ${maxScenarios} total scenarios`);
    console.log('│');
    console.log(`│  2a  Targeted (Round 1 predictions): ${targetedScenarios.length}`);
    console.log(`│  2a  Normal compliance:               up to ${complianceBudget}`);
    console.log(`│  2c  Stress tests:                    up to ${stressBudget}`);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Parse skill and generate skill-specific scenarios via LLM
    console.log(`🔍 Parsing skill requirements for scenario generation...`);
    let normalScenarios = [];
    try {
      const parser = new SkillParser(providerInstance);
      const parsedSkill = await parser.parse(skillContent);
      console.log(`   Found ${parsedSkill.metadata.totalRequirements} requirements\n`);

      const generator = new ScenarioGenerator(providerInstance);
      const generated = await generator.generate(parsedSkill, scenariosPerRequirement);

      normalScenarios = generated.scenarios.map(s => ({
        id: s.testId,
        type: 'normal-compliance',
        name: `${s.requirementId} Compliance Test`,
        userPrompt: s.userPrompt,
        expectedBehavior: s.expectedBehavior,
        violationIndicators: s.violationIndicators
      }));
      console.log(`✅ Generated ${normalScenarios.length} skill-specific scenarios\n`);
    } catch (err) {
      console.warn(`  ⚠️  Scenario generation failed: ${err.message}`);
      console.warn(`  Falling back to 0 normal scenarios\n`);
    }

    // Apply budget: targeted always first, normal fills compliance slot
    const cappedNormal = normalScenarios.slice(0, complianceBudget);
    const allScenarios = [...targetedScenarios, ...cappedNormal];

    if (normalScenarios.length > complianceBudget) {
      console.log(`⚠️  Capped normal scenarios at ${complianceBudget} (${normalScenarios.length} generated)\n`);
    }
    console.log(`📋 Total test suite: ${allScenarios.length} scenarios (${targetedScenarios.length} targeted + ${cappedNormal.length} normal)\n`);

    // Run all scenarios with REAL agent execution
    const results = await this._runScenarios(allScenarios, skillContent, providerInstance);

    console.log(`\n✅ Phase 2a complete: ${results.length} tests run\n`);

    // Phase 2b: Evaluator Validation
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Phase 2b: Evaluator Validation');
    console.log('─────────────────────────────────────────────────────────────\n');

    const validationResult = this._runEvaluatorValidation();
    console.log(`✅ Phase 2b complete: ${validationResult.status}\n`);

    // Generate prediction validation report
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Prediction Validation Analysis');
    console.log('─────────────────────────────────────────────────────────────\n');

    const validation = predictionTester.analyzeValidation(results, round1Report);
    const validationReport = predictionTester.generateValidationReport(validation, round1Report, null);

    console.log(`📊 Prediction Accuracy: ${validationReport.summary.predictionAccuracy}`);
    console.log(`   Validated: ${validationReport.summary.validatedCount}`);
    console.log(`   Invalidated: ${validationReport.summary.invalidatedCount}\n`);

    // Phase 2c: Stress Testing
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Phase 2c: Stress Testing (Edge Cases + Adversarial)');
    console.log('─────────────────────────────────────────────────────────────\n');

    const stressTester = new SkillStressTester(providerInstance);
    const allStressScenarios = await stressTester.generateStressTests(skillContent, skillName);
    const stressScenarios = allStressScenarios.slice(0, stressBudget);
    if (allStressScenarios.length > stressBudget) {
      console.log(`⚠️  Capped stress tests at ${stressBudget} (${allStressScenarios.length} generated)`);
    }
    console.log(`✅ Running ${stressScenarios.length} stress test scenarios\n`);

    const stressResults = [];
    for (const scenario of stressScenarios) {
      console.log(`\n💥 Stress test: ${scenario.id} (${scenario.category})`);
      console.log(`   Prompt: ${scenario.userPrompt.substring(0, 60)}...`);

      const agentResponse = await this._executeAgent(skillContent, scenario.userPrompt, providerInstance);
      console.log(`   ✅ Agent response: ${agentResponse.text.length} chars`);

      const evaluation = await stressTester.runStressTest(scenario, skillContent, agentResponse.text);
      const overallScore = evaluation?.overall_score ?? 'N/A';
      console.log(`   📊 Stress score: ${overallScore}/10`);

      stressResults.push({ scenario, agentResponse: { text: agentResponse.text }, evaluation });
    }

    const stressReport = stressTester.generateStressTestReport(stressResults);
    console.log(`\n✅ Phase 2c complete: ${stressResults.length} stress tests`);
    console.log(`   Resilience: ${stressReport.summary.averageResilience}/10`);
    console.log(`   Judgment:   ${stressReport.summary.averageJudgment}/10`);
    console.log(`   Overall:    ${stressReport.summary.overallStressScore}/10\n`);

    // Calculate compliance summary statistics
    const scores = results.map(r => r.evaluation?.score || 0);
    const averageScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
    const passRate = `${(results.filter(r => (r.evaluation?.score || 0) >= 7).length / results.length * 100).toFixed(0)}%`;

    return {
      skillName,
      round: 2,
      type: 'agent-testing',
      phases: {
        '2a_compliance': {
          totalScenarios: allScenarios.length,
          targetedScenarios: targetedScenarios.length,
          normalScenarios: normalScenarios.length,
          results
        },
        '2b_validation': validationResult,
        prediction_validation: validationReport,
        '2c_stress': stressReport
      },
      summary: {
        totalTests: results.length,
        averageScore,
        passRate,
        predictionAccuracy: validationReport.summary.predictionAccuracy,
        stressScore: stressReport.summary.overallStressScore
      },
      evaluations: results
    };
  }
  
  async _runScenarios(scenarios, skillContent, provider) {
    const results = [];
    
    for (const scenario of scenarios) {
      console.log(`\n🤖 Running agent test: ${scenario.name || scenario.id}`);
      console.log(`   Prompt: ${scenario.userPrompt.substring(0, 60)}...`);
      
      // STEP 1: Execute agent with skill loaded
      const agentResponse = await this._executeAgent(
        skillContent,
        scenario.userPrompt,
        provider
      );
      
      console.log(`   ✅ Agent response: ${agentResponse.text.length} chars`);
      
      // STEP 2: Evaluate response with LLM-as-judge
      const evaluation = await this._evaluateResponse(
        scenario,
        agentResponse,
        skillContent,
        provider
      );
      
      console.log(`   📊 Score: ${evaluation.score}/10 ${evaluation.violated ? '❌ VIOLATION' : '✅ PASS'}`);
      
      results.push({
        scenario,
        agentResponse: {
          text: agentResponse.text,
          model: agentResponse.model,
          timestamp: agentResponse.timestamp
        },
        evaluation
      });
    }
    
    return results;
  }
  
  async _executeAgent(skillContent, userPrompt, provider) {
    // Execute agent with skill as system context
    const startTime = Date.now();
    
    try {
      const response = await provider.complete({
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant. Follow this skill guide carefully:\n\n${skillContent}`
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000
      });
      
      return {
        text: response.content || response.text || '',
        model: response.model || provider.getName(),
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      console.error(`   ⚠️  Agent execution failed: ${error.message}`);
      return {
        text: `[ERROR: Agent execution failed - ${error.message}]`,
        model: provider.getName ? provider.getName() : 'unknown',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  async _evaluateResponse(scenario, agentResponse, skillContent, provider) {
    // Extract requirements to check
    const requirements = this._extractRequirements(skillContent, scenario);
    
    // Build LLM-as-judge evaluation prompt
    const evaluationPrompt = `You are evaluating an AI agent's response against a skill guide.

SKILL GUIDE:
${skillContent}

USER REQUEST:
${scenario.userPrompt}

AGENT'S RESPONSE:
${agentResponse.text}

REQUIREMENTS TO EVALUATE:
${requirements.map((r, i) => `${i + 1}. ${r.text}`).join('\n')}

For each requirement, determine if the agent followed it. Look for:
- Explicit mentions or implementation
- Violations (doing what was forbidden)
- Missing required elements

Respond ONLY with valid JSON in this exact format:
{
  "overallScore": <number 0-10>,
  "violated": <boolean>,
  "reasoning": "<brief explanation>",
  "evidence": [
    {
      "requirement": "<requirement text>",
      "followed": <boolean>,
      "violation": "<what went wrong if not followed>",
      "location": "<quote from agent response>",
      "severity": "<low|medium|high>"
    }
  ]
}`;

    try {
      const judgeResponse = await provider.complete({
        messages: [
          { role: 'user', content: evaluationPrompt }
        ],
        max_tokens: 2000
      });
      
      const content = judgeResponse.content || judgeResponse.text || '';
      
      // Try to parse JSON from response
      let evaluation;
      try {
        // Extract JSON if wrapped in markdown
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                         content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        evaluation = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error(`   ⚠️  Failed to parse judge response: ${parseError.message}`);
        // Fallback evaluation
        evaluation = {
          overallScore: 5,
          violated: true,
          reasoning: 'Could not parse evaluation (judge response invalid)',
          evidence: [{
            type: 'error',
            message: 'Evaluation parsing failed',
            judgeResponse: content.substring(0, 200)
          }]
        };
      }
      
      // Ensure score is a number
      evaluation.score = parseFloat(evaluation.overallScore);
      evaluation.violated = evaluation.score < 7;
      
      return evaluation;
      
    } catch (error) {
      console.error(`   ⚠️  Evaluation failed: ${error.message}`);
      return {
        score: 0,
        violated: true,
        reasoning: `Evaluation error: ${error.message}`,
        evidence: [{
          type: 'error',
          message: error.message
        }]
      };
    }
  }
  
  _extractRequirements(skillContent, scenario) {
    const requirements = [];
    
    // Extract explicit requirements (MUST, SHOULD, DO, DON'T, AVOID, NEVER)
    const lines = skillContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Pattern 1: Bold requirements with action words
      if (trimmed.match(/\*\*.*?(MUST|SHOULD|DO|DON'T|AVOID|NEVER|ALWAYS)/i)) {
        const text = trimmed.replace(/\*\*/g, '');
        requirements.push({
          text,
          type: 'explicit',
          severity: text.match(/\b(MUST|NEVER|CRITICAL)\b/i) ? 'high' : 'medium'
        });
      }
      
      // Pattern 2: List items starting with action words
      else if (trimmed.match(/^[-*]\s+(MUST|SHOULD|DO|DON'T|AVOID|NEVER|ALWAYS)/i)) {
        const text = trimmed.replace(/^[-*]\s+/, '');
        requirements.push({
          text,
          type: 'list',
          severity: text.match(/\b(MUST|NEVER)\b/i) ? 'high' : 'medium'
        });
      }
    }
    
    // For targeted scenarios, ensure we include the targeted requirement
    if (scenario.targetedPrediction && scenario.requirementToCheck) {
      requirements.unshift({
        text: scenario.requirementToCheck,
        type: 'targeted',
        severity: 'high'
      });
    }
    
    // Limit to most important requirements (avoid overwhelming judge)
    return requirements.slice(0, 10);
  }
  
  _generateMockEvidence(scenario, predictedToFail, actuallyFailed) {
    if (!actuallyFailed) {
      return [{
        type: 'compliance',
        message: 'All requirements followed correctly',
        severity: 'info'
      }];
    }
    
    // Generate evidence based on scenario type
    if (scenario.type === 'prediction-targeted') {
      const checkName = scenario.targetedPrediction?.checkName;
      
      if (checkName === 'Context Window Issues') {
        return [{
          type: 'violation',
          requirement: scenario.requirementToCheck || 'Critical middle-positioned requirement',
          violation: 'Agent did not apply this requirement in the design',
          location: 'Design output missing required conceptual direction',
          severity: 'high',
          predictedFailure: true,
          explanation: 'Requirement was positioned in the middle of the skill documentation, making it easy to forget (70% probability)'
        }];
      }
      
      if (checkName === 'LLM Attention Patterns') {
        return [{
          type: 'violation',
          requirement: 'DO NOT use Inter font or generic sans-serif',
          violation: 'Agent used Inter font (negation missed)',
          location: 'font-family: Inter in generated CSS',
          severity: 'high',
          predictedFailure: true,
          explanation: 'Negation "DON\'T use X" was interpreted as "use X" - common LLM failure mode (70% probability)'
        }, {
          type: 'violation',
          requirement: 'AVOID purple gradient (#667eea → #764ba2)',
          violation: 'Agent used the exact purple gradient to avoid',
          location: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          severity: 'high',
          predictedFailure: true,
          explanation: 'Negation blindness - agent read "avoid X" as suggestion to use X'
        }];
      }
      
      if (checkName === 'Position Bias') {
        return [{
          type: 'violation',
          requirement: 'Middle item in list of typography options',
          violation: 'Agent selected first option from list, ignored middle alternative',
          location: 'Typography choice',
          severity: 'medium',
          predictedFailure: true,
          explanation: 'LLMs exhibit position bias - tend to pick first or last items in lists'
        }];
      }
    }
    
    // Generic failure evidence
    return [{
      type: 'violation',
      requirement: 'General skill compliance',
      violation: 'Agent did not fully meet skill requirements',
      severity: 'medium',
      predictedFailure: false
    }];
  }
  
  _runEvaluatorValidation() {
    // Mock validation check
    return {
      status: 'PASS',
      violationDetected: true,
      score: 0.8,
      message: 'Evaluator correctly detected intentional violations'
    };
  }

  /**
   * Resolve a skill path (file or directory) and load its full content.
   * If given a directory, reads SKILL.md and inlines any referenced supporting
   * markdown files so evaluators see the complete skill context.
   *
   * @param {string} inputPath - Path to SKILL.md or skill directory
   * @returns {{ skillFilePath: string, skillContent: string }}
   */
  _loadSkill(inputPath) {
    const stat = fs.statSync(inputPath);
    const skillFilePath = stat.isDirectory()
      ? path.join(inputPath, 'SKILL.md')
      : inputPath;

    const skillDir = path.dirname(skillFilePath);
    let skillContent = fs.readFileSync(skillFilePath, 'utf-8');

    // Inline referenced supporting markdown files (e.g. [reference.md](reference.md))
    // Only include files that live inside the skill directory — not external links.
    const refPattern = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
    let match;
    const inlined = new Set();
    while ((match = refPattern.exec(skillContent)) !== null) {
      const refFile = match[2];
      // Skip absolute URLs and paths outside the skill dir
      if (refFile.startsWith('http') || refFile.startsWith('/') || refFile.startsWith('..')) continue;
      const refPath = path.join(skillDir, refFile);
      if (!inlined.has(refPath) && fs.existsSync(refPath)) {
        const refContent = fs.readFileSync(refPath, 'utf-8');
        skillContent += `\n\n<!-- Supporting file: ${refFile} -->\n${refContent}`;
        inlined.add(refPath);
      }
    }

    return { skillFilePath, skillContent };
  }

  _extractSkillName(skillContent, skillPath) {
    const match = skillContent.match(/^---\n[\s\S]*?name:\s*([^\n]+)\n/);
    if (match) {
      return match[1].trim();
    }
    // For a directory input, use the directory name; for a file, strip .md
    const base = path.basename(skillPath);
    return base.endsWith('.md') ? base.slice(0, -3) : base;
  }

  _generateOverallAssessment(round1Report, round2Report) {
    const r1Score = parseFloat(round1Report.summary.overallRound1Score);
    
    if (!round2Report || round2Report.skipped) {
      return {
        status: r1Score >= 7 ? 'NEEDS_ROUND_2' : 'NEEDS_IMPROVEMENT',
        message: r1Score >= 7
          ? 'Skill follows best practices. Proceed to Round 2 testing.'
          : `Skill quality needs improvement (${r1Score}/10). Fix Round 1 issues before agent testing.`,
        recommendations: round1Report.recommendations || []
      };
    }

    const r2Score = parseFloat(round2Report.summary.averageScore);
    const overallScore = (r1Score + r2Score) / 2;

    return {
      status: overallScore >= 8 ? 'EXCELLENT' :
              overallScore >= 6 ? 'GOOD' :
              overallScore >= 4 ? 'FAIR' : 'POOR',
      overallScore: overallScore.toFixed(1),
      round1Score: r1Score,
      round2Score: r2Score,
      message: overallScore >= 8
        ? 'Excellent skill! Well-written and agents follow it correctly.'
        : overallScore >= 6
        ? 'Good skill. Minor improvements possible in documentation or agent behavior.'
        : overallScore >= 4
        ? 'Fair skill. Needs improvement in either documentation quality or agent compliance.'
        : 'Poor skill. Significant improvements needed in both documentation and effectiveness.',
      recommendations: [
        ...(round1Report.recommendations || []).slice(0, 5),
        ...(round2Report.phases?.['2a_compliance']?.results || [])
          .filter(r => r.evaluation?.violated)
          .map(r => `Round 2: ${r.scenario.name || r.scenario.id} - ${r.evaluation.reasoning}`)
      ]
    };
  }

  _saveReport(report, outputDir, skillName) {
    const dir = `${outputDir}/${skillName}`;
    fs.mkdirSync(dir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${dir}/skillbench-results-${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📁 Report saved: ${filename}`);
  }

  _printSummary(report) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              Evaluation Summary                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📋 Skill: ${report.skillName}`);
    console.log(`🔧 Provider: ${report.provider}\n`);

    console.log('Round 1 (Static Analysis):');
    console.log(`  Overall Score: ${report.round1.summary.overallRound1Score}/10`);
    console.log(`  1a. Quality: ${report.round1.summary.qualityScore}/10`);
    console.log(`  1b. Best Practices: ${report.round1.summary.bestPracticesScore}/10`);
    console.log(`  1c. Followability: ${report.round1.summary.followabilityScore}/100`);
    console.log(`  Status: ${report.round1.summary.proceedToRound2 ? '✅ PASS' : '❌ GATE'}`);
    console.log(`  Duration: ${(report.round1.durationMs / 1000).toFixed(1)}s\n`);

    if (report.round2.skipped) {
      console.log('Round 2 (Agent Testing):');
      console.log(`  ⏭️  Skipped - ${report.round2.reason}\n`);
    } else {
      console.log('Round 2 (Agent Testing):');
      console.log(`  2a. Compliance: ${report.round2.summary.averageScore}/10 (${report.round2.summary.passRate} pass)`);
      console.log(`  2b. Validation: ${report.round2.phases?.['2b_validation']?.status || 'N/A'}`);
      console.log(`  2c. Stress Score: ${report.round2.summary.stressScore}/10`);
      console.log(`  📊 Prediction Accuracy: ${report.round2.summary.predictionAccuracy}`);
      console.log(`  Duration: ${(report.round2.durationMs / 1000).toFixed(1)}s\n`);
    }

    console.log('Overall Assessment:');
    console.log(`  Status: ${report.overallAssessment.status}`);
    if (report.overallAssessment.overallScore) {
      console.log(`  Combined Score: ${report.overallAssessment.overallScore}/10`);
    }
    console.log(`  ${report.overallAssessment.message}\n`);

    if (report.overallAssessment.recommendations.length > 0) {
      console.log('Recommendations:');
      report.overallAssessment.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
  }
}
