/**
 * LabReport - Test Results Report
 *
 * LabReport provides comprehensive reporting of experiment results,
 * including statistics, summaries, and detailed failure information.
 */

import type { ExperimentResult } from './Experiment';
import type { LaboratoryStats } from './Laboratory';

/**
 * Lab report
 */
export interface LabReport {
  /**
   * Laboratory name
   */
  laboratoryName: string;

  /**
   * Report timestamp
   */
  timestamp: Date;

  /**
   * Overall statistics
   */
  stats: LaboratoryStats;

  /**
   * Experiment results
   */
  results: ExperimentResult[];

  /**
   * Total duration (ms)
   */
  duration: number;

  /**
   * Overall success
   */
  success: boolean;
}

/**
 * Report format
 */
export type ReportFormat = 'text' | 'json' | 'html' | 'markdown';

/**
 * LabReporter - Report generator
 */

export class LabReporter {
  /**
   * Format report as text
   */
  public static formatText(report: LabReport): string {
    const lines: string[] = [];

    // Header
    lines.push('═'.repeat(60));
    lines.push(`Laboratory Report: ${report.laboratoryName}`);
    lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
    lines.push('═'.repeat(60));
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push('─'.repeat(60));
    lines.push(`Total Experiments: ${report.stats.totalExperiments}`);
    lines.push(`✓ Passed: ${report.stats.passed}`);
    lines.push(`✗ Failed: ${report.stats.failed}`);
    lines.push(`⊘ Skipped: ${report.stats.skipped}`);
    lines.push(`Success Rate: ${(report.stats.successRate * 100).toFixed(2)}%`);
    lines.push(`Duration: ${report.duration}ms`);
    lines.push('');

    // Results
    if (report.results.length > 0) {
      lines.push('RESULTS');
      lines.push('─'.repeat(60));

      for (const result of report.results) {
        const status = result.success ? '✓' : '✗';
        lines.push(`${status} ${result.experimentName} (${result.duration}ms)`);

        // Show hypothesis results
        if (result.hypotheses.length > 0) {
          for (const hypothesis of result.hypotheses) {
            const hypStatus = hypothesis.passed ? '  ✓' : '  ✗';
            lines.push(`${hypStatus} ${hypothesis.name}`);

            if (!hypothesis.passed && hypothesis.message !== undefined) {
              lines.push(`    Error: ${hypothesis.message}`);
            }
          }
        }

        // Show error if present
        if (result.error !== undefined) {
          lines.push(`  Error: ${result.error.message}`);
        }

        // Show retries if any
        if (result.retries !== undefined && result.retries > 0) {
          lines.push(`  Retries: ${result.retries}`);
        }

        lines.push('');
      }
    }

    // Footer
    lines.push('═'.repeat(60));
    lines.push(report.success ? 'ALL EXPERIMENTS PASSED ✓' : 'SOME EXPERIMENTS FAILED ✗');
    lines.push('═'.repeat(60));

    return lines.join('\n');
  }

