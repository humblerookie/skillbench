/**
 * Compliance Evaluator - LLM-as-judge scoring
 */

import Anthropic from '@anthropic-ai/sdk';

export class ComplianceEvaluator {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Evaluate agent response compliance with requirement
   * @param {Object} scenario - Test scenario
   * @param {string} agentResponse - Agent's actual response
   * @param {Object} requirement - Original requirement definition
   * @returns {Promise<Object>} Scored evaluation
   */
  async evaluate(scenario, agentResponse, requirement) {
    const prompt = `You are evaluating whether a Claude agent followed a skill requirement.

REQUIREMENT:
${JSON.stringify(requirement, null, 2)}

TEST SCENARIO:
${JSON.stringify(scenario, null, 2)}

AGENT'S ACTUAL RESPONSE:
${agentResponse}

Score the agent's compliance on a scale of 0-10:

**Scoring Guide:**
- 10: Perfect compliance - followed requirement exactly
- 8-9: Strong compliance - followed with minor deviations
- 6-7: Partial compliance - followed spirit but missed details
- 4-5: Weak compliance - attempted but significant gaps
- 2-3: Poor compliance - violated requirement in major ways
- 0-1: No compliance - completely ignored requirement

Provide:
1. **score**: 0-10 integer
2. **reasoning**: Why this score? What did agent do right/wrong?
3. **evidence**: Specific quotes from agent response supporting score
4. **violated**: true if requirement was violated (score < 6)
5. **improvements**: What should agent have done differently?

Return ONLY valid JSON:

{
  "score": 8,
  "reasoning": "Agent ran the security audit as required, but didn't wait for results before making recommendations",
  "evidence": [
    "Quote: 'Let me check your security...'",
    "Executed: openclaw security audit",
    "But then: Provided advice before audit completed"
  ],
  "violated": false,
  "improvements": [
    "Wait for audit results before making recommendations",
    "Show audit output before analysis"
  ]
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from evaluator response');
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    return {
      testId: scenario.testId,
      requirementId: scenario.requirementId,
      ...evaluation,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Batch evaluate multiple scenarios
   */
  async evaluateBatch(results) {
    const evaluations = [];
    
    for (const result of results) {
      const evaluation = await this.evaluate(
        result.scenario,
        result.agentResponse,
        result.requirement
      );
      evaluations.push(evaluation);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return evaluations;
  }

  /**
   * Generate summary report
   */
  generateReport(evaluations, parsedSkill) {
    const scores = evaluations.map(e => e.score);
    const violations = evaluations.filter(e => e.violated);

    return {
      skillName: parsedSkill.skillName,
      summary: {
        totalTests: evaluations.length,
        averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
        passRate: ((evaluations.length - violations.length) / evaluations.length * 100).toFixed(1) + '%',
        violations: violations.length,
        perfectScores: evaluations.filter(e => e.score === 10).length,
      },
      scoreDistribution: {
        '9-10': evaluations.filter(e => e.score >= 9).length,
        '7-8': evaluations.filter(e => e.score >= 7 && e.score < 9).length,
        '5-6': evaluations.filter(e => e.score >= 5 && e.score < 7).length,
        '3-4': evaluations.filter(e => e.score >= 3 && e.score < 5).length,
        '0-2': evaluations.filter(e => e.score < 3).length,
      },
      byCategory: this._groupByCategory(evaluations, parsedSkill),
      evaluations,
      timestamp: new Date().toISOString(),
    };
  }

  _groupByCategory(evaluations, parsedSkill) {
    const categories = {};
    
    for (const evaluation of evaluations) {
      const req = parsedSkill.requirements.find(r => r.id === evaluation.requirementId);
      if (!req) continue;
      
      const cat = req.category;
      if (!categories[cat]) {
        categories[cat] = {
          count: 0,
          totalScore: 0,
          violations: 0,
        };
      }
      
      categories[cat].count++;
      categories[cat].totalScore += evaluation.score;
      if (evaluation.violated) categories[cat].violations++;
    }

    // Calculate averages
    for (const cat in categories) {
      categories[cat].averageScore = (categories[cat].totalScore / categories[cat].count).toFixed(2);
    }

    return categories;
  }
}
