/**
 * Skill Parser - Extract testable requirements from SKILL.md
 */

import Anthropic from '@anthropic-ai/sdk';

export class SkillParser {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Parse SKILL.md and extract testable requirements
   * @param {string} skillContent - Raw SKILL.md content
   * @returns {Promise<Object>} Parsed requirements by category
   */
  async parse(skillContent) {
    const prompt = `You are analyzing a Claude agent skill document (SKILL.md). Extract ALL testable requirements into structured categories.

SKILL.MD CONTENT:
${skillContent}

Extract requirements into these categories:

1. **Commands/Actions** - Specific actions the agent must perform
   - Example: "Run openclaw security audit --deep"
   
2. **Constraints** - Rules/limits the agent must obey
   - Example: "Never modify firewall without confirmation"
   
3. **Workflow Steps** - Sequential procedures to follow
   - Example: "1. Check context 2. Determine risk 3. Produce plan"
   
4. **Format Requirements** - Output/response formatting rules
   - Example: "Provide numbered choices so user can reply with single digit"
   
5. **Conditional Logic** - If/then rules
   - Example: "If unsure, ask before acting"

For each requirement, extract:
- **id**: Unique identifier (e.g., "CMD-001", "WF-003")
- **category**: One of the 5 categories above
- **description**: Clear statement of the requirement
- **location**: Line/section reference in SKILL.md (if identifiable)
- **priority**: critical | high | medium | low
- **testable**: true/false (can this be tested programmatically?)

Return ONLY valid JSON (no markdown, no explanation):

{
  "skillName": "extracted from SKILL.md",
  "requirements": [
    {
      "id": "CMD-001",
      "category": "command",
      "description": "Run openclaw security audit before making recommendations",
      "location": "Step 1",
      "priority": "critical",
      "testable": true
    }
  ],
  "metadata": {
    "totalRequirements": 0,
    "criticalCount": 0,
    "testableCount": 0
  }
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from parser response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Calculate metadata
    parsed.metadata = {
      totalRequirements: parsed.requirements.length,
      criticalCount: parsed.requirements.filter(r => r.priority === 'critical').length,
      testableCount: parsed.requirements.filter(r => r.testable).length,
    };

    return parsed;
  }
}
