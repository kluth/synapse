/**
 * Macrophage - Input Sanitization System
 *
 * Inspired by macrophages in the immune system, which consume and break down
 * pathogens and foreign substances. In our framework, Macrophage handles:
 * - HTML sanitization (prevent XSS)
 * - SQL sanitization (prevent SQL injection)
 * - Path sanitization (prevent path traversal)
 * - Command sanitization (prevent command injection)
 * - Data validation and cleaning
 *
 * @module Macrophage
 */

import { EventEmitter } from 'events';

/**
 * Sanitization type
 */
export type SanitizationType =
  | 'html'
  | 'sql'
  | 'path'
  | 'command'
  | 'email'
  | 'url'
  | 'alphanumeric'
  | 'numeric'
  | 'custom';

/**
 * Sanitization result
 */
export interface SanitizationResult {
  /**
   * Sanitized value
   */
  value: string;

  /**
   * Original value
   */
  original: string;

  /**
   * Whether value was modified
   */
  modified: boolean;

  /**
   * Removed/replaced characters
   */
  removed?: string[];

  /**
   * Sanitization type used
   */
  type: SanitizationType;

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Custom sanitization rule
 */
export interface CustomRule {
  /**
   * Rule name
   */
  name: string;

  /**
   * Pattern to match (for removal/replacement)
   */
  pattern: RegExp;

  /**
   * Replacement value
   */
  replacement: string;

  /**
   * Description
   */
  description?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether value is valid
   */
  valid: boolean;

  /**
   * Error message (if invalid)
   */
  error?: string;

  /**
   * Validation type
   */
  type: string;

  /**
   * Original value
   */
  value: string;
}

/**
 * Macrophage configuration
 */
export interface MacrophageConfig {
  /**
   * Enable verbose logging
   */
  verbose?: boolean;

  /**
   * Enable aggressive sanitization (more restrictive)
   */
  aggressive?: boolean;

  /**
   * Custom sanitization rules
   */
  customRules?: CustomRule[];

  /**
   * HTML allowed tags (for HTML sanitization)
   */
  htmlAllowedTags?: string[];

  /**
   * Maximum input length (0 = unlimited)
   */
  maxLength?: number;
}

/**
 * Sanitization statistics
 */
export interface SanitizationStatistics {
  /**
   * Total sanitizations performed
   */
  totalSanitizations: number;

  /**
   * Total modifications made
   */
  totalModifications: number;

  /**
   * Modification rate (percentage)
   */
  modificationRate: number;

  /**
   * Sanitizations by type
   */
  byType: Record<SanitizationType, number>;

  /**
   * Total validations performed
   */
  totalValidations: number;

  /**
   * Valid inputs
   */
  validInputs: number;

  /**
   * Invalid inputs
   */
  invalidInputs: number;
}

/**
 * Macrophage - Input Sanitization System
 *
 * Sanitizes and validates user input to prevent security vulnerabilities
 */
export class Macrophage extends EventEmitter {
  private readonly config: Required<MacrophageConfig>;
  private customRules: Map<string, CustomRule> = new Map();
  private stats = {
    totalSanitizations: 0,
    totalModifications: 0,
    byType: {
      html: 0,
      sql: 0,
      path: 0,
      command: 0,
      email: 0,
      url: 0,
      alphanumeric: 0,
      numeric: 0,
      custom: 0,
    } as Record<SanitizationType, number>,
    totalValidations: 0,
    validInputs: 0,
    invalidInputs: 0,
  };

  /**
   * Create a new Macrophage sanitization system
   */
  constructor(config: MacrophageConfig = {}) {
    super();

    this.config = {
      verbose: config.verbose ?? false,
      aggressive: config.aggressive ?? false,
      customRules: config.customRules ?? [],
      htmlAllowedTags: config.htmlAllowedTags ?? ['b', 'i', 'u', 'em', 'strong', 'p', 'br'],
      maxLength: config.maxLength ?? 0,
    };

    // Load custom rules
    for (const rule of this.config.customRules) {
      this.customRules.set(rule.name, rule);
    }

    if (this.config.verbose) {
      this.log('Macrophage sanitization system initialized');
    }
  }

  /**
   * Sanitize HTML input (prevent XSS)
   */
  public sanitizeHTML(input: string): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.html++;

    const original = input;
    let value = input;
    const removed: string[] = [];

    // Check length
    if (this.config.maxLength > 0 && value.length > this.config.maxLength) {
      value = value.substring(0, this.config.maxLength);
      removed.push(`truncated ${original.length - value.length} characters`);
    }

    // Remove script tags
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const scriptMatches = value.match(scriptPattern);
    if (scriptMatches !== null) {
      removed.push(...scriptMatches);
      value = value.replace(scriptPattern, '');
    }

