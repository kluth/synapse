/**
 * Macrophage Tests - Input Sanitization System
 */

import { Macrophage } from '../sanitization/Macrophage';

describe('Macrophage - Input Sanitization System', () => {
  describe('HTML Sanitization', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script> World';
      const result = macrophage.sanitizeHTML(input);

      expect(result.value).toBe('Hello  World');
      expect(result.modified).toBe(true);
      expect(result.removed).toContain('<script>alert("XSS")</script>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = macrophage.sanitizeHTML(input);

      expect(result.value).not.toContain('onclick');
      expect(result.modified).toBe(true);
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = macrophage.sanitizeHTML(input);

      expect(result.value).not.toContain('javascript:');
      expect(result.modified).toBe(true);
    });

    it('should allow whitelisted HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = macrophage.sanitizeHTML(input);

      expect(result.value).toContain('<p>');
      expect(result.value).toContain('<strong>');
    });

    it('should remove non-whitelisted HTML tags', () => {
      const input = '<div><script>alert(1)</script><p>Safe</p></div>';
      const result = macrophage.sanitizeHTML(input);

      expect(result.value).not.toContain('<div>');
      expect(result.value).not.toContain('<script>');
      expect(result.value).toContain('<p>');
    });

    it('should strip all HTML in aggressive mode', () => {
      const aggressive = new Macrophage({ aggressive: true, verbose: false });
      const input = '<p>Hello <strong>World</strong></p>';
      const result = aggressive.sanitizeHTML(input);

      expect(result.value).toBe('Hello World');
    });

    it('should not modify clean HTML', () => {
      const input = '<p>Hello World</p>';
      const result = macrophage.sanitizeHTML(input);

      expect(result.modified).toBe(false);
    });

    it('should truncate long inputs', () => {
      const short = new Macrophage({ maxLength: 10, verbose: false });
      const input = 'This is a very long input string';
      const result = short.sanitizeHTML(input);

      expect(result.value.length).toBe(10);
      expect(result.modified).toBe(true);
    });
  });

  describe('SQL Sanitization', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should escape single quotes', () => {
      const input = "User's input";
      const result = macrophage.sanitizeSQL(input);

      expect(result.value).toBe("User''s input");
      expect(result.modified).toBe(true);
    });

    it('should remove SQL comments', () => {
      const input = 'value -- comment';
      const result = macrophage.sanitizeSQL(input);

      expect(result.value).toBe('value ');
      expect(result.modified).toBe(true);
    });

    it('should remove block comments', () => {
      const input = 'value /* comment */ more';
      const result = macrophage.sanitizeSQL(input);

      expect(result.value).toBe('value  more');
      expect(result.modified).toBe(true);
    });

    it('should remove SQL keywords in aggressive mode', () => {
      const aggressive = new Macrophage({ aggressive: true, verbose: false });
      const input = '1 UNION SELECT password FROM users';
      const result = aggressive.sanitizeSQL(input);

      expect(result.value).not.toContain('UNION');
      expect(result.value).not.toContain('SELECT');
      expect(result.modified).toBe(true);
    });

    it('should not modify clean SQL input', () => {
      const input = 'valid value';
      const result = macrophage.sanitizeSQL(input);

      expect(result.modified).toBe(false);
    });

    it('should handle multiple SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --";
      const result = macrophage.sanitizeSQL(input);

      expect(result.value).toContain("''");
      expect(result.modified).toBe(true);
    });
  });

  describe('Path Sanitization', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should remove directory traversal sequences', () => {
      const input = '../../../etc/passwd';
      const result = macrophage.sanitizePath(input);

      expect(result.value).not.toContain('..');
      expect(result.modified).toBe(true);
    });

    it('should normalize path separators', () => {
      const input = 'path\\to\\file';
      const result = macrophage.sanitizePath(input);

      expect(result.value).toBe('path/to/file');
      expect(result.modified).toBe(true);
    });

    it('should remove leading slashes', () => {
      const input = '/etc/passwd';
      const result = macrophage.sanitizePath(input);

      expect(result.value.startsWith('/')).toBe(false);
      expect(result.modified).toBe(true);
    });

    it('should remove null bytes', () => {
      const input = 'file\x00.txt';
      const result = macrophage.sanitizePath(input);

      expect(result.value).not.toContain('\x00');
      expect(result.modified).toBe(true);
    });

    it('should normalize consecutive slashes', () => {
      const input = 'path//to///file';
      const result = macrophage.sanitizePath(input);

      expect(result.value).toBe('path/to/file');
      expect(result.modified).toBe(true);
    });

    it('should not modify clean paths', () => {
      const input = 'path/to/file.txt';
      const result = macrophage.sanitizePath(input);

      expect(result.modified).toBe(false);
    });
  });

  describe('Command Sanitization', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should remove pipe characters', () => {
      const input = 'command | evil';
      const result = macrophage.sanitizeCommand(input);

      expect(result.value).not.toContain('|');
      expect(result.modified).toBe(true);
    });

    it('should remove semicolons', () => {
      const input = 'command; evil';
      const result = macrophage.sanitizeCommand(input);

      expect(result.value).not.toContain(';');
      expect(result.modified).toBe(true);
    });

    it('should remove ampersands', () => {
      const input = 'command & evil';
      const result = macrophage.sanitizeCommand(input);

      expect(result.value).not.toContain('&');
      expect(result.modified).toBe(true);
    });

    it('should remove backticks', () => {
      const input = 'command `evil`';
      const result = macrophage.sanitizeCommand(input);

      expect(result.value).not.toContain('`');
      expect(result.modified).toBe(true);
    });

    it('should remove dollar signs', () => {
      const input = 'command $var';
      const result = macrophage.sanitizeCommand(input);

      expect(result.value).not.toContain('$');
      expect(result.modified).toBe(true);
    });

    it('should remove redirections', () => {
      const input = 'command > file';
      const result = macrophage.sanitizeCommand(input);

      expect(result.value).not.toContain('>');
      expect(result.modified).toBe(true);
    });

    it('should not modify clean commands', () => {
      const input = 'clean command';
      const result = macrophage.sanitizeCommand(input);

      expect(result.modified).toBe(false);
    });
  });

  describe('Alphanumeric Sanitization', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should remove special characters', () => {
      const input = 'Hello@World#123!';
      const result = macrophage.sanitizeAlphanumeric(input);

      expect(result.value).toBe('HelloWorld123');
      expect(result.modified).toBe(true);
    });

    it('should remove spaces by default', () => {
      const input = 'Hello World';
      const result = macrophage.sanitizeAlphanumeric(input);

      expect(result.value).toBe('HelloWorld');
      expect(result.modified).toBe(true);
    });

    it('should allow spaces when specified', () => {
      const input = 'Hello World';
      const result = macrophage.sanitizeAlphanumeric(input, true);

      expect(result.value).toBe('Hello World');
      expect(result.modified).toBe(false);
    });

    it('should not modify clean alphanumeric input', () => {
      const input = 'Hello123';
      const result = macrophage.sanitizeAlphanumeric(input);

      expect(result.modified).toBe(false);
    });
  });

  describe('Numeric Sanitization', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should remove non-numeric characters', () => {
      const input = 'Price: $123.45!';
      const result = macrophage.sanitizeNumeric(input);

      expect(result.value).toBe('12345');
      expect(result.modified).toBe(true);
    });

    it('should allow decimal point when specified', () => {
      const input = 'Price: $123.45!';
      const result = macrophage.sanitizeNumeric(input, true);

      expect(result.value).toBe('123.45');
      expect(result.modified).toBe(true);
    });

    it('should handle multiple decimal points', () => {
      const input = '12.34.56';
      const result = macrophage.sanitizeNumeric(input, true);

      expect(result.value).toBe('12.3456');
      expect(result.modified).toBe(true);
    });

    it('should not modify clean numeric input', () => {
      const input = '12345';
      const result = macrophage.sanitizeNumeric(input);

      expect(result.modified).toBe(false);
    });
  });

  describe('Custom Rules', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should add custom rule', () => {
      macrophage.addCustomRule({
        name: 'remove-emojis',
        pattern: /[\u{1F600}-\u{1F64F}]/gu,
        replacement: '',
        description: 'Remove emoji characters',
      });

      const input = 'Hello 😀 World';
      const result = macrophage.sanitizeCustom(input, 'remove-emojis');

      expect(result.value).toBe('Hello  World');
      expect(result.modified).toBe(true);
    });

    it('should emit rule:added event', () => {
      return new Promise<void>((resolve) => {
        macrophage.on('rule:added', (data) => {
          expect(data.name).toBe('test-rule');
          resolve();
        });

        macrophage.addCustomRule({
          name: 'test-rule',
          pattern: /test/g,
          replacement: '',
        });
      });
    });

    it('should remove custom rule', () => {
      macrophage.addCustomRule({
        name: 'test-rule',
        pattern: /test/g,
        replacement: '',
      });

      const removed = macrophage.removeCustomRule('test-rule');

      expect(removed).toBe(true);
    });

    it('should return false when removing non-existent rule', () => {
      const removed = macrophage.removeCustomRule('invalid-rule');

      expect(removed).toBe(false);
    });

    it('should throw error for non-existent custom rule', () => {
      expect(() => {
        macrophage.sanitizeCustom('input', 'non-existent');
      }).toThrow("Custom rule 'non-existent' not found");
    });

    it('should emit rule:removed event', () => {
      return new Promise<void>((resolve) => {
        macrophage.addCustomRule({
          name: 'test-rule',
          pattern: /test/g,
          replacement: '',
        });

        macrophage.on('rule:removed', (data) => {
          expect(data.name).toBe('test-rule');
          resolve();
        });

        macrophage.removeCustomRule('test-rule');
      });
    });
  });

  describe('Email Validation', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should validate correct email', () => {
      const result = macrophage.validateEmail('user@example.com');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject email without @', () => {
      const result = macrophage.validateEmail('userexample.com');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email without domain', () => {
      const result = macrophage.validateEmail('user@');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email without TLD', () => {
      const result = macrophage.validateEmail('user@example');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should validate email with subdomain', () => {
      const result = macrophage.validateEmail('user@mail.example.com');

      expect(result.valid).toBe(true);
    });

    it('should validate email with plus addressing', () => {
      const result = macrophage.validateEmail('user+tag@example.com');

      expect(result.valid).toBe(true);
    });
  });

  describe('URL Validation', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should validate correct HTTP URL', () => {
      const result = macrophage.validateURL('http://example.com');

      expect(result.valid).toBe(true);
    });

    it('should validate correct HTTPS URL', () => {
      const result = macrophage.validateURL('https://example.com');

      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const result = macrophage.validateURL('not a url');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject javascript: protocol', () => {
      const result = macrophage.validateURL('javascript:alert(1)');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL protocol');
    });

    it('should reject file: protocol', () => {
      const result = macrophage.validateURL('file:///etc/passwd');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL protocol');
    });
  });

  describe('URL Sanitization', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = macrophage.sanitizeURL(input);

      expect(result.value).not.toContain('javascript:');
      expect(result.modified).toBe(true);
    });

    it('should remove data: protocol', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = macrophage.sanitizeURL(input);

      expect(result.value).not.toContain('data:');
      expect(result.modified).toBe(true);
    });

    it('should remove file: protocol', () => {
      const input = 'file:///etc/passwd';
      const result = macrophage.sanitizeURL(input);

      expect(result.value).not.toContain('file:');
      expect(result.modified).toBe(true);
    });

    it('should not modify safe URLs', () => {
      const input = 'https://example.com';
      const result = macrophage.sanitizeURL(input);

      expect(result.modified).toBe(false);
    });
  });

  describe('Statistics', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should track sanitization counts', () => {
      macrophage.sanitizeHTML('<script>alert(1)</script>');
      macrophage.sanitizeSQL("'; DROP TABLE users; --");
      macrophage.sanitizePath('../../etc/passwd');

      const stats = macrophage.getStatistics();

      expect(stats.totalSanitizations).toBe(3);
      expect(stats.totalModifications).toBe(3);
    });

    it('should track sanitization by type', () => {
      macrophage.sanitizeHTML('<script>alert(1)</script>');
      macrophage.sanitizeHTML('<div onclick="alert(1)">Test</div>');
      macrophage.sanitizeSQL("value'; --");

      const stats = macrophage.getStatistics();

      expect(stats.byType.html).toBe(2);
      expect(stats.byType.sql).toBe(1);
    });

    it('should calculate modification rate', () => {
      macrophage.sanitizeHTML('<script>alert(1)</script>'); // Modified
      macrophage.sanitizeHTML('<p>Safe</p>'); // Not modified

      const stats = macrophage.getStatistics();

      expect(stats.modificationRate).toBe(50);
    });

    it('should track validation counts', () => {
      macrophage.validateEmail('valid@example.com');
      macrophage.validateEmail('invalid');
      macrophage.validateURL('https://example.com');

      const stats = macrophage.getStatistics();

      expect(stats.totalValidations).toBe(3);
      expect(stats.validInputs).toBe(2);
      expect(stats.invalidInputs).toBe(1);
    });

    it('should reset statistics', () => {
      macrophage.sanitizeHTML('<script>alert(1)</script>');
      macrophage.resetStatistics();

      const stats = macrophage.getStatistics();

      expect(stats.totalSanitizations).toBe(0);
      expect(stats.totalModifications).toBe(0);
    });

    it('should emit stats:reset event', () => {
      return new Promise<void>((resolve) => {
        macrophage.on('stats:reset', () => {
          resolve();
        });

        macrophage.resetStatistics();
      });
    });
  });

  describe('Events', () => {
    let macrophage: Macrophage;

    beforeEach(() => {
      macrophage = new Macrophage({ verbose: false });
    });

    it('should emit sanitization:modified event for HTML', () => {
      return new Promise<void>((resolve) => {
        macrophage.on('sanitization:modified', (data) => {
          expect(data.type).toBe('html');
          expect(data.original).toContain('<script>');
          resolve();
        });

        macrophage.sanitizeHTML('<script>alert(1)</script>');
      });
    });

    it('should emit sanitization:modified event for SQL', () => {
      return new Promise<void>((resolve) => {
        macrophage.on('sanitization:modified', (data) => {
          expect(data.type).toBe('sql');
          resolve();
        });

        macrophage.sanitizeSQL("'; DROP TABLE users; --");
      });
    });

    it('should emit sanitization:modified event for path', () => {
      return new Promise<void>((resolve) => {
        macrophage.on('sanitization:modified', (data) => {
          expect(data.type).toBe('path');
          resolve();
        });

        macrophage.sanitizePath('../../etc/passwd');
      });
    });

    it('should not emit event for unmodified input', () => {
      let eventFired = false;

      macrophage.on('sanitization:modified', () => {
        eventFired = true;
      });

      macrophage.sanitizeHTML('<p>Safe content</p>');

      expect(eventFired).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should respect aggressive mode for HTML', () => {
      const aggressive = new Macrophage({ aggressive: true, verbose: false });
      const input = '<p>Hello <strong>World</strong></p>';
      const result = aggressive.sanitizeHTML(input);

      expect(result.value).not.toContain('<');
    });

    it('should respect aggressive mode for SQL', () => {
      const aggressive = new Macrophage({ aggressive: true, verbose: false });
      const input = 'SELECT * FROM users';
      const result = aggressive.sanitizeSQL(input);

      expect(result.value).not.toContain('SELECT');
    });

    it('should respect max length', () => {
      const limited = new Macrophage({ maxLength: 5, verbose: false });
      const input = 'This is too long';
      const result = limited.sanitizeHTML(input);

      expect(result.value.length).toBe(5);
    });

    it('should respect custom HTML allowed tags', () => {
      const custom = new Macrophage({ htmlAllowedTags: ['div', 'span'], verbose: false });
      const input = '<div><p>Test</p></div>';
      const result = custom.sanitizeHTML(input);

      expect(result.value).toContain('<div>');
      expect(result.value).not.toContain('<p>');
    });

    it('should load custom rules from config', () => {
      const withRules = new Macrophage({
        customRules: [
          {
            name: 'remove-numbers',
            pattern: /\d/g,
            replacement: 'X',
          },
        ],
        verbose: false,
      });

      const input = 'abc123def456';
      const result = withRules.sanitizeCustom(input, 'remove-numbers');

      expect(result.value).toBe('abcXXXdefXXX');
    });
  });
});
