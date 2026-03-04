/**
 * OpenAI (GPT-4, Codex) Provider
 */

import { BaseProvider } from './base-provider.js';

export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    
    if (!config.apiKey) {
      throw new Error('OpenAI provider requires apiKey');
    }
    
    this.apiKey = config.apiKey;
    this.client = null;
  }

  async _initClient() {
    if (this.client) return;
    
    try {
      const { default: OpenAI } = await import('openai');
      this.client = new OpenAI({ apiKey: this.apiKey });
    } catch (error) {
      throw new Error(
        'OpenAI SDK not installed. Install it with: npm install openai\n' +
        'Or use a different provider: provider="anthropic" or provider="openclaw"'
      );
    }
  }

  async complete(params) {
    await this._initClient();
    
    const { messages, model = 'gpt-4-turbo-preview', temperature = 0.0, max_tokens = 2000 } = params;

    const response = await this.client.chat.completions.create({
      model: this.mapModel(model),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens,
      temperature,
    });

    return {
      content: response.choices[0].message.content,
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
      },
      raw: response,
    };
  }

  getName() {
    return 'openai';
  }

  getModels() {
    return [
      'gpt-4',
      'gpt-4-turbo-preview',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-3.5-turbo',
    ];
  }

  mapModel(model) {
    // Map generic/Claude names to OpenAI equivalents
    const modelMap = {
      'claude-opus-4': 'gpt-4',
      'claude-sonnet-4': 'gpt-4-turbo-preview',
      'claude-sonnet-4-5': 'gpt-4-turbo-preview',
      'claude-haiku-3-5': 'gpt-3.5-turbo',
      'sonnet': 'gpt-4-turbo-preview',
      'opus': 'gpt-4',
      'haiku': 'gpt-3.5-turbo',
    };
    
    return modelMap[model] || model;
  }
}
