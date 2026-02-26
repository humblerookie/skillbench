/**
 * OpenClaw Provider
 * Uses OpenClaw's existing auth (extracted or agent-based)
 */

import { AnthropicProvider } from './anthropic-provider.js';
import { BaseProvider } from './base-provider.js';

export class OpenClawProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.initialized = false;
    this.delegateProvider = null;
  }

  async _initialize() {
    if (this.initialized) return;

    try {
      // Try to extract API key from OpenClaw config
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Attempt to get Anthropic key from OpenClaw
      const { stdout } = await execAsync(
        'openclaw config get auth.profiles.anthropic:openclaw.apiKey 2>&1 || echo ""'
      );
      const apiKey = stdout.trim();
      
      if (apiKey && apiKey.startsWith('sk-ant-')) {
        // Use extracted key with Anthropic provider
        this.delegateProvider = new AnthropicProvider({ apiKey });
        console.log('✅ OpenClaw provider: Using extracted Anthropic key');
      } else {
        throw new Error('Could not extract OpenClaw API key');
      }
    } catch (error) {
      throw new Error(
        'OpenClaw provider requires running inside OpenClaw with configured auth. ' +
        'Use AnthropicProvider or OpenAIProvider with explicit API key instead.'
      );
    }

    this.initialized = true;
  }

  async complete(params) {
    await this._initialize();
    return await this.delegateProvider.complete(params);
  }

  getName() {
    return 'openclaw';
  }

  getModels() {
    return [
      'claude-opus-4',
      'claude-sonnet-4',
      'claude-sonnet-4-5',
    ];
  }
}
