/**
 * OpenAI API Adapter for Evalanche
 * Use GPT-4 instead of Claude for evaluations
 */

import OpenAI from 'openai';

export class OpenAIAdapter {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Implement Anthropic-compatible API using OpenAI
   */
  get messages() {
    return {
      create: async (params) => {
        const { model, messages, max_tokens, temperature } = params;
        
        // Map Anthropic model names to OpenAI
        const modelMap = {
          'claude-sonnet-4': 'gpt-4-turbo-preview',
          'claude-sonnet-4-5': 'gpt-4-turbo-preview',
          'claude-opus-4': 'gpt-4',
        };
        
        const openaiModel = modelMap[model] || 'gpt-4-turbo-preview';
        
        // OpenAI API call
        const response = await this.client.chat.completions.create({
          model: openaiModel,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          max_tokens: max_tokens,
          temperature: temperature,
        });
        
        // Transform to Anthropic-compatible format
        return {
          id: response.id,
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: response.choices[0].message.content
            }
          ],
          model: openaiModel,
          stop_reason: response.choices[0].finish_reason,
          usage: {
            input_tokens: response.usage.prompt_tokens,
            output_tokens: response.usage.completion_tokens
          }
        };
      }
    };
  }
}
