/**
 * Antibody Tests - Threat Detection System
 */

import { Antibody } from '../detection/Antibody';
import type { ThreatPattern, DetectedThreat } from '../detection/Antibody';

describe('Antibody - Threat Detection System', () => {
  describe('Construction', () => {
    it('should create antibody with default config', () => {
      const antibody = new Antibody();

      expect(antibody).toBeInstanceOf(Antibody);
      expect(antibody.isEnabled()).toBe(true);
    });

    it('should create antibody with custom config', () => {
      const antibody = new Antibody({
        enabled: false,
        minScoreToReport: 50,
        maxThreatHistory: 500,
      });

      expect(antibody.isEnabled()).toBe(false);
    });

    it('should initialize with default patterns', () => {
      const antibody = new Antibody();
      const patterns = antibody.getPatterns();

      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Management', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody();
    });

    it('should add custom pattern', () => {
      const initialCount = antibody.getPatterns().length;

      const pattern: ThreatPattern = {
        name: 'Custom Test Pattern',
        type: 'suspicious-pattern',
        pattern: /test/gi,
        severity: 'low',
        score: 30,
        description: 'Test pattern',
      };

      antibody.addPattern(pattern);

      expect(antibody.getPatterns().length).toBe(initialCount + 1);
    });

    it('should remove pattern by name', () => {
      const pattern: ThreatPattern = {
        name: 'Removable Pattern',
        type: 'suspicious-pattern',
        pattern: /removeme/gi,
        severity: 'low',
        score: 20,
        description: 'Pattern to remove',
      };

      antibody.addPattern(pattern);
      const removed = antibody.removePattern('Removable Pattern');

      expect(removed).toBe(true);
    });

    it('should return false when removing non-existent pattern', () => {
      const removed = antibody.removePattern('Non-Existent Pattern');

      expect(removed).toBe(false);
    });
  });

  describe('SQL Injection Detection', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false });
    });

    it('should detect UNION-based SQL injection', () => {
      const input = "SELECT * FROM users WHERE id = 1 UNION SELECT password FROM admin";

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'sql-injection')).toBe(true);
    });

    it('should detect OR 1=1 SQL injection', () => {
      const input = "SELECT * FROM users WHERE username = 'admin' OR '1'='1'";

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'sql-injection')).toBe(true);
    });

    it('should detect SQL comment injection', () => {
      const input = "SELECT * FROM users WHERE id = 1 -- DROP TABLE users";

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'sql-injection')).toBe(true);
    });

    it('should not detect clean SQL', () => {
      const input = "SELECT id, name FROM users WHERE active = true";

      const threats = antibody.scan(input);

      const sqlThreats = threats.filter(t => t.type === 'sql-injection');
      expect(sqlThreats.length).toBe(0);
    });
  });

  describe('XSS Detection', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false });
    });

    it('should detect script tag injection', () => {
      const input = '<script>alert("XSS")</script>';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'xss')).toBe(true);
      expect(threats.some(t => t.severity === 'critical')).toBe(true);
    });

    it('should detect event handler injection', () => {
      const input = '<img src="x" onerror="alert(1)">';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'xss')).toBe(true);
    });

    it('should detect javascript protocol', () => {
      const input = '<a href="javascript:void(0)">Click</a>';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'xss')).toBe(true);
    });

    it('should not detect clean HTML', () => {
      const input = '<div class="content"><p>Safe content</p></div>';

      const threats = antibody.scan(input);

      const xssThreats = threats.filter(t => t.type === 'xss');
      expect(xssThreats.length).toBe(0);
    });
  });

  describe('Path Traversal Detection', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false });
    });

    it('should detect directory traversal', () => {
      const input = '../../../etc/passwd';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'path-traversal')).toBe(true);
    });

    it('should detect encoded directory traversal', () => {
      const input = '%2e%2e/%2e%2e/etc/passwd';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'path-traversal')).toBe(true);
    });

    it('should not detect clean paths', () => {
      const input = '/home/user/documents/file.txt';

      const threats = antibody.scan(input);

      const pathThreats = threats.filter(t => t.type === 'path-traversal');
      expect(pathThreats.length).toBe(0);
    });
  });

  describe('Command Injection Detection', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false });
    });

    it('should detect pipe command injection', () => {
      const input = 'ls | grep password';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'command-injection')).toBe(true);
    });

    it('should detect semicolon command injection', () => {
      const input = 'ls; rm -rf /';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'command-injection')).toBe(true);
    });

    it('should detect backtick command injection', () => {
      const input = 'echo `cat /etc/passwd`';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'command-injection')).toBe(true);
    });
  });

  describe('LDAP Injection Detection', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false });
    });

    it('should detect LDAP filter injection', () => {
      const input = 'admin*)(uid=*))(|(uid=*';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'ldap-injection')).toBe(true);
    });
  });

  describe('XXE Detection', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false });
    });

    it('should detect XXE injection', () => {
      const input = '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>';

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'xxe')).toBe(true);
      expect(threats.some(t => t.severity === 'critical')).toBe(true);
    });
  });

  describe('Threat History', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false, minScoreToReport: 0 });
    });

    it('should record detected threats', () => {
      const input = '<script>alert(1)</script>';

      antibody.scan(input);

      const threats = antibody.getDetectedThreats();
      expect(threats.length).toBeGreaterThan(0);
    });

    it('should limit threat history', () => {
      const antibody = new Antibody({ maxThreatHistory: 5, minScoreToReport: 0 });

      // Generate more threats than the limit
      for (let i = 0; i < 10; i++) {
        antibody.scan('<script>alert(1)</script>');
      }

      const threats = antibody.getDetectedThreats();
      expect(threats.length).toBeLessThanOrEqual(5);
    });

    it('should get threats by type', () => {
      antibody.scan('<script>alert(1)</script>');
      antibody.scan("SELECT * FROM users WHERE id = 1 OR 1=1");

      const xssThreats = antibody.getThreatsByType('xss');
      const sqlThreats = antibody.getThreatsByType('sql-injection');

      expect(xssThreats.length).toBeGreaterThan(0);
      expect(sqlThreats.length).toBeGreaterThan(0);
    });

    it('should get threats by severity', () => {
      antibody.scan('<script>alert(1)</script>'); // Critical

      const criticalThreats = antibody.getThreatsBySeverity('critical');

      expect(criticalThreats.length).toBeGreaterThan(0);
    });

    it('should get threats by source', () => {
      antibody.scan('<script>alert(1)</script>', '192.168.1.1');
      antibody.scan("SELECT * FROM users", '192.168.1.2');

      const threats = antibody.getThreatsBySource('192.168.1.1');

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.every(t => t.source === '192.168.1.1')).toBe(true);
    });

    it('should clear threat history', () => {
      antibody.scan('<script>alert(1)</script>');

      antibody.clearHistory();

      const threats = antibody.getDetectedThreats();
      expect(threats.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false, minScoreToReport: 0 });
    });

    it('should track threat statistics', () => {
      antibody.scan('<script>alert(1)</script>');
      antibody.scan("SELECT * FROM users WHERE id = 1 OR 1=1");
      antibody.scan('../../../etc/passwd');

      const stats = antibody.getStatistics();

      expect(stats.totalDetected).toBeGreaterThan(0);
      expect(stats.byType['xss']).toBeGreaterThan(0);
      expect(stats.byType['sql-injection']).toBeGreaterThan(0);
      expect(stats.byType['path-traversal']).toBeGreaterThan(0);
    });

    it('should calculate average score', () => {
      antibody.scan('<script>alert(1)</script>'); // High score

      const stats = antibody.getStatistics();

      expect(stats.averageScore).toBeGreaterThan(0);
    });

    it('should track highest score', () => {
      antibody.scan('<script>alert(1)</script>'); // Critical - high score

      const stats = antibody.getStatistics();

      expect(stats.highestScore).toBeGreaterThan(80);
    });

    it('should identify most common threat type', () => {
      // Generate multiple XSS threats
      for (let i = 0; i < 5; i++) {
        antibody.scan('<script>alert(1)</script>');
      }

      const stats = antibody.getStatistics();

      expect(stats.mostCommonType).toBe('xss');
    });

    it('should calculate detection rate', () => {
      antibody.scan('<script>alert(1)</script>');

      const stats = antibody.getStatistics();

      expect(stats.detectionRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Events', () => {
    let antibody: Antibody;

    beforeEach(() => {
      antibody = new Antibody({ verbose: false, minScoreToReport: 0 });
    });

    it('should emit threat:detected event', (done) => {
      let called = false;

      antibody.on('threat:detected', (threat: DetectedThreat) => {
        if (!called) {
          expect(threat).toBeDefined();
          expect(threat.type).toBeDefined();
          called = true;
          done();
        }
      });

      antibody.scan('<script>alert(1)</script>');
    });

    it('should emit history:cleared event', (done) => {
      antibody.on('history:cleared', () => {
        done();
      });

      antibody.scan('<script>alert(1)</script>');
      antibody.clearHistory();
    });

    it('should emit reset event', (done) => {
      antibody.on('reset', () => {
        done();
      });

      antibody.scan('<script>alert(1)</script>');
      antibody.reset();
    });

    it('should emit enabled:changed event', (done) => {
      antibody.on('enabled:changed', (enabled: boolean) => {
        expect(enabled).toBe(false);
        done();
      });

      antibody.setEnabled(false);
    });
  });

  describe('Configuration', () => {
    it('should respect minScoreToReport setting', () => {
      const antibody = new Antibody({ minScoreToReport: 90 });

      // This should be detected but not reported due to lower score
      const threats = antibody.scan('../etc/passwd'); // Medium severity

      // Only very high-severity threats should be reported
      expect(threats.length).toBe(0);
    });

    it('should enable/disable detection', () => {
      const antibody = new Antibody({ enabled: true });

      antibody.setEnabled(false);

      const threats = antibody.scan('<script>alert(1)</script>');

      expect(threats.length).toBe(0);
    });

    it('should support custom patterns', () => {
      const customPattern: ThreatPattern = {
        name: 'Custom Password Pattern',
        type: 'data-leak',
        pattern: /password\s*=\s*['"]\w+['"]/gi,
        severity: 'high',
        score: 80,
        description: 'Potential password in plaintext',
      };

      const antibody = new Antibody({
        customPatterns: [customPattern],
      });

      const threats = antibody.scan('password = "secret123"');

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.type === 'data-leak')).toBe(true);
    });
  });

  describe('Learning', () => {
    it('should emit learning events for critical threats', (done) => {
      const antibody = new Antibody({
        enableLearning: true,
        verbose: false,
        minScoreToReport: 0,
      });

      let called = false;

      antibody.on('threat:learned', (threat: DetectedThreat) => {
        if (!called) {
          expect(threat.severity).toBe('critical');
          called = true;
          done();
        }
      });

      antibody.scan('<script>alert(1)</script>'); // Critical severity
    });
  });

  describe('Reset', () => {
    it('should reset all statistics and history', () => {
      const antibody = new Antibody({ verbose: false, minScoreToReport: 0 });

      antibody.scan('<script>alert(1)</script>');
      antibody.scan("SELECT * FROM users");

      antibody.reset();

      const stats = antibody.getStatistics();
      const threats = antibody.getDetectedThreats();

      expect(stats.totalDetected).toBe(0);
      expect(threats.length).toBe(0);
    });
  });

  describe('Multiple Matches', () => {
    it('should increase score for multiple pattern matches', () => {
      const antibody = new Antibody({ verbose: false });

      // Multiple SQL injection patterns
      const input = "SELECT * FROM users WHERE id = 1 OR 1=1 UNION SELECT password FROM admin";

      const threats = antibody.scan(input);

      expect(threats.length).toBeGreaterThan(0);
      // Score should be higher due to multiple matches
      const highScoreThreats = threats.filter(t => t.score >= 85);
      expect(highScoreThreats.length).toBeGreaterThan(0);
    });
  });

  describe('Input Truncation', () => {
    it('should truncate long inputs in threat records', () => {
      const antibody = new Antibody({ verbose: false });

      const longInput = '<script>' + 'a'.repeat(1000) + '</script>';

      antibody.scan(longInput);

      const threats = antibody.getDetectedThreats();
      expect(threats[0]?.input.length).toBeLessThanOrEqual(200);
    });
  });
});
