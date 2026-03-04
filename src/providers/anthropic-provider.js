/**
 * Anthropic (Claude) Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base-provider.js';

export class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    
    if (!config.apiKey) {
      throw new Error('Anthropic provider requires apiKey');
    }
    
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async complete(params) {
    const { messages, model = 'claude-sonnet-4', temperature = 0.0, max_tokens = 2000 } = params;

    const response = await this.client.messages.create({
      model: this.mapModel(model),
      messages,
      max_tokens,
      temperature,
    });

    return {
      content: response.content[0].text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      raw: response,
    };
  }

  getName() {
    return 'anthropic';
  }

  getModels() {
    return [
      'claude-opus-4',
      'claude-sonnet-4',
      'claude-sonnet-4-5',
      'claude-sonnet-3-5',
      'claude-haiku-3-5',
    ];
  }

  mapModel(model) {
    // Map generic names to Anthropic-specific
    const modelMap = {
      'sonnet': 'claude-sonnet-4',
      'opus': 'claude-opus-4',
      'haiku': 'claude-haiku-3-5',
    };
    
    return modelMap[model] || model;
  }
}
