/**
 * Config - Configuration management for Botok tokenizer
 * Ported from botok/config.py
 */

/**
 * Configuration class for managing tokenizer settings
 * Handles profiles, paths, and tokenization parameters
 */
export class Config {
  public readonly profile: string;
  public readonly dialectPackPath: string;
  public readonly dictionary: Record<string, any>;
  public readonly adjustments: Record<string, any>;

  constructor(
    profile: string = 'general',
    dialectPackPath?: string,
    dictionary?: Record<string, any>,
    adjustments?: Record<string, any>
  ) {
    this.profile = profile;
    this.dialectPackPath = dialectPackPath || './resources';
    this.dictionary = dictionary || {};
    this.adjustments = adjustments || {};
  }

  /**
   * Create config from a path
   */
  static fromPath(path: string): Config {
    return new Config('custom', path);
  }

  /**
   * Get base path for resources
   */
  getBasePath(): string {
    return this.dialectPackPath;
  }

  /**
   * Get dictionary path
   */
  getDictionaryPath(): string {
    return `${this.dialectPackPath}/dictionary`;
  }

  /**
   * Get adjustments path
   */
  getAdjustmentsPath(): string {
    return `${this.dialectPackPath}/adjustments`;
  }
}