    // Remove event handlers
    const eventPattern = /on\w+\s*=\s*["'][^"']*["']/gi;
    const eventMatches = value.match(eventPattern);
    if (eventMatches !== null) {
      removed.push(...eventMatches);
      value = value.replace(eventPattern, '');
    }

    // Remove javascript: protocol
    const jsProtocol = /javascript:/gi;
    if (jsProtocol.test(value)) {
      removed.push('javascript: protocol');
      value = value.replace(jsProtocol, '');
    }

    // In aggressive mode or if no allowed tags, strip all HTML
    if (this.config.aggressive || this.config.htmlAllowedTags.length === 0) {
      value = value.replace(/<[^>]*>/g, '');
    } else {
      // Remove disallowed tags
      const tagPattern = /<(\/?)([\w-]+)([^>]*)>/gi;
      value = value.replace(tagPattern, (match, closing, tagName) => {
        if (this.config.htmlAllowedTags.includes(tagName.toLowerCase())) {
          return match;
        }
        removed.push(match);
        return '';
      });
    }

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'html', original, value });
    }

    const result: SanitizationResult = {
      value,
      original,
      modified,
      ...(removed.length > 0 && { removed }),
      type: 'html',
      timestamp: Date.now(),
    };

    return result;
  }

  /**
   * Sanitize SQL input (prevent SQL injection)
   */
  public sanitizeSQL(input: string): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.sql++;

    const original = input;
    let value = input;
    const removed: string[] = [];

    // Check length
    if (this.config.maxLength > 0 && value.length > this.config.maxLength) {
      value = value.substring(0, this.config.maxLength);
      removed.push(`truncated ${original.length - value.length} characters`);
    }

    // Escape single quotes
    if (value.includes("'")) {
      removed.push('single quotes');
      value = value.replace(/'/g, "''");
    }

    // Remove SQL comments
    if (value.includes('--')) {
      removed.push('SQL comments');
      value = value.replace(/--[^\n]*/g, '');
    }

    if (value.includes('/*')) {
      removed.push('block comments');
      value = value.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // In aggressive mode, remove common SQL keywords
    if (this.config.aggressive) {
      const sqlKeywords = ['UNION', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE'];
      for (const keyword of sqlKeywords) {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (pattern.test(value)) {
          removed.push(keyword);
          value = value.replace(pattern, '');
        }
      }
    }

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'sql', original, value });
    }

    return {
      value,
      original,
      modified,
      ...(removed.length > 0 && { removed }),
      type: 'sql',
      timestamp: Date.now(),
    };
  }

  /**
   * Sanitize file path (prevent path traversal)
   */
  public sanitizePath(input: string): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.path++;

    const original = input;
    let value = input;
    const removed: string[] = [];

    // Remove path traversal sequences
    if (value.includes('..')) {
      removed.push('directory traversal');
      value = value.replace(/\.\./g, '');
    }

    // Remove null bytes
    if (value.includes('\x00')) {
      removed.push('null bytes');
      value = value.replace(/\x00/g, '');
    }

    // Normalize separators to forward slash
    value = value.replace(/\\/g, '/');

    // Remove leading slashes (to prevent absolute paths)
    if (value.startsWith('/')) {
      removed.push('leading slash');
      value = value.replace(/^\/+/, '');
    }

    // Remove multiple consecutive slashes
    value = value.replace(/\/+/g, '/');

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'path', original, value });
    }

    return {
      value,
      original,
      modified,
      ...(removed.length > 0 && { removed }),
      type: 'path',
      timestamp: Date.now(),
    };
  }

  /**
   * Sanitize command input (prevent command injection)
   */
  public sanitizeCommand(input: string): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.command++;

    const original = input;
    let value = input;
    const removed: string[] = [];

    // Check length
    if (this.config.maxLength > 0 && value.length > this.config.maxLength) {
      value = value.substring(0, this.config.maxLength);
      removed.push(`truncated ${original.length - value.length} characters`);
    }

    // Remove shell metacharacters
    const metacharacters = ['|', ';', '&', '$', '`', '\n', '<', '>', '(', ')', '{', '}'];

    for (const char of metacharacters) {
      if (value.includes(char)) {
        removed.push(char);
        value = value.replace(new RegExp(`\\${char}`, 'g'), '');
      }
    }

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'command', original, value });
    }

    return {
      value,
      original,
      modified,
      ...(removed.length > 0 && { removed }),
      type: 'command',
      timestamp: Date.now(),
    };
  }

  /**
   * Sanitize to alphanumeric only
   */
  public sanitizeAlphanumeric(input: string, allowSpaces = false): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.alphanumeric++;

    const original = input;
    const pattern = allowSpaces ? /[^a-zA-Z0-9 ]/g : /[^a-zA-Z0-9]/g;

    const matches = input.match(pattern);
    const value = input.replace(pattern, '');

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'alphanumeric', original, value });
    }

    return {
      value,
      original,
      modified,
      ...(matches !== null && { removed: matches }),
      type: 'alphanumeric',
      timestamp: Date.now(),
    };
  }

  /**
   * Sanitize to numeric only
   */
  public sanitizeNumeric(input: string, allowDecimal = false): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.numeric++;

    const original = input;
    const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;

    const matches = input.match(pattern);
    let value = input.replace(pattern, '');

    // If allowing decimal, ensure only one decimal point
    if (allowDecimal && value.includes('.')) {
      const parts = value.split('.');
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'numeric', original, value });
    }

    return {
      value,
      original,
      modified,
      ...(matches !== null && { removed: matches }),
      type: 'numeric',
      timestamp: Date.now(),
    };
  }

  /**
   * Apply custom sanitization rule
   */
  public sanitizeCustom(input: string, ruleName: string): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.custom++;

    const rule = this.customRules.get(ruleName);

    if (rule === undefined) {
      throw new Error(`Custom rule '${ruleName}' not found`);
    }

    const original = input;
    const matches = input.match(rule.pattern);
    const value = input.replace(rule.pattern, rule.replacement);

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'custom', original, value, rule: ruleName });
    }

    return {
      value,
      original,
      modified,
      ...(matches !== null && { removed: matches }),
      type: 'custom',
      timestamp: Date.now(),
    };
  }

  /**
   * Add custom sanitization rule
   */
  public addCustomRule(rule: CustomRule): void {
    this.customRules.set(rule.name, rule);
    this.emit('rule:added', { name: rule.name });
  }

  /**
   * Remove custom sanitization rule
   */
  public removeCustomRule(name: string): boolean {
    const deleted = this.customRules.delete(name);

    if (deleted) {
      this.emit('rule:removed', { name });
    }

    return deleted;
  }

  /**
   * Validate email address
   */
  public validateEmail(email: string): ValidationResult {
    this.stats.totalValidations++;

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const valid = emailPattern.test(email);

    if (valid) {
      this.stats.validInputs++;
    } else {
      this.stats.invalidInputs++;
    }

    return {
      valid,
      ...(valid ? {} : { error: 'Invalid email format' }),
      type: 'email',
      value: email,
    };
  }

  /**
   * Validate and sanitize URL
   */
  public validateURL(url: string): ValidationResult {
    this.stats.totalValidations++;

    try {
      const parsed = new URL(url);

      // Check for valid protocols
      const validProtocols = ['http:', 'https:'];
      const valid = validProtocols.includes(parsed.protocol);

      if (valid) {
        this.stats.validInputs++;
      } else {
        this.stats.invalidInputs++;
      }

      return {
        valid,
        ...(valid ? {} : { error: 'Invalid URL protocol' }),
        type: 'url',
        value: url,
      };
    } catch {
      this.stats.invalidInputs++;

      return {
        valid: false,
        error: 'Invalid URL format',
        type: 'url',
        value: url,
      };
    }
  }

  /**
   * Sanitize URL (remove dangerous protocols and params)
   */
  public sanitizeURL(input: string): SanitizationResult {
    this.stats.totalSanitizations++;
    this.stats.byType.url++;

    const original = input;
    let value = input;
    const removed: string[] = [];

    // Remove javascript: and data: protocols
    const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:'];

    for (const protocol of dangerousProtocols) {
      if (value.toLowerCase().startsWith(protocol)) {
        removed.push(protocol);
        value = value.substring(protocol.length);
      }
    }

    const modified = value !== original;

    if (modified) {
      this.stats.totalModifications++;
      this.emit('sanitization:modified', { type: 'url', original, value });
    }

    return {
      value,
      original,
      modified,
      ...(removed.length > 0 && { removed }),
      type: 'url',
      timestamp: Date.now(),
    };
  }

  /**
   * Get sanitization statistics
   */
  public getStatistics(): SanitizationStatistics {
    const modificationRate =
      this.stats.totalSanitizations > 0
        ? (this.stats.totalModifications / this.stats.totalSanitizations) * 100
        : 0;

    return {
      totalSanitizations: this.stats.totalSanitizations,
      totalModifications: this.stats.totalModifications,
      modificationRate,
      byType: { ...this.stats.byType },
      totalValidations: this.stats.totalValidations,
      validInputs: this.stats.validInputs,
      invalidInputs: this.stats.invalidInputs,
    };
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.stats = {
      totalSanitizations: 0,
      totalModifications: 0,
      byType: {
        html: 0,
        sql: 0,
        path: 0,
        command: 0,
        email: 0,
        url: 0,
        alphanumeric: 0,
        numeric: 0,
        custom: 0,
      },
      totalValidations: 0,
      validInputs: 0,
      invalidInputs: 0,
    };

    this.emit('stats:reset');
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.config.verbose) {
      // Using warn for verbose logging as it's allowed by linter
      console.warn(`[Macrophage] ${message}`);
    }
  }
}
