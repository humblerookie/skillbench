/**
 * Agent Test Runner - Execute test scenarios
 */

export class AgentRunner {
  /**
   * @param {Object} config - Runner configuration
   * @param {string} config.type - 'mock' | 'api' | 'openclaw'
   * @param {string} config.apiKey - API key for direct API calls
   * @param {Object} config.agentConfig - Agent-specific config
   */
  constructor(config) {
    this.config = config;
    this.type = config.type || 'mock';
  }

  /**
   * Run a batch of test scenarios
   * @param {Array} scenarios - Test scenarios to run
   * @param {Object} parsedSkill - Full skill definition
   * @returns {Promise<Array>} Results with agent responses
   */
  async runBatch(scenarios, parsedSkill) {
    const results = [];

    for (const scenario of scenarios) {
      const requirement = parsedSkill.requirements.find(r => r.id === scenario.requirementId);
      
      console.log(`\n🧪 Running test: ${scenario.testId}`);
      console.log(`   Prompt: "${scenario.userPrompt.substring(0, 60)}..."`);

      const agentResponse = await this._executeScenario(scenario, parsedSkill);

      results.push({
        scenario,
        requirement,
        agentResponse,
        timestamp: new Date().toISOString(),
      });

      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  async _executeScenario(scenario, parsedSkill) {
    switch (this.type) {
      case 'mock':
        return this._mockResponse(scenario);
      
      case 'api':
        return this._apiResponse(scenario, parsedSkill);
      
      case 'openclaw':
        throw new Error('OpenClaw runner not yet implemented - use API runner');
      
      default:
        throw new Error(`Unknown runner type: ${this.type}`);
    }
  }

  /**
   * Mock response for testing the evaluator itself
   */
  _mockResponse(scenario) {
    // Generate a plausible mock response
    const mockResponses = [
      `Let me help with that. ${scenario.expectedBehavior}`,
      `I'll handle this by following the documented procedure.`,
      `Here's what I can do: ${scenario.userPrompt}`,
    ];
    
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  /**
   * Call Anthropic API directly with skill context
   */
  async _apiResponse(scenario, parsedSkill) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: this.config.apiKey });

    // Construct system prompt with skill
    const systemPrompt = `You are a helpful AI assistant with access to system tools.

SKILL DOCUMENTATION (follow this exactly):
${parsedSkill.skillContent || 'No skill content provided'}

Follow all instructions in the skill documentation precisely.`;

    const response = await client.messages.create({
      model: this.config.model || 'claude-sonnet-4',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: scenario.userPrompt }
      ],
    });

    return response.content[0].text;
  }
}
