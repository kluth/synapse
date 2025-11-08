/**
 * Antibody - Threat Detection System
 *
 * Like antibodies in the immune system that identify and mark threats,
 * this component detects security threats and vulnerabilities in the system.
 */

import { EventEmitter } from 'events';

/**
 * Threat types that can be detected
 */
export type ThreatType =
  | 'sql-injection'
  | 'xss'
  | 'path-traversal'
  | 'command-injection'
  | 'ldap-injection'
  | 'xxe'
  | 'csrf'
  | 'session-hijacking'
  | 'brute-force'
  | 'dos'
  | 'data-leak'
  | 'unauthorized-access'
  | 'malformed-input'
  | 'suspicious-pattern'
  | 'unknown';

/**
 * Threat severity levels
 */
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Detected threat information
 */
export interface DetectedThreat {
  /**
   * Unique threat identifier
   */
  id: string;

  /**
   * Type of threat detected
   */
  type: ThreatType;

  /**
   * Severity level
   */
  severity: ThreatSeverity;

  /**
   * Threat score (0-100, higher is more severe)
   */
  score: number;

  /**
   * Description of the threat
   */
  description: string;

  /**
   * The input that triggered the detection
   */
  input: string;

  /**
   * Matched pattern (if any)
   */
  pattern?: string;

  /**
   * Source of the threat (IP, user, etc.)
   */
  source?: string;

  /**
   * Timestamp of detection
   */
  timestamp: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Threat pattern definition
 */
export interface ThreatPattern {
  /**
   * Pattern name
   */
  name: string;

  /**
   * Threat type
   */
  type: ThreatType;

  /**
   * Regular expression pattern
   */
  pattern: RegExp;

  /**
   * Severity if matched
   */
  severity: ThreatSeverity;

  /**
   * Base score
   */
  score: number;

  /**
   * Description
   */
  description: string;
}

/**
 * Antibody configuration
 */
export interface AntibodyConfig {
  /**
   * Enable threat detection
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom threat patterns to add
   */
  customPatterns?: ThreatPattern[];

  /**
   * Minimum score to report (0-100)
   * @default 30
   */
  minScoreToReport?: number;

  /**
   * Maximum threats to keep in memory
   * @default 1000
   */
  maxThreatHistory?: number;

  /**
   * Enable automatic learning from detections
   * @default false
   */
  enableLearning?: boolean;

  /**
   * Verbose logging
   * @default false
   */
  verbose?: boolean;
}

/**
 * Threat detection statistics
 */
export interface ThreatStatistics {
  /**
   * Total threats detected
   */
  totalDetected: number;

  /**
   * Threats by type
   */
  byType: Record<ThreatType, number>;

  /**
   * Threats by severity
   */
  bySeverity: Record<ThreatSeverity, number>;

  /**
   * Average threat score
   */
  averageScore: number;

  /**
   * Highest threat score seen
   */
  highestScore: number;

  /**
   * Most common threat type
   */
  mostCommonType: ThreatType;

  /**
   * Detection rate (threats per minute)
   */
  detectionRate: number;
}

/**
 * Antibody - Threat Detection System
 *
 * Detects security threats using pattern matching and heuristics.
 * Maintains a memory of detected threats for analysis and learning.
 *
 * @example
 * ```typescript
 * const antibody = new Antibody({
 *   minScoreToReport: 50,
 *   enableLearning: true
 * });
 *
 * antibody.on('threat:detected', (threat) => {
 *   console.log(`Threat detected: ${threat.type} (${threat.severity})`);
 * });
 *
 * const threats = antibody.scan("SELECT * FROM users WHERE id = '1 OR 1=1'");
 * ```
 */
export class Antibody extends EventEmitter {
  private readonly config: Required<AntibodyConfig>;
  private patterns: ThreatPattern[] = [];
  private detectedThreats: DetectedThreat[] = [];
  private threatCounter: number = 0;
  private startTime: number = Date.now();

  constructor(config: AntibodyConfig = {}) {
    super();

    this.config = {
      enabled: config.enabled ?? true,
      customPatterns: config.customPatterns ?? [],
      minScoreToReport: config.minScoreToReport ?? 30,
      maxThreatHistory: config.maxThreatHistory ?? 1000,
      enableLearning: config.enableLearning ?? false,
      verbose: config.verbose ?? false,
    };

    this.initializePatterns();
  }

