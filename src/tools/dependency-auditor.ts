import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface DependencyAnalysis {
  packageName: string;
  currentVersion: string;
  latestVersion?: string;
  isHealthy: boolean;
  isOutdated: boolean;
  isDeprecated: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  maintenanceScore: number;
  lastPublishDate?: Date;
  description?: string;
  riskReasons: string[];
}

export interface AuditReport {
  timestamp: Date;
  totalDependencies: number;
  productionDependencies: number;
  devDependencies: number;
  analyzedPackages: DependencyAnalysis[];
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  needsAttention: DependencyAnalysis[];
}

export interface AuditOptions {
  includeDevDependencies?: boolean;
}

export class DependencyAuditor {
  /**
   * Analyzes a single dependency for health, maintenance status, and risks
   */
  async analyzeDependency(
    packageName: string,
    currentVersion: string,
  ): Promise<DependencyAnalysis> {
    const analysis: DependencyAnalysis = {
      packageName,
      currentVersion,
      isHealthy: true,
      isOutdated: false,
      isDeprecated: false,
      riskLevel: 'low',
      maintenanceScore: 100,
      riskReasons: [],
    };

    try {
      // Get package info from npm
      const npmInfo = await this.getNpmPackageInfo(packageName);

      if (!npmInfo) {
        analysis.isHealthy = false;
        analysis.riskLevel = 'high';
        analysis.riskReasons.push('Unable to fetch package information');
        return analysis;
      }

      // Check if deprecated
      if (npmInfo.deprecated) {
        analysis.isDeprecated = true;
        analysis.riskLevel = 'critical';
        analysis.isHealthy = false;
        analysis.riskReasons.push(`Deprecated: ${npmInfo.deprecated}`);
        analysis.description = npmInfo.deprecated;
      }

      // Get latest version
      analysis.latestVersion = npmInfo.latestVersion;

      // Check if outdated
      if (this.isVersionOutdated(currentVersion, npmInfo.latestVersion)) {
        analysis.isOutdated = true;
        analysis.riskReasons.push(
          `Outdated version (current: ${currentVersion}, latest: ${npmInfo.latestVersion})`,
        );
      }

      // Get last publish date
      if (npmInfo.lastPublishDate) {
        analysis.lastPublishDate = new Date(npmInfo.lastPublishDate);
      }

      // Calculate maintenance score
      analysis.maintenanceScore = this.calculateMaintenanceScore(
        npmInfo.lastPublishDate,
        npmInfo.repositoryUrl,
      );

      // Assess risk based on maintenance score
      if (analysis.maintenanceScore < 30 && !analysis.isDeprecated) {
        analysis.riskLevel = 'high';
        analysis.isHealthy = false;
        analysis.riskReasons.push(`Low maintenance score: ${analysis.maintenanceScore}/100`);
      } else if (analysis.maintenanceScore < 60 && !analysis.isDeprecated) {
        analysis.riskLevel = 'medium';
        analysis.riskReasons.push(`Moderate maintenance score: ${analysis.maintenanceScore}/100`);
      }

      // Update health status
      if (analysis.riskReasons.length === 0) {
        analysis.isHealthy = true;
        analysis.riskLevel = 'low';
      }
    } catch (error) {
      analysis.isHealthy = false;
      analysis.riskLevel = 'medium';
      analysis.riskReasons.push(
        `Error analyzing package: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return analysis;
  }

  /**
   * Audits all dependencies in a project
   */
  async auditProject(packageJsonPath: string, options: AuditOptions = {}): Promise<AuditReport> {
    const { includeDevDependencies = false } = options;

    // Read package.json
    const packageJson = JSON.parse(readFileSync(resolve(packageJsonPath), 'utf-8'));

    const prodDeps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    const analyzedPackages: DependencyAnalysis[] = [];

    // Analyze production dependencies
    for (const [name, version] of Object.entries(prodDeps)) {
      const cleanVersion = this.cleanVersion(version as string);
      const analysis = await this.analyzeDependency(name, cleanVersion);
      analyzedPackages.push(analysis);
    }

    // Analyze dev dependencies if requested
    if (includeDevDependencies) {
      for (const [name, version] of Object.entries(devDeps)) {
        const cleanVersion = this.cleanVersion(version as string);
        const analysis = await this.analyzeDependency(name, cleanVersion);
        analyzedPackages.push(analysis);
      }
    }

    // Calculate risk distribution
    const riskDistribution = {
      critical: analyzedPackages.filter((p) => p.riskLevel === 'critical').length,
      high: analyzedPackages.filter((p) => p.riskLevel === 'high').length,
      medium: analyzedPackages.filter((p) => p.riskLevel === 'medium').length,
      low: analyzedPackages.filter((p) => p.riskLevel === 'low').length,
    };

    // Identify packages needing attention
    const needsAttention = analyzedPackages.filter(
      (p) => p.riskLevel === 'critical' || p.riskLevel === 'high' || !p.isHealthy,
    );

    return {
      timestamp: new Date(),
      totalDependencies: Object.keys(prodDeps).length + Object.keys(devDeps).length,
      productionDependencies: Object.keys(prodDeps).length,
      devDependencies: Object.keys(devDeps).length,
      analyzedPackages,
      riskDistribution,
      needsAttention,
    };
  }

  /**
   * Generates a markdown report from the audit results
   */
  generateMarkdownReport(report: AuditReport): string {
    const lines: string[] = [];

    lines.push('# Dependency Audit Report');
    lines.push('');
    lines.push(`**Generated:** ${report.timestamp.toISOString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Dependencies:** ${report.totalDependencies}`);
    lines.push(`- **Production Dependencies:** ${report.productionDependencies}`);
    lines.push(`- **Dev Dependencies:** ${report.devDependencies}`);
    lines.push(`- **Analyzed Packages:** ${report.analyzedPackages.length}`);
    lines.push('');

    // Risk Distribution
    lines.push('## Risk Distribution');
    lines.push('');
    lines.push('| Risk Level | Count |');
    lines.push('|------------|-------|');
    lines.push(`| Critical | ${report.riskDistribution.critical} |`);
    lines.push(`| High | ${report.riskDistribution.high} |`);
    lines.push(`| Medium | ${report.riskDistribution.medium} |`);
    lines.push(`| Low | ${report.riskDistribution.low} |`);
    lines.push('');

    // Packages Needing Attention
    if (report.needsAttention.length > 0) {
      lines.push('## Packages Needing Attention');
      lines.push('');
      lines.push('| Package | Current | Latest | Risk | Reasons |');
      lines.push('|---------|---------|--------|------|---------|');

      for (const pkg of report.needsAttention) {
        const reasons = pkg.riskReasons.join('; ');
        lines.push(
          `| ${pkg.packageName} | ${pkg.currentVersion} | ${pkg.latestVersion || 'N/A'} | ${pkg.riskLevel} | ${reasons} |`,
        );
      }
      lines.push('');
    }

    // All Analyzed Packages
    lines.push('## Analyzed Packages');
    lines.push('');
    lines.push('| Package | Current | Latest | Status | Maintenance Score | Risk Level |');
    lines.push('|---------|---------|--------|--------|-------------------|------------|');

    for (const pkg of report.analyzedPackages) {
      const status = pkg.isHealthy ? '✅ Healthy' : '⚠️ Needs Review';
      lines.push(
        `| ${pkg.packageName} | ${pkg.currentVersion} | ${pkg.latestVersion || 'N/A'} | ${status} | ${pkg.maintenanceScore}/100 | ${pkg.riskLevel} |`,
      );
    }
    lines.push('');

    // Recommendations
    lines.push('## Recommendations');
    lines.push('');

    if (report.needsAttention.length === 0) {
      lines.push(
        '✅ All dependencies are healthy and well-maintained. No immediate action required.',
      );
    } else {
      lines.push('### Immediate Actions Required:');
      lines.push('');

      const critical = report.needsAttention.filter((p) => p.riskLevel === 'critical');
      if (critical.length > 0) {
        lines.push('**Critical Priority:**');
        for (const pkg of critical) {
          lines.push(`- **${pkg.packageName}**: ${pkg.riskReasons.join(', ')}`);
        }
        lines.push('');
      }

      const high = report.needsAttention.filter((p) => p.riskLevel === 'high');
      if (high.length > 0) {
        lines.push('**High Priority:**');
        for (const pkg of high) {
          lines.push(`- **${pkg.packageName}**: ${pkg.riskReasons.join(', ')}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Gets package information from npm registry
   */
  private async getNpmPackageInfo(packageName: string): Promise<{
    latestVersion: string;
    deprecated?: string;
    lastPublishDate?: string;
    repositoryUrl?: string;
  } | null> {
    try {
      // Get package info using npm view
      const output = execSync(
        `npm view ${packageName} version deprecated time.modified repository.url --json`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
      );

      const info = JSON.parse(output);

      return {
        latestVersion: info.version || info,
        deprecated: info.deprecated,
        lastPublishDate: info['time.modified'],
        repositoryUrl: info['repository.url'],
      };
    } catch (error) {
      // Package might not exist or npm view failed
      return null;
    }
  }

  /**
   * Calculates a maintenance score based on last publish date and repository
   */
  private calculateMaintenanceScore(lastPublishDate?: string, repositoryUrl?: string): number {
    let score = 100;

    if (!lastPublishDate) {
      return 50; // Unknown maintenance status
    }

    const lastPublish = new Date(lastPublishDate);
    const now = new Date();
    const daysSincePublish = Math.floor(
      (now.getTime() - lastPublish.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Deduct points based on age
    if (daysSincePublish > 365 * 3) {
      // > 3 years
      score -= 60;
    } else if (daysSincePublish > 365 * 2) {
      // > 2 years
      score -= 40;
    } else if (daysSincePublish > 365) {
      // > 1 year
      score -= 20;
    } else if (daysSincePublish > 180) {
      // > 6 months
      score -= 10;
    }

    // Bonus for recent activity
    if (daysSincePublish < 30) {
      score = Math.min(100, score + 10);
    }

    // Deduct if no repository
    if (!repositoryUrl) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Cleans version string by removing prefixes like ^, ~, etc.
   */
  private cleanVersion(version: string): string {
    return version.replace(/^[\^~>=<]+/, '');
  }

  /**
   * Checks if current version is outdated compared to latest
   */
  private isVersionOutdated(current: string, latest: string): boolean {
    const currentClean = this.cleanVersion(current);
    const latestClean = this.cleanVersion(latest);

    // Simple string comparison for now
    // In production, use semver library for proper comparison
    return currentClean !== latestClean;
  }
}