  /**
   * Format report as JSON
   */
  public static formatJSON(report: LabReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Format report as HTML
   */
  public static formatHTML(report: LabReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Lab Report: ${report.laboratoryName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0 0 10px;
      color: #333;
    }
    .timestamp {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      padding: 20px;
      border-radius: 4px;
      background: #f9f9f9;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .skipped { color: #ffc107; }
    .experiment {
      padding: 15px;
      margin-bottom: 10px;
      border-left: 4px solid #ddd;
      background: #f9f9f9;
    }
    .experiment.success { border-left-color: #28a745; }
    .experiment.failure { border-left-color: #dc3545; }
    .experiment-name {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .hypothesis {
      padding: 5px 0;
      padding-left: 20px;
    }
    .error {
      color: #dc3545;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      background: #fff5f5;
      margin-top: 10px;
      border-radius: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 10px;
    }
    .status-badge.success { background: #d4edda; color: #155724; }
    .status-badge.failure { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Laboratory Report: ${report.laboratoryName}</h1>
    <div class="timestamp">${report.timestamp.toISOString()}</div>

    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${report.stats.totalExperiments}</div>
        <div class="stat-label">Total Experiments</div>
      </div>
      <div class="stat-card">
        <div class="stat-value passed">${report.stats.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value failed">${report.stats.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value skipped">${report.stats.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${(report.stats.successRate * 100).toFixed(1)}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.duration}ms</div>
        <div class="stat-label">Duration</div>
      </div>
    </div>

    <h2>Results</h2>
    ${report.results
      .map(
        (result) => `
      <div class="experiment ${result.success ? 'success' : 'failure'}">
        <div class="experiment-name">
          <span class="status-badge ${result.success ? 'success' : 'failure'}">
            ${result.success ? '✓ PASS' : '✗ FAIL'}
          </span>
          ${result.experimentName} (${result.duration}ms)
          ${result.retries !== undefined && result.retries > 0 ? `<span style="color: #ffc107;">↺ ${result.retries} retries</span>` : ''}
        </div>
        ${result.hypotheses
          .map(
            (hyp) => `
          <div class="hypothesis">
            ${hyp.passed ? '✓' : '✗'} ${hyp.name}
            ${!hyp.passed && hyp.message !== undefined ? `<div class="error">${hyp.message}</div>` : ''}
          </div>
        `,
          )
          .join('')}
        ${result.error !== undefined ? `<div class="error">${result.error.message}</div>` : ''}
      </div>
    `,
      )
      .join('')}

    <div style="margin-top: 30px; padding: 20px; text-align: center; background: ${report.success ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
      <strong>${report.success ? 'ALL EXPERIMENTS PASSED ✓' : 'SOME EXPERIMENTS FAILED ✗'}</strong>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format report as Markdown
   */
  public static formatMarkdown(report: LabReport): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Laboratory Report: ${report.laboratoryName}`);
    lines.push('');
    lines.push(`**Timestamp:** ${report.timestamp.toISOString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Experiments | ${report.stats.totalExperiments} |`);
    lines.push(`| ✓ Passed | ${report.stats.passed} |`);
    lines.push(`| ✗ Failed | ${report.stats.failed} |`);
    lines.push(`| ⊘ Skipped | ${report.stats.skipped} |`);
    lines.push(`| Success Rate | ${(report.stats.successRate * 100).toFixed(2)}% |`);
    lines.push(`| Duration | ${report.duration}ms |`);
    lines.push('');

    // Results
    lines.push('## Results');
    lines.push('');

    for (const result of report.results) {
      const status = result.success ? '✓ **PASS**' : '✗ **FAIL**';
      lines.push(`### ${status}: ${result.experimentName}`);
      lines.push('');
      lines.push(`**Duration:** ${result.duration}ms`);

      if (result.retries !== undefined && result.retries > 0) {
        lines.push(`**Retries:** ${result.retries}`);
      }

      lines.push('');

      // Hypotheses
      if (result.hypotheses.length > 0) {
        lines.push('**Hypotheses:**');
        lines.push('');

        for (const hypothesis of result.hypotheses) {
          const hypStatus = hypothesis.passed ? '✓' : '✗';
          lines.push(`- ${hypStatus} ${hypothesis.name}`);

          if (!hypothesis.passed && hypothesis.message !== undefined) {
            lines.push(`  - Error: \`${hypothesis.message}\``);
          }
        }

        lines.push('');
      }

      // Error
      if (result.error !== undefined) {
        lines.push('**Error:**');
        lines.push('');
        lines.push('```');
        lines.push(result.error.message);
        lines.push('```');
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Footer
    lines.push('## Status');
    lines.push('');
    lines.push(report.success ? '✓ **ALL EXPERIMENTS PASSED**' : '✗ **SOME EXPERIMENTS FAILED**');

    return lines.join('\n');
  }

  /**
   * Format report in specified format
   */
  public static format(report: LabReport, format: ReportFormat): string {
    switch (format) {
      case 'text':
        return this.formatText(report);
      case 'json':
        return this.formatJSON(report);
      case 'html':
        return this.formatHTML(report);
      case 'markdown':
        return this.formatMarkdown(report);
      default:
        throw new Error(`Unknown report format: ${String(format)}`);
    }
  }

  /**
   * Get failed experiments
   */
  public static getFailures(report: LabReport): ExperimentResult[] {
    return report.results.filter((r) => !r.success);
  }

  /**
   * Get passed experiments
   */
  public static getPasses(report: LabReport): ExperimentResult[] {
    return report.results.filter((r) => r.success);
  }

  /**
   * Get slowest experiments
   */
  public static getSlowest(report: LabReport, count: number = 5): ExperimentResult[] {
    return [...report.results].sort((a, b) => b.duration - a.duration).slice(0, count);
  }

  /**
   * Get experiments with retries
   */
  public static getRetried(report: LabReport): ExperimentResult[] {
    return report.results.filter((r) => r.retries !== undefined && r.retries > 0);
  }
}
