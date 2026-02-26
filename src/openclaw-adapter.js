/**
 * OpenClaw API Adapter - Use OpenClaw's existing auth instead of direct Anthropic API
 * 
 * This adapter allows the running agent to use its own Claude access
 * for evaluation tasks without needing a separate API key.
 */

import Anthropic from '@anthropic-ai/sdk';

export class OpenClawAdapter {
  constructor() {
    // Initialize Anthropic client using OpenClaw's configured auth
    // We'll extract the API key from OpenClaw's config
    this.client = null;
    this._initializeClient();
  }

  async _initializeClient() {
    try {
      // Try to read API key from OpenClaw config
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Get the API key that OpenClaw is using
      const { stdout } = await execAsync('openclaw config get auth.profiles.anthropic:openclaw.apiKey 2>&1 || echo ""');
      const apiKey = stdout.trim();
      
      if (apiKey && apiKey.startsWith('sk-ant-')) {
        this.client = new Anthropic({ apiKey });
      } else {
        // Fallback: If we can't extract the key, we're likely running inside an agent
        // that already has access. We'll simulate the API using direct responses.
        console.warn('⚠️  Could not extract OpenClaw API key, using fallback mode');
        this.fallbackMode = true;
      }
    } catch (error) {
      console.warn('⚠️  OpenClaw auth extraction failed, using fallback mode');
      this.fallbackMode = true;
    }
  }

  /**
   * Implement Anthropic messages.create API using OpenClaw's auth
   */
  get messages() {
    return {
      create: async (params) => {
        // Wait for client initialization
        if (!this.client && !this.fallbackMode) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (this.client) {
          // Use the extracted API key
          return await this.client.messages.create(params);
        } else {
          // Fallback: Return a structured error that suggests manual evaluation
          throw new Error(
            'OpenClaw integration requires agent-based evaluation. ' +
            'Please ask the agent directly to evaluate the skill instead of running this script.'
          );
        }
      }
    };
  }
}

/**
 * Alternative: Use OpenClaw's gateway WebSocket API directly
 */
export class OpenClawWebSocketAdapter {
  constructor() {
    this.gatewayUrl = 'ws://127.0.0.1:18789';
  }

  get messages() {
    return {
      create: async (params) => {
        // TODO: Implement WebSocket connection to OpenClaw gateway
        // This would be more efficient than spawning CLI processes
        throw new Error('WebSocket adapter not implemented yet. Use OpenClawAdapter for CLI-based routing.');
      }
    };
  }
}
