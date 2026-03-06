/**
 * Claude Code Provider
 * Uses the locally installed Claude Code CLI (claude -p) with the user's
 * existing subscription — no API key required.
 */

import { spawn } from 'child_process';
import { BaseProvider } from './base-provider.js';

export class ClaudeCodeProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.model = config.model || 'sonnet';
  }

  async complete(params) {
    const { messages, model, max_tokens = 2000 } = params;

    // Separate system message from conversation
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    // Build user prompt
    const prompt = userMessages.map(m => m.content).join('\n\n');

    // Build args — prompt is passed via stdin to avoid shell quoting issues
    const args = [
      '-p',
      '--output-format', 'json',
      '--no-session-persistence',
      '--model', model || this.model,
    ];

    if (systemMsg) {
      args.push('--system-prompt', systemMsg.content);
    }

    const stdout = await new Promise((resolve, reject) => {
      // Unset Claude Code env vars so the subprocess doesn't think it's nested,
      // and remove API keys so claude CLI uses the user's subscription.
      const env = { ...process.env };
      delete env.CLAUDECODE;
      delete env.CLAUDE_CODE_ENTRYPOINT;
      delete env.ANTHROPIC_API_KEY;
      delete env.OPENAI_API_KEY;

      const child = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

      // Write prompt to stdin and close it
      child.stdin.write(prompt, 'utf8');
      child.stdin.end();

      let out = '';
      let err = '';
      child.stdout.on('data', d => { out += d; });
      child.stderr.on('data', d => { err += d; });

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('claude CLI timed out after 120s'));
      }, 120_000);

      child.on('close', code => {
        clearTimeout(timer);
        if (code !== 0) {
          const msg = err.trim() || out.trim() || `exited with code ${code}`;
          if (msg.includes('nested') || msg.includes('CLAUDECODE')) {
            reject(new Error(
              'ClaudeCodeProvider cannot be used inside a Claude Code session. ' +
              'Run evalanche from a regular terminal instead.'
            ));
          } else {
            reject(new Error(`claude CLI failed: ${msg}`));
          }
        } else {
          resolve(out);
        }
      });

      child.on('error', err => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn claude: ${err.message}`));
      });
    });

    let content;
    try {
      const parsed = JSON.parse(stdout);
      // claude --output-format json returns { result, ... }
      content = parsed.result ?? parsed.content ?? parsed.text ?? stdout.trim();
    } catch {
      content = stdout.trim();
    }

    return {
      content,
      usage: { input_tokens: 0, output_tokens: 0 }, // CLI doesn't expose token counts
    };
  }

  getName() {
    return 'claude-code';
  }

  getModels() {
    return ['sonnet', 'opus', 'haiku', 'claude-sonnet-4-5', 'claude-opus-4-5'];
  }
}
