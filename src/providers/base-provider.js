/**
 * Base Provider Interface
 * All LLM providers must implement this interface
 */

export class BaseProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generate completion
   * @param {Object} params - { messages, model, temperature, max_tokens }
   * @returns {Promise<Object>} - { content, usage: { input_tokens, output_tokens } }
   */
  async complete(params) {
    throw new Error('Provider must implement complete()');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    throw new Error('Provider must implement getName()');
  }

  /**
   * Get available models
   * @returns {Array<string>}
   */
  getModels() {
    throw new Error('Provider must implement getModels()');
  }

  /**
   * Map generic model name to provider-specific
   * @param {string} model
   * @returns {string}
   */
  mapModel(model) {
    return model;
  }
}
