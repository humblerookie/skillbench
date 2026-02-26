/**
 * Two-Round Evaluation System
 * 
 * Round 1: Skill Quality - Does SKILL.md follow best practices?
 * Round 2: Skill Effectiveness - Do agents follow the skill correctly?
 */

import { SkillQualityEvaluator } from './skill-quality-evaluator.js';
import { SkillEvaluatorV2 } from './evaluator-v2.js';
import fs from 'fs';

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
      scenariosPerRequirement = 2
    } = options;

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         Two-Round Skill Evaluation                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Read skill file
    const skillContent = fs.readFileSync(skillPath, 'utf-8');
    const skillName = this._extractSkillName(skillContent, skillPath);

    console.log(`📄 Skill: ${skillName}`);
    console.log(`📂 Path: ${skillPath}`);
    console.log(`🔧 Provider: ${provider}\n`);

    // ROUND 1: Skill Quality
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ROUND 1: Skill Quality Evaluation');
    console.log('  Does SKILL.md follow best practices?');
    console.log('═══════════════════════════════════════════════════════════\n');

    const round1Start = Date.now();
    const round1Report = await this._runRound1(skillContent, skillName, provider, apiKey);
    const round1Duration = Date.now() - round1Start;

    console.log(`\n✅ Round 1 complete (${(round1Duration / 1000).toFixed(1)}s)`);
    console.log(`   Score: ${round1Report.summary.overallScore}/10`);
    console.log(`   Status: ${round1Report.summary.overallScore >= 7 ? '✅ PASS' : '❌ NEEDS IMPROVEMENT'}\n`);

    // Print Round 1 issues
    this._printRound1Issues(round1Report);

    // Decide whether to proceed to Round 2
    const shouldProceedToRound2 = parseFloat(round1Report.summary.overallScore) >= 5.0;

    let round2Report = null;
    let round2Duration = 0;

    if (shouldProceedToRound2) {
      // ROUND 2: Agent Compliance
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  ROUND 2: Agent Compliance Evaluation');
      console.log('  Do agents follow the skill correctly?');
      console.log('═══════════════════════════════════════════════════════════\n');

      const round2Start = Date.now();
      round2Report = await this._runRound2(skillPath, skillName, provider, apiKey, scenariosPerRequirement);
      round2Duration = Date.now() - round2Start;

      console.log(`\n✅ Round 2 complete (${(round2Duration / 1000).toFixed(1)}s)`);
      console.log(`   Average Score: ${round2Report.summary.averageScore}/10`);
      console.log(`   Pass Rate: ${round2Report.summary.passRate}\n`);
    } else {
      console.log('\n⚠️  Skipping Round 2 - Skill quality too low (score < 5.0)');
      console.log('   Fix Round 1 issues first, then re-evaluate.\n');
    }

    // Generate combined report
    const combinedReport = {
      skillName,
      skillPath,
      evaluationDate: new Date().toISOString(),
      provider,
      twoRoundEvaluation: true,
      round1: {
        ...round1Report,
        durationMs: round1Duration
      },
      round2: round2Report ? {
        ...round2Report,
        durationMs: round2Duration
      } : {
        skipped: true,
        reason: 'Skill quality too low (Round 1 score < 5.0)'
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

    const qualityEvaluator = new SkillQualityEvaluator(providerInstance);
    return await qualityEvaluator.evaluate(skillContent, skillName);
  }

  async _runRound2(skillPath, skillName, provider, apiKey, scenariosPerRequirement) {
    const evaluator = provider === 'openclaw'
      ? new SkillEvaluatorV2({ provider: 'openclaw' })
      : new SkillEvaluatorV2({ provider, apiKey });

    // For now, return a placeholder
    // TODO: Integrate with existing evaluation pipeline
    return {
      skillName,
      round: 2,
      type: 'agent-compliance',
      summary: {
        totalTests: 0,
        averageScore: 'N/A',
        passRate: 'N/A',
        message: 'Round 2 integration in progress'
      },
      evaluations: []
    };
  }

  _extractSkillName(skillContent, skillPath) {
    const match = skillContent.match(/^---\n[\s\S]*?name:\s*([^\n]+)\n/);
    if (match) {
      return match[1].trim();
    }
    return skillPath.split('/').pop().replace(/\.md$/, '');
  }

  _printRound1Issues(report) {
    const failedChecks = report.checks.filter(c => !c.passed);
    
    if (failedChecks.length === 0) {
      console.log('   ✅ All checks passed!\n');
      return;
    }

    console.log('   Issues found:\n');
    failedChecks.forEach(check => {
      const icon = check.severity === 'critical' ? '🔴' : 
                   check.severity === 'warning' ? '🟡' : '🔵';
      console.log(`   ${icon} ${check.check} (${check.score}/10)`);
      check.issues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
      console.log(`      ➜ ${check.recommendation}\n`);
    });
  }

  _generateOverallAssessment(round1Report, round2Report) {
    const r1Score = parseFloat(round1Report.summary.overallScore);
    
    if (!round2Report || round2Report.skipped) {
      return {
        status: r1Score >= 7 ? 'NEEDS_ROUND_2' : 'NEEDS_IMPROVEMENT',
        message: r1Score >= 7
          ? 'Skill follows best practices. Proceed to Round 2 testing.'
          : `Skill quality needs improvement (${r1Score}/10). Fix Round 1 issues before agent testing.`,
        recommendations: round1Report.checks
          .filter(c => !c.passed)
          .map(c => c.recommendation)
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
        ...round1Report.checks.filter(c => !c.passed).map(c => `Round 1: ${c.recommendation}`),
        ...(round2Report.evaluations || [])
          .filter(e => e.violated)
          .map(e => `Round 2: ${e.improvements.join('; ')}`)
      ]
    };
  }

  _saveReport(report, outputDir, skillName) {
    const dir = `${outputDir}/${skillName}`;
    fs.mkdirSync(dir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${dir}/two-round-evaluation-${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📁 Report saved: ${filename}`);
  }

  _printSummary(report) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              Evaluation Summary                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📋 Skill: ${report.skillName}`);
    console.log(`🔧 Provider: ${report.provider}\n`);

    console.log('Round 1 (Skill Quality):');
    console.log(`  Score: ${report.round1.summary.overallScore}/10`);
    console.log(`  Status: ${parseFloat(report.round1.summary.overallScore) >= 7 ? '✅ PASS' : '❌ NEEDS WORK'}`);
    console.log(`  Duration: ${(report.round1.durationMs / 1000).toFixed(1)}s\n`);

    if (report.round2.skipped) {
      console.log('Round 2 (Agent Compliance):');
      console.log(`  ⏭️  Skipped - ${report.round2.reason}\n`);
    } else {
      console.log('Round 2 (Agent Compliance):');
      console.log(`  Score: ${report.round2.summary.averageScore}/10`);
      console.log(`  Pass Rate: ${report.round2.summary.passRate}`);
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
