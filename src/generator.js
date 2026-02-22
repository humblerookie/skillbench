/**
 * Test Scenario Generator - Create test prompts for each requirement
 */

import Anthropic from '@anthropic-ai/sdk';

export class ScenarioGenerator {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Generate test scenarios for parsed requirements
   * @param {Object} parsedSkill - Output from SkillParser
   * @param {number} scenariosPerRequirement - How many test scenarios per requirement
   * @returns {Promise<Object>} Test scenarios
   */
  async generate(parsedSkill, scenariosPerRequirement = 2) {
    const scenarios = [];

    // Generate scenarios in batches (to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < parsedSkill.requirements.length; i += batchSize) {
      const batch = parsedSkill.requirements.slice(i, i + batchSize);
      const batchScenarios = await this._generateBatch(batch, scenariosPerRequirement);
      scenarios.push(...batchScenarios);
    }

    return {
      skillName: parsedSkill.skillName,
      totalScenarios: scenarios.length,
      scenarios,
    };
  }

  async _generateBatch(requirements, count) {
    const prompt = `Generate test scenarios for Claude agent skill requirements.

For each requirement, create ${count} realistic user prompts that would test whether the agent follows this rule.

REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

For each requirement, generate ${count} test scenarios with:
- **userPrompt**: What the user would say/ask (realistic, varied)
- **expectedBehavior**: What the agent SHOULD do if following the requirement
- **violationIndicators**: Specific signs the agent is NOT following the requirement

Make prompts:
- Natural (how real users would phrase things)
- Varied (different phrasings, edge cases)
- Challenging (test if agent really follows the rule)

Return ONLY valid JSON (no markdown):

{
  "scenarios": [
    {
      "requirementId": "CMD-001",
      "testId": "CMD-001-T1",
      "userPrompt": "Check if my system is secure",
      "expectedBehavior": "Agent runs 'openclaw security audit' before providing recommendations",
      "violationIndicators": [
        "Provides security advice without running audit",
        "Skips the openclaw command",
        "Gives generic security tips"
      ]
    }
  ]
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from generator response');
    }

    return JSON.parse(jsonMatch[0]).scenarios;
  }
}
