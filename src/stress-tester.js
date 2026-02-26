/**
 * Skill Stress Testing Framework
 * 
 * Push skills to their limits to find weaknesses:
 * - Edge cases the skill didn't anticipate
 * - Ambiguous situations where guidance is unclear
 * - Conflicting requirements
 * - Partial/incomplete information
 * - Scale/complexity limits
 * - Cross-domain application
 */

export class SkillStressTester {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Generate stress test scenarios for a skill
   * @param {string} skillContent - SKILL.md content
   * @param {string} skillName - Skill name
   * @returns {Promise<Array>} Stress test scenarios
   */
  async generateStressTests(skillContent, skillName) {
    console.log(`\n💥 Generating stress tests for "${skillName}"...\n`);

    const stressCategories = [
      'edge-cases',
      'ambiguity',
      'conflicting-requirements',
      'partial-information',
      'scale-complexity',
      'cross-domain',
      'adversarial'
    ];

    const scenarios = [];

    for (const category of stressCategories) {
      const categoryScenarios = await this._generateCategoryScenarios(
        skillContent,
        skillName,
        category
      );
      scenarios.push(...categoryScenarios);
    }

    return scenarios;
  }

  async _generateCategoryScenarios(skillContent, skillName, category) {
    const generators = {
      'edge-cases': this._generateEdgeCases.bind(this),
      'ambiguity': this._generateAmbiguityTests.bind(this),
      'conflicting-requirements': this._generateConflictTests.bind(this),
      'partial-information': this._generatePartialInfoTests.bind(this),
      'scale-complexity': this._generateScaleTests.bind(this),
      'cross-domain': this._generateCrossDomainTests.bind(this),
      'adversarial': this._generateAdversarialTests.bind(this)
    };

    return await generators[category](skillContent, skillName);
  }

