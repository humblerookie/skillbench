/**
 * Round 1 Evaluator - Complete Static Analysis
 * 
 * Combines three sub-rounds (no agent testing required):
 * - 1a. Skill Quality (frontmatter, structure, conciseness)
 * - 1b. Best Practices (Anthropic guidelines compliance)
 * - 1c. Followability (predictive failure analysis)
 * 
 * All analysis is done without running agents → Fast & cheap!
 */

import { SkillQualityEvaluator } from './skill-quality-evaluator.js';
import { FollowabilityAnalyzer } from './followability-analyzer.js';

export class Round1Evaluator {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Run complete Round 1 analysis
   * @param {string} skillContent - SKILL.md content
   * @param {string} skillName - Skill name
   * @returns {Promise<Object>} Combined Round 1 report
   */
  async evaluate(skillContent, skillName) {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║           ROUND 1: Static Analysis (Pre-Flight)          ║');
    console.log('║           No agent testing - fast & free!                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const round1Start = Date.now();

    // Phase 1a: Skill Quality
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Phase 1a: Skill Quality');
    console.log('  Checking frontmatter, structure, conciseness');
    console.log('─────────────────────────────────────────────────────────────\n');

    const qualityEvaluator = new SkillQualityEvaluator(this.provider);
    const qualityReport = await qualityEvaluator.evaluate(skillContent, skillName);

    console.log(`✅ Phase 1a complete: ${qualityReport.summary.overallScore}/10\n`);

    // Phase 1b: Best Practices (deep check)
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Phase 1b: Best Practices Compliance');
    console.log('  Checking against Anthropic guidelines');
    console.log('─────────────────────────────────────────────────────────────\n');

    const bestPracticesReport = await this._checkBestPractices(skillContent, skillName);

    console.log(`✅ Phase 1b complete: ${bestPracticesReport.summary.complianceScore}/10\n`);

    // Phase 1c: Followability
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Phase 1c: Followability Analysis');
    console.log('  Predicting where agents will fail');
    console.log('─────────────────────────────────────────────────────────────\n');

    const followabilityAnalyzer = new FollowabilityAnalyzer();
    const followabilityReport = followabilityAnalyzer.analyze(skillContent, skillName);

    console.log(`✅ Phase 1c complete: ${followabilityReport.score}/100\n`);

    const round1Duration = Date.now() - round1Start;

    // Combine reports
    const combined = {
      skillName,
      round: 1,
      type: 'static-analysis',
      timestamp: new Date().toISOString(),
      durationMs: round1Duration,
      phases: {
        '1a_quality': qualityReport,
        '1b_best_practices': bestPracticesReport,
        '1c_followability': followabilityReport
      },
      summary: {
        qualityScore: parseFloat(qualityReport.summary.overallScore),
        bestPracticesScore: bestPracticesReport.summary.complianceScore,
        followabilityScore: followabilityReport.score,
        overallRound1Score: this._calculateOverallRound1Score(
          qualityReport,
          bestPracticesReport,
          followabilityReport
        ),
        totalIssues: this._countTotalIssues(qualityReport, bestPracticesReport, followabilityReport),
        criticalIssues: this._countCriticalIssues(qualityReport, bestPracticesReport, followabilityReport),
        proceedToRound2: this._shouldProceedToRound2(qualityReport, bestPracticesReport, followabilityReport)
      },
      recommendations: this._generateCombinedRecommendations(
        qualityReport,
        bestPracticesReport,
        followabilityReport
      )
    };

    // Print summary
    this._printRound1Summary(combined);

    return combined;
  }

  /**
   * Phase 1b: Deep check against Anthropic best practices
   */
  async _checkBestPractices(skillContent, skillName) {
    const checks = [];

    // Best Practice 1: Clear, specific descriptions
    checks.push(this._checkDescriptionClarity(skillContent));

    // Best Practice 2: Conciseness (assume Claude knowledge)
    checks.push(this._checkConciseness(skillContent));

    // Best Practice 3: Progressive disclosure for long content
    checks.push(this._checkProgressiveDisclosure(skillContent));

    // Best Practice 4: Workflows with checklists
    checks.push(this._checkWorkflowPresence(skillContent));

    // Best Practice 5: Examples and templates
    checks.push(this._checkExamplesPresence(skillContent));

    // Best Practice 6: Third-person voice
    checks.push(this._checkVoiceConsistency(skillContent));

    // Best Practice 7: No time-sensitive content
    checks.push(this._checkTimeSensitivity(skillContent));

    // Best Practice 8: Consistent terminology
    checks.push(this._checkTerminologyConsistency(skillContent));

    // Best Practice 9: Clear defaults with escape hatches
    checks.push(this._checkDefaultsPresence(skillContent));

    // Best Practice 10: Platform-agnostic paths
    checks.push(this._checkPathStyle(skillContent));

    const complianceScore = this._calculateComplianceScore(checks);

    return {
      phase: '1b',
      type: 'best-practices',
      summary: {
        complianceScore: complianceScore.toFixed(1),
        checksTotal: checks.length,
        checksPassed: checks.filter(c => c.passed).length,
        checksFailed: checks.filter(c => !c.passed).length,
        criticalIssues: checks.filter(c => c.severity === 'critical' && !c.passed).length
      },
      checks,
      recommendation: complianceScore >= 8
        ? 'Excellent compliance with best practices'
        : complianceScore >= 6
        ? 'Good compliance, minor improvements recommended'
        : 'Moderate compliance, several improvements needed'
    };
  }

  _checkDescriptionClarity(content) {
    const descMatch = content.match(/^---\n[\s\S]*?description:\s*([^\n]+)\n/m);
    const description = descMatch ? descMatch[1].trim() : '';

    const issues = [];
    let score = 10;

    if (!description) {
      return {
        check: 'Description Clarity',
        passed: false,
        severity: 'critical',
        score: 0,
        issues: ['No description found'],
        recommendation: 'Add clear description in frontmatter'
      };
    }

    // Should include "when to use"
    if (!/\b(use when|when|for|helps with)\b/i.test(description)) {
      issues.push('Description missing "when to use" guidance');
      score -= 3;
    }

    // Should be specific (not vague)
    const vagueWords = ['helps', 'assists', 'supports', 'stuff', 'things'];
    const hasVague = vagueWords.some(word => description.toLowerCase().includes(word));
    if (hasVague) {
      issues.push('Description contains vague words - be more specific');
      score -= 2;
    }

    // Should be third-person
    if (/\b(I|we|my|our)\b/i.test(description)) {
      issues.push('Description uses first person - use third person');
      score -= 2;
    }

    return {
      check: 'Description Clarity',
      passed: score >= 7,
      severity: score < 5 ? 'critical' : 'medium',
      score: Math.max(0, score),
      issues,
      recommendation: issues.length > 0
        ? 'Make description more specific and include "when to use"'
        : 'Description is clear and specific'
    };
  }

  _checkConciseness(content) {
    const lines = content.split('\n').length;
    const issues = [];
    let score = 10;

    // Over-explanation check
    const overExplained = [
      'for example, a PDF file',
      'JSON stands for',
      'this is because',
      'you might be wondering',
      'let me explain'
    ];

    overExplained.forEach(phrase => {
      if (content.toLowerCase().includes(phrase)) {
        issues.push(`Over-explanation detected: "${phrase}" - Claude already knows this`);
        score -= 2;
      }
    });

    // Length check
    if (lines > 500) {
      issues.push(`Skill is ${lines} lines - consider splitting (guideline: <500 lines)`);
      score -= 3;
    }

    return {
      check: 'Conciseness',
      passed: score >= 7,
      severity: 'medium',
      score: Math.max(0, score),
      issues,
      metadata: { lines },
      recommendation: issues.length > 0
        ? 'Remove unnecessary explanations - assume Claude knowledge'
        : 'Skill is appropriately concise'
    };
  }

  _checkProgressiveDisclosure(content) {
    const lines = content.split('\n').length;
    const hasReferences = /\[[^\]]+\]\([^)]+\.md\)/.test(content);
    
