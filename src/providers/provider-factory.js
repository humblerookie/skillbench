/**
 * Provider Factory
 * Automatically instantiates the correct provider based on config
 */

import { AnthropicProvider } from './anthropic-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { OpenClawProvider } from './openclaw-provider.js';

export class ProviderFactory {
  /**
   * Create provider from config
   * @param {Object} config - { provider: 'anthropic'|'openai'|'openclaw', apiKey?, ... }
   * @returns {BaseProvider}
   */
  static create(config) {
    const { provider = 'anthropic', ...rest } = config;

    switch (provider.toLowerCase()) {
      case 'anthropic':
      case 'claude':
        return new AnthropicProvider(rest);
      
      case 'openai':
      case 'gpt':
      case 'codex':
        return new OpenAIProvider(rest);
      
      case 'openclaw':
        return new OpenClawProvider(rest);
      
      default:
        throw new Error(
          `Unknown provider: ${provider}. ` +
          `Supported: anthropic, openai, openclaw`
        );
    }
  }

  /**
   * Auto-detect provider from environment
   * @returns {BaseProvider}
   */
  static autoDetect() {
    if (process.env.OPENAI_API_KEY) {
      console.log('🔍 Auto-detected: OpenAI (OPENAI_API_KEY found)');
      return new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('🔍 Auto-detected: Anthropic (ANTHROPIC_API_KEY found)');
      return new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    
    // Try OpenClaw as fallback
    console.log('🔍 Auto-detected: OpenClaw (no API keys in env)');
    return new OpenClawProvider();
  }

  /**
   * List available providers
   * @returns {Array<string>}
   */
  static list() {
    return ['anthropic', 'openai', 'openclaw'];
  }
}