  /**
   * Edge Cases: Scenarios the skill might not have anticipated
   */
  async _generateEdgeCases(skillContent, skillName) {
    const prompt = `Analyze this SKILL.md and generate 3 EDGE CASE scenarios that test its boundaries.

SKILL:
${skillContent.substring(0, 2000)}

Edge cases are valid use cases that the skill might not have explicitly covered:
- Unusual inputs or requirements
- Boundary conditions (very small, very large, zero, negative)
- Uncommon combinations of features
- Rare but valid user requests

Return JSON:
{
  "scenarios": [
    {
      "id": "EDGE-001",
      "category": "edge-cases",
      "userPrompt": "realistic edge case prompt",
      "challengeDescription": "why this is an edge case",
      "expectedBehavior": "what should happen",
      "potentialFailure": "how the agent might struggle"
    }
  ]
}`;

    try {
      const result = await this.provider.complete({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        return data.scenarios || [];
      }
    } catch (error) {
      console.warn(`  ⚠️  Edge case generation failed: ${error.message}`);
    }

    return [];
  }

  /**
   * Ambiguity: Situations where skill guidance is unclear
   */
  async _generateAmbiguityTests(skillContent, skillName) {
    const prompt = `Analyze this SKILL.md and identify 3 AMBIGUOUS scenarios where the skill's guidance is unclear.

SKILL:
${skillContent.substring(0, 2000)}

Ambiguous scenarios:
- Two interpretations of the same instruction
- Unclear priorities when rules conflict
- Missing guidance for common situations
- Vague terminology that could mean different things

Return JSON:
{
  "scenarios": [
    {
      "id": "AMBIG-001",
      "category": "ambiguity",
      "userPrompt": "prompt that could be interpreted multiple ways",
      "ambiguity": "what's unclear in the skill",
      "interpretation1": "one valid interpretation",
      "interpretation2": "another valid interpretation",
      "potentialFailure": "how agent might guess wrong"
    }
  ]
}`;

    try {
      const result = await this.provider.complete({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        return data.scenarios || [];
      }
    } catch (error) {
      console.warn(`  ⚠️  Ambiguity test generation failed: ${error.message}`);
    }

    return [];
  }

  /**
   * Conflicting Requirements: When rules seem to contradict
   */
  async _generateConflictTests(skillContent, skillName) {
    const prompt = `Analyze this SKILL.md and find 2 scenarios where requirements CONFLICT.

SKILL:
${skillContent.substring(0, 2000)}

Conflicting requirements:
- Two rules that seem contradictory
- Constraints that can't all be satisfied
- Trade-offs the skill doesn't address
- Priority unclear when rules clash

Return JSON:
{
  "scenarios": [
    {
      "id": "CONFLICT-001",
      "category": "conflicting-requirements",
      "userPrompt": "prompt that triggers conflicting rules",
      "requirement1": "first requirement",
      "requirement2": "conflicting requirement",
      "conflictDescription": "why they conflict",
      "potentialFailure": "how agent might handle it poorly"
    }
  ]
}`;

    try {
      const result = await this.provider.complete({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        return data.scenarios || [];
      }
    } catch (error) {
      console.warn(`  ⚠️  Conflict test generation failed: ${error.message}`);
    }

    return [];
  }

  /**
   * Partial Information: Incomplete user prompts
   */
  async _generatePartialInfoTests(skillContent, skillName) {
    return [
      {
        id: 'PARTIAL-001',
        category: 'partial-information',
        userPrompt: 'Create a landing page',
        challengeDescription: 'Minimal prompt - missing audience, purpose, style preferences',
        expectedBehavior: 'Agent should ask clarifying questions OR make reasonable assumptions with design thinking',
        potentialFailure: 'Agent might skip design thinking or make poor default choices'
      },
      {
        id: 'PARTIAL-002',
        category: 'partial-information',
        userPrompt: 'Make it look professional',
        challengeDescription: 'Vague aesthetic requirement - what does "professional" mean?',
        expectedBehavior: 'Agent should define what professional means in context',
        potentialFailure: 'Agent might default to generic corporate look (Inter font, blue colors)'
      }
    ];
  }

  /**
   * Scale/Complexity: Push the limits
   */
  async _generateScaleTests(skillContent, skillName) {
    return [
      {
        id: 'SCALE-001',
        category: 'scale-complexity',
        userPrompt: 'Create a complete design system with 50 components, 10 color themes, responsive layouts, dark mode, animations, and accessibility',
        challengeDescription: 'Overwhelming complexity - many requirements at once',
        expectedBehavior: 'Agent should break down into phases or ask to scope',
        potentialFailure: 'Agent might try to do everything at once and deliver poor quality'
      },
      {
        id: 'SCALE-002',
        category: 'scale-complexity',
        userPrompt: 'Design a single button',
        challengeDescription: 'Extremely minimal scope - where does skill guidance apply?',
        expectedBehavior: 'Agent should still apply design thinking (purpose, context)',
        potentialFailure: 'Agent might over-engineer or under-think such a small task'
      }
    ];
  }

  /**
   * Cross-Domain: Apply skill outside intended domain
   */
  async _generateCrossDomainTests(skillContent, skillName) {
    const prompt = `Given this SKILL.md, generate 2 scenarios that apply it OUTSIDE its intended domain.

SKILL:
${skillContent.substring(0, 2000)}

Cross-domain tests:
- Use the skill for something it wasn't designed for
- Apply principles to different medium/context
- Test if core concepts transfer

Return JSON:
{
  "scenarios": [
    {
      "id": "CROSS-001",
      "category": "cross-domain",
      "userPrompt": "prompt from different domain",
      "domainShift": "how this differs from intended use",
      "expectedBehavior": "whether skill should still apply",
      "potentialFailure": "how agent might misapply guidance"
    }
  ]
}`;

    try {
      const result = await this.provider.complete({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1500
      });

      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        return data.scenarios || [];
      }
    } catch (error) {
      console.warn(`  ⚠️  Cross-domain test generation failed: ${error.message}`);
    }

    return [];
  }

  /**
   * Adversarial: Prompts designed to confuse or trick the agent
   */
  async _generateAdversarialTests(skillContent, skillName) {
    return [
      {
        id: 'ADV-001',
        category: 'adversarial',
        userPrompt: 'Make it look good but also bad, modern but vintage, minimal but with lots of content',
        challengeDescription: 'Contradictory requirements designed to confuse',
        expectedBehavior: 'Agent should identify contradictions and ask for clarification',
        potentialFailure: 'Agent might try to satisfy all constraints and create incoherent design'
      },
      {
        id: 'ADV-002',
        category: 'adversarial',
        userPrompt: 'Use the latest trendy fonts that everyone loves',
        challengeDescription: 'Vague reference to "trendy" might lead to banned fonts',
        expectedBehavior: 'Agent should choose distinctive fonts per skill guidance, not follow "trendy" suggestion',
        potentialFailure: 'Agent might pick Space Grotesk or Inter because they\'re popular'
      }
    ];
  }

  /**
   * Run stress test and evaluate response
   */
  async runStressTest(scenario, skillContent, agentResponse) {
    const evaluationPrompt = `Evaluate this agent response to a STRESS TEST scenario.

SCENARIO (${scenario.category}):
${JSON.stringify(scenario, null, 2)}

AGENT RESPONSE:
${agentResponse}

SKILL REQUIREMENTS:
${skillContent.substring(0, 1500)}

Score the response on stress test criteria:

1. **Resilience** (0-10): How well did the agent handle the challenging scenario?
2. **Judgment** (0-10): Did agent make good decisions when guidance was unclear?
3. **Graceful Degradation** (0-10): If agent couldn't fully comply, did it handle it well?
4. **Skill Gaps Revealed** (list): What weaknesses in the skill did this expose?

Return JSON:
{
  "resilience_score": 0-10,
  "judgment_score": 0-10,
  "graceful_degradation_score": 0-10,
  "overall_score": 0-10,
  "skill_gaps": ["gap1", "gap2"],
  "agent_strengths": ["what agent did well"],
  "agent_weaknesses": ["what agent struggled with"],
  "skill_improvements": ["how to improve the skill based on this test"],
  "reasoning": "detailed analysis"
}`;

    try {
      const result = await this.provider.complete({
        messages: [{ role: 'user', content: evaluationPrompt }],
        temperature: 0.0,
        max_tokens: 1000
      });

      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (error) {
      console.error(`  ❌ Stress test evaluation failed: ${error.message}`);
    }

    return null;
  }

  /**
   * Generate comprehensive stress test report
   */
  generateStressTestReport(results) {
    const byCategory = {};
    results.forEach(r => {
      if (!byCategory[r.scenario.category]) {
        byCategory[r.scenario.category] = [];
      }
      byCategory[r.scenario.category].push(r);
    });

    const allGaps = [];
    const allImprovements = [];
    
    results.forEach(r => {
      if (r.evaluation?.skill_gaps) allGaps.push(...r.evaluation.skill_gaps);
      if (r.evaluation?.skill_improvements) allImprovements.push(...r.evaluation.skill_improvements);
    });

    return {
      summary: {
        totalTests: results.length,
        averageResilience: this._average(results.map(r => r.evaluation?.resilience_score || 0)),
        averageJudgment: this._average(results.map(r => r.evaluation?.judgment_score || 0)),
        averageGracefulDegradation: this._average(results.map(r => r.evaluation?.graceful_degradation_score || 0)),
        overallStressScore: this._average(results.map(r => r.evaluation?.overall_score || 0))
      },
      byCategory,
      skillGaps: [...new Set(allGaps)],
      recommendedImprovements: [...new Set(allImprovements)],
      results
    };
  }

  _average(arr) {
    if (arr.length === 0) return 0;
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  }
}