    const issues = [];
    let score = 10;

    if (lines > 500 && !hasReferences) {
      issues.push('Long skill (>500 lines) without progressive disclosure - split into files');
      score = 4;
    } else if (lines > 300 && !hasReferences) {
      issues.push('Consider using progressive disclosure for >300 line skill');
      score = 7;
    }

    return {
      check: 'Progressive Disclosure',
      passed: score >= 7,
      severity: score < 5 ? 'high' : 'medium',
      score,
      issues,
      metadata: { lines, hasReferences },
      recommendation: issues.length > 0
        ? 'Use progressive disclosure: split into main SKILL.md + detailed .md files'
        : 'Progressive disclosure is appropriate for skill length'
    };
  }

  _checkWorkflowPresence(content) {
    const hasWorkflow = /##\s+(workflow|process|steps|checklist)/i.test(content);
    const hasChecklist = /- \[ \]/.test(content);
    const looksComplex = content.length > 2000;

    const issues = [];
    let score = 10;

    if (looksComplex && !hasWorkflow) {
      issues.push('Complex skill without workflow - add step-by-step process');
      score = 5;
    }

    if (hasWorkflow && !hasChecklist) {
      issues.push('Workflow present but no checklist - add checklist for tracking');
      score = 7;
    }

    return {
      check: 'Workflow & Checklists',
      passed: score >= 7,
      severity: 'medium',
      score,
      issues,
      metadata: { hasWorkflow, hasChecklist, looksComplex },
      recommendation: issues.length > 0
        ? 'Add workflow with checklist for complex skills'
        : 'Workflow is appropriate for skill complexity'
    };
  }

  _checkExamplesPresence(content) {
    const hasCodeBlocks = (content.match(/```/g) || []).length >= 2;
    const hasExample = /example:|for example|###\s+example/i.test(content);
    
    const issues = [];
    let score = 10;

    if (!hasCodeBlocks && !hasExample) {
      issues.push('No examples found - add concrete examples');
      score = 5;
    }

    return {
      check: 'Examples & Templates',
      passed: score >= 7,
      severity: 'medium',
      score,
      issues,
      metadata: { hasCodeBlocks, hasExample },
      recommendation: issues.length > 0
        ? 'Add concrete examples or templates'
        : 'Examples are present'
    };
  }

  _checkVoiceConsistency(content) {
    const firstPersonMatches = (content.match(/\b(I'll|I'm|we'll|we're|let's|my|our)\b/gi) || []).length;
    
    const issues = [];
    let score = 10;

    if (firstPersonMatches > 3) {
      issues.push(`Found ${firstPersonMatches} first-person references - use third person or imperative`);
      score = 6;
    }

    return {
      check: 'Voice Consistency',
      passed: score >= 7,
      severity: 'low',
      score,
      issues,
      recommendation: issues.length > 0
        ? 'Use third person or imperative mood, not first person'
        : 'Voice is consistent'
    };
  }

  _checkTimeSensitivity(content) {
    const timeSensitive = [
      /\b(before|after|until)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i,
      /\bcurrently\s+in\s+\d{4}/i,
      /\bas of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i
    ];

    const issues = [];
    let score = 10;

    timeSensitive.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`Time-sensitive content: "${matches[0]}" - use "Old patterns" section instead`);
        score -= 3;
      }
    });

    return {
      check: 'Time Sensitivity',
      passed: score >= 7,
      severity: 'medium',
      score: Math.max(0, score),
      issues,
      recommendation: issues.length > 0
        ? 'Remove time-sensitive info or move to "Old patterns" section'
        : 'No time-sensitive content detected'
    };
  }

  _checkTerminologyConsistency(content) {
    // Simple check for common inconsistencies
    const hasEndpoint = /\bendpoint\b/gi.test(content);
    const hasAPIRoute = /\bAPI route\b/gi.test(content);
    const hasURL = /\bURL\b/gi.test(content);

    const issues = [];
    let score = 10;

    const endpointTerms = [hasEndpoint, hasAPIRoute, hasURL].filter(Boolean).length;
    if (endpointTerms > 2) {
      issues.push('Possibly inconsistent terminology: endpoint/API route/URL - choose one');
      score = 7;
    }

    return {
      check: 'Terminology Consistency',
      passed: score >= 7,
      severity: 'low',
      score,
      issues,
      recommendation: issues.length > 0
        ? 'Use consistent terminology throughout'
        : 'Terminology appears consistent'
    };
  }

  _checkDefaultsPresence(content) {
    const hasOr = (content.match(/\bor\b/gi) || []).length;
    const hasDefault = /\bdefault\b|\brecommended\b|\bprefer\b/i.test(content);
    
    const issues = [];
    let score = 10;

    if (hasOr > 10 && !hasDefault) {
      issues.push('Many choices ("or") without clear defaults - provide recommended option');
      score = 6;
    }

    return {
      check: 'Clear Defaults',
      passed: score >= 7,
      severity: 'medium',
      score,
      issues,
      recommendation: issues.length > 0
        ? 'Provide default choice with escape hatch: "Use X (recommended). For Y scenario, use Z."'
        : 'Defaults are clear or not needed'
    };
  }

  _checkPathStyle(content) {
    const hasWindowsPaths = /[A-Z]:\\/.test(content) || /\\[a-zA-Z]/.test(content);
    
    const issues = [];
    let score = 10;

    if (hasWindowsPaths) {
      issues.push('Windows-style paths detected - use forward slashes for cross-platform compatibility');
      score = 5;
    }

    return {
      check: 'Platform-Agnostic Paths',
      passed: score >= 7,
      severity: 'medium',
      score,
      issues,
      recommendation: issues.length > 0
        ? 'Use forward slashes (/) not backslashes (\\)'
        : 'Paths are platform-agnostic'
    };
  }

  _calculateComplianceScore(checks) {
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    const maxScore = checks.length * 10;
    return (totalScore / maxScore) * 10;
  }

  _calculateOverallRound1Score(qualityReport, bestPracticesReport, followabilityReport) {
    // Weighted average
    const quality = parseFloat(qualityReport.summary.overallScore) * 0.3;  // 30%
    const bestPractices = parseFloat(bestPracticesReport.summary.complianceScore) * 0.3;  // 30%
    const followability = (followabilityReport.score / 10) * 0.4;  // 40% (most predictive)
    
    return parseFloat((quality + bestPractices + followability).toFixed(1));
  }

  _countTotalIssues(qualityReport, bestPracticesReport, followabilityReport) {
    return (
      qualityReport.summary.checksFailed +
      bestPracticesReport.summary.checksFailed +
      followabilityReport.predictions.length
    );
  }

  _countCriticalIssues(qualityReport, bestPracticesReport, followabilityReport) {
    return (
      qualityReport.summary.criticalIssues +
      bestPracticesReport.summary.criticalIssues +
      followabilityReport.predictions.filter(p => p.severity === 'high').length
    );
  }

  _shouldProceedToRound2(qualityReport, bestPracticesReport, followabilityReport) {
    const qualityScore = parseFloat(qualityReport.summary.overallScore);
    const bestPracticesScore = parseFloat(bestPracticesReport.summary.complianceScore);
    const followabilityScore = followabilityReport.score;

    // Proceed if:
    // - Quality >= 5.0 AND
    // - Best practices >= 5.0 AND
    // - Followability >= 50
    return qualityScore >= 5.0 && bestPracticesScore >= 5.0 && followabilityScore >= 50;
  }

  _generateCombinedRecommendations(qualityReport, bestPracticesReport, followabilityReport) {
    const recommendations = [];

    // Add top issues from each phase
    qualityReport.checks
      .filter(c => !c.passed && c.severity === 'critical')
      .forEach(c => recommendations.push(`[1a-Quality] ${c.recommendation}`));

    bestPracticesReport.checks
      .filter(c => !c.passed && c.severity === 'critical')
      .forEach(c => recommendations.push(`[1b-Best Practices] ${c.recommendation}`));

    followabilityReport.predictions
      .filter(p => p.severity === 'high' && p.probability >= 0.6)
      .slice(0, 3)
      .forEach(p => {
        const rec = p.recommendation || followabilityReport.checks.find(c => c.check === p.checkName)?.recommendation || p.reason;
        recommendations.push(`[1c-Followability] ${rec}`);
      });

    return recommendations;
  }

  _printRound1Summary(report) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              ROUND 1 SUMMARY                              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Overall Round 1 Score: ${report.summary.overallRound1Score}/10\n`);

    console.log('Phase Scores:');
    console.log(`  1a. Skill Quality:       ${report.summary.qualityScore}/10`);
    console.log(`  1b. Best Practices:      ${report.summary.bestPracticesScore}/10`);
    console.log(`  1c. Followability:       ${report.summary.followabilityScore}/100\n`);

    console.log(`Issues Found:`);
    console.log(`  Total: ${report.summary.totalIssues}`);
    console.log(`  Critical: ${report.summary.criticalIssues}\n`);

    if (report.recommendations.length > 0) {
      console.log('🔧 Top Recommendations:');
      report.recommendations.slice(0, 5).forEach(rec => {
        console.log(`   • ${rec}`);
      });
      console.log('');
    }

    console.log('─────────────────────────────────────────────────────────────');
    if (report.summary.proceedToRound2) {
      console.log('✅ PASS - Ready for Round 2 (Agent Testing)');
      if (report.summary.criticalIssues > 0) {
        console.log('⚠️  Recommend fixing critical issues first for better results');
      }
    } else {
      console.log('❌ GATE - Fix critical issues before Round 2');
      console.log('   Round 2 testing would likely show poor results');
    }
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log(`⏱️  Round 1 Duration: ${(report.durationMs / 1000).toFixed(1)}s\n`);
  }
}