  /**
   * Initialize default threat patterns
   */
  private initializePatterns(): void {
    // SQL Injection patterns
    this.addPattern({
      name: 'SQL Injection - UNION',
      type: 'sql-injection',
      pattern: /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/gi,
      severity: 'critical',
      score: 90,
      description: 'SQL UNION-based injection attempt',
    });

    this.addPattern({
      name: 'SQL Injection - OR 1=1',
      type: 'sql-injection',
      pattern: /(\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)|(\band\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/gi,
      severity: 'critical',
      score: 85,
      description: 'SQL tautology-based injection',
    });

    this.addPattern({
      name: 'SQL Injection - Comment',
      type: 'sql-injection',
      pattern: /(--|;|\/\*|\*\/|#|\/\/)/g,
      severity: 'high',
      score: 70,
      description: 'SQL comment injection',
    });

    // XSS patterns
    this.addPattern({
      name: 'XSS - Script Tag',
      type: 'xss',
      pattern: /<script[^>]*>.*?<\/script>/gi,
      severity: 'critical',
      score: 95,
      description: 'Script tag injection attempt',
    });

    this.addPattern({
      name: 'XSS - Event Handler',
      type: 'xss',
      pattern: /\bon\w+\s*=\s*['"]/gi,
      severity: 'high',
      score: 80,
      description: 'Event handler injection attempt',
    });

    this.addPattern({
      name: 'XSS - JavaScript Protocol',
      type: 'xss',
      pattern: /javascript\s*:/gi,
      severity: 'high',
      score: 75,
      description: 'JavaScript protocol injection',
    });

    // Path Traversal patterns
    this.addPattern({
      name: 'Path Traversal - Directory',
      type: 'path-traversal',
      pattern: /\.\.[/\\]/g,
      severity: 'high',
      score: 80,
      description: 'Directory traversal attempt',
    });

    this.addPattern({
      name: 'Path Traversal - Encoded',
      type: 'path-traversal',
      pattern: /(%2e%2e[/\\])|(%252e%252e[/\\])/gi,
      severity: 'high',
      score: 85,
      description: 'Encoded directory traversal',
    });

    // Command Injection patterns
    this.addPattern({
      name: 'Command Injection - Pipe',
      type: 'command-injection',
      pattern: /[|;&`$()]/g,
      severity: 'critical',
      score: 90,
      description: 'Command injection metacharacters',
    });

    // LDAP Injection patterns
    this.addPattern({
      name: 'LDAP Injection',
      type: 'ldap-injection',
      pattern: /[*()|&]/g,
      severity: 'high',
      score: 75,
      description: 'LDAP filter injection',
    });

    // XXE patterns
    this.addPattern({
      name: 'XXE - DOCTYPE',
      type: 'xxe',
      pattern: /<!DOCTYPE[^>]*\[.*<!ENTITY/gi,
      severity: 'critical',
      score: 95,
      description: 'XML External Entity injection',
    });

    // Add custom patterns
    this.config.customPatterns.forEach((pattern) => {
      this.addPattern(pattern);
    });
  }

  /**
   * Add a threat pattern
   */
  public addPattern(pattern: ThreatPattern): void {
    this.patterns.push(pattern);

    if (this.config.verbose) {
      this.log(`Added threat pattern: ${pattern.name}`);
    }
  }

  /**
   * Remove a threat pattern by name
   */
  public removePattern(name: string): boolean {
    const initialLength = this.patterns.length;
    this.patterns = this.patterns.filter((p) => p.name !== name);

    const removed = this.patterns.length < initialLength;

    if (removed && this.config.verbose) {
      this.log(`Removed threat pattern: ${name}`);
    }

    return removed;
  }

  /**
   * Scan input for threats
   */
  public scan(input: string, source?: string): DetectedThreat[] {
    if (!this.config.enabled) {
      return [];
    }

    const threats: DetectedThreat[] = [];

    for (const pattern of this.patterns) {
      const matches = input.match(pattern.pattern);

      if (matches !== null && matches.length > 0) {
        const threat: DetectedThreat = {
          id: this.generateThreatId(),
          type: pattern.type,
          severity: pattern.severity,
          score: this.calculateScore(pattern, matches.length),
          description: pattern.description,
          input: input.substring(0, 200), // Truncate long inputs
          pattern: pattern.name,
          source,
          timestamp: Date.now(),
          metadata: {
            matchCount: matches.length,
            matches: matches.slice(0, 5), // First 5 matches
          },
        };

        if (threat.score >= this.config.minScoreToReport) {
          threats.push(threat);
          this.recordThreat(threat);
        }
      }
    }

    return threats;
  }

  /**
   * Calculate threat score based on pattern and context
   */
  private calculateScore(pattern: ThreatPattern, matchCount: number): number {
    // Base score from pattern
    let score = pattern.score;

    // Increase score based on number of matches
    if (matchCount > 1) {
      score += Math.min(matchCount - 1, 10); // Max +10 for multiple matches
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Record a detected threat
   */
  private recordThreat(threat: DetectedThreat): void {
    this.detectedThreats.push(threat);
    this.threatCounter++;

    // Limit history size
    if (this.detectedThreats.length > this.config.maxThreatHistory) {
      this.detectedThreats.shift();
    }

    // Emit event
    this.emit('threat:detected', threat);

    if (this.config.verbose) {
      this.log(`Threat detected: ${threat.type} (${threat.severity}) - Score: ${threat.score}`);
    }

    // Learn from high-severity threats if learning is enabled
    if (this.config.enableLearning && threat.severity === 'critical') {
      this.learnFromThreat(threat);
    }
  }

  /**
   * Learn from detected threat (placeholder for ML integration)
   */
  private learnFromThreat(threat: DetectedThreat): void {
    // Placeholder for future machine learning integration
    // Could analyze patterns and create new detection rules
    this.emit('threat:learned', threat);
  }

  /**
   * Generate unique threat ID
   */
  private generateThreatId(): string {
    return `threat-${Date.now()}-${this.threatCounter}`;
  }

  /**
   * Get all detected threats
   */
  public getDetectedThreats(limit?: number): DetectedThreat[] {
    if (limit !== undefined) {
      return this.detectedThreats.slice(-limit);
    }
    return [...this.detectedThreats];
  }

  /**
   * Get threats by type
   */
  public getThreatsByType(type: ThreatType): DetectedThreat[] {
    return this.detectedThreats.filter((t) => t.type === type);
  }

  /**
   * Get threats by severity
   */
  public getThreatsBySeverity(severity: ThreatSeverity): DetectedThreat[] {
    return this.detectedThreats.filter((t) => t.severity === severity);
  }

  /**
   * Get threats by source
   */
  public getThreatsBySource(source: string): DetectedThreat[] {
    return this.detectedThreats.filter((t) => t.source === source);
  }

  /**
   * Get threat statistics
   */
  public getStatistics(): ThreatStatistics {
    const byType: Record<ThreatType, number> = {
      'sql-injection': 0,
      xss: 0,
      'path-traversal': 0,
      'command-injection': 0,
      'ldap-injection': 0,
      xxe: 0,
      csrf: 0,
      'session-hijacking': 0,
      'brute-force': 0,
      dos: 0,
      'data-leak': 0,
      'unauthorized-access': 0,
      'malformed-input': 0,
      'suspicious-pattern': 0,
      unknown: 0,
    };

    const bySeverity: Record<ThreatSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    let totalScore = 0;
    let highestScore = 0;

    this.detectedThreats.forEach((threat) => {
      byType[threat.type]++;
      bySeverity[threat.severity]++;
      totalScore += threat.score;
      if (threat.score > highestScore) {
        highestScore = threat.score;
      }
    });

    // Find most common type
    let mostCommonType: ThreatType = 'unknown';
    let maxCount = 0;
    for (const [type, count] of Object.entries(byType)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type as ThreatType;
      }
    }

    // Calculate detection rate (threats per minute)
    const uptime = (Date.now() - this.startTime) / 60000; // minutes
    const detectionRate = uptime > 0 ? this.threatCounter / uptime : 0;

    return {
      totalDetected: this.threatCounter,
      byType,
      bySeverity,
      averageScore: this.detectedThreats.length > 0 ? totalScore / this.detectedThreats.length : 0,
      highestScore,
      mostCommonType,
      detectionRate,
    };
  }

  /**
   * Clear threat history
   */
  public clearHistory(): void {
    this.detectedThreats = [];

    if (this.config.verbose) {
      this.log('Threat history cleared');
    }

    this.emit('history:cleared');
  }

  /**
   * Reset statistics
   */
  public reset(): void {
    this.detectedThreats = [];
    this.threatCounter = 0;
    this.startTime = Date.now();

    if (this.config.verbose) {
      this.log('Antibody reset');
    }

    this.emit('reset');
  }

  /**
   * Get all patterns
   */
  public getPatterns(): ThreatPattern[] {
    return [...this.patterns];
  }

  /**
   * Check if antibody is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable/disable threat detection
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (this.config.verbose) {
      this.log(`Threat detection ${enabled ? 'enabled' : 'disabled'}`);
    }

    this.emit('enabled:changed', enabled);
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.config.verbose) {
      // Using warn for verbose logging as it's allowed by linter
      console.warn(`[Antibody] ${message}`);
    }
  }
}
