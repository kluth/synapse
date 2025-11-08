#!/usr/bin/env node
const { execSync } = require('child_process');
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { resolve } = require('path');

class DependencyAuditor {
  async analyzeDependency(packageName, currentVersion) {
    const analysis = {
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
      const npmInfo = this.getNpmPackageInfo(packageName);

      if (!npmInfo) {
        analysis.isHealthy = false;
        analysis.riskLevel = 'high';
        analysis.riskReasons.push('Unable to fetch package information');
        return analysis;
      }

      if (npmInfo.deprecated) {
        analysis.isDeprecated = true;
        analysis.riskLevel = 'critical';
        analysis.isHealthy = false;
        analysis.riskReasons.push(`Deprecated: ${npmInfo.deprecated}`);
        analysis.description = npmInfo.deprecated;
      }

      analysis.latestVersion = npmInfo.latestVersion;

      if (this.isVersionOutdated(currentVersion, npmInfo.latestVersion)) {
        analysis.isOutdated = true;
        analysis.riskReasons.push(
          `Outdated version (current: ${currentVersion}, latest: ${npmInfo.latestVersion})`
        );
      }

      if (npmInfo.lastPublishDate) {
        analysis.lastPublishDate = new Date(npmInfo.lastPublishDate);
      }

      analysis.maintenanceScore = this.calculateMaintenanceScore(
        npmInfo.lastPublishDate,
        npmInfo.repositoryUrl
      );

      if (analysis.maintenanceScore < 30 && !analysis.isDeprecated) {
        analysis.riskLevel = 'high';
        analysis.isHealthy = false;
        analysis.riskReasons.push(
          `Low maintenance score: ${analysis.maintenanceScore}/100`
        );
      } else if (analysis.maintenanceScore < 60 && !analysis.isDeprecated) {
        analysis.riskLevel = 'medium';
        analysis.riskReasons.push(
          `Moderate maintenance score: ${analysis.maintenanceScore}/100`
        );
      }

      if (analysis.riskReasons.length === 0) {
        analysis.isHealthy = true;
        analysis.riskLevel = 'low';
      }
    } catch (error) {
      analysis.isHealthy = false;
      analysis.riskLevel = 'medium';
      analysis.riskReasons.push(`Error analyzing package: ${error.message}`);
    }

    return analysis;
  }

  async auditProject(packageJsonPath, options = {}) {
    const { includeDevDependencies = false } = options;

    const packageJson = JSON.parse(readFileSync(resolve(packageJsonPath), 'utf-8'));

    const prodDeps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    const analyzedPackages = [];

    for (const [name, version] of Object.entries(prodDeps)) {
      const cleanVersion = this.cleanVersion(version);
      const analysis = await this.analyzeDependency(name, cleanVersion);
      analyzedPackages.push(analysis);
    }

    if (includeDevDependencies) {
      for (const [name, version] of Object.entries(devDeps)) {
        const cleanVersion = this.cleanVersion(version);
        const analysis = await this.analyzeDependency(name, cleanVersion);
        analyzedPackages.push(analysis);
      }
    }

    const riskDistribution = {
      critical: analyzedPackages.filter((p) => p.riskLevel === 'critical').length,
      high: analyzedPackages.filter((p) => p.riskLevel === 'high').length,
      medium: analyzedPackages.filter((p) => p.riskLevel === 'medium').length,
      low: analyzedPackages.filter((p) => p.riskLevel === 'low').length,
    };

    const needsAttention = analyzedPackages.filter(
      (p) => p.riskLevel === 'critical' || p.riskLevel === 'high' || !p.isHealthy
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

  generateMarkdownReport(report) {
    const lines = [];

    lines.push('# Dependency Audit Report');
    lines.push('');
    lines.push(`**Generated:** ${report.timestamp.toISOString()}`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Dependencies:** ${report.totalDependencies}`);
    lines.push(`- **Production Dependencies:** ${report.productionDependencies}`);
    lines.push(`- **Dev Dependencies:** ${report.devDependencies}`);
    lines.push(`- **Analyzed Packages:** ${report.analyzedPackages.length}`);
    lines.push('');

    lines.push('## Risk Distribution');
    lines.push('');
    lines.push('| Risk Level | Count |');
    lines.push('|------------|-------|');
    lines.push(`| Critical | ${report.riskDistribution.critical} |`);
    lines.push(`| High | ${report.riskDistribution.high} |`);
    lines.push(`| Medium | ${report.riskDistribution.medium} |`);
    lines.push(`| Low | ${report.riskDistribution.low} |`);
    lines.push('');

    if (report.needsAttention.length > 0) {
      lines.push('## Packages Needing Attention');
      lines.push('');
      lines.push('| Package | Current | Latest | Risk | Reasons |');
      lines.push('|---------|---------|--------|------|---------|');

      for (const pkg of report.needsAttention) {
        const reasons = pkg.riskReasons.join('; ');
        lines.push(
          `| ${pkg.packageName} | ${pkg.currentVersion} | ${pkg.latestVersion || 'N/A'} | ${pkg.riskLevel} | ${reasons} |`
        );
      }
      lines.push('');
    }

    lines.push('## Analyzed Packages');
    lines.push('');
    lines.push(
      '| Package | Current | Latest | Status | Maintenance Score | Risk Level |'
    );
    lines.push(
      '|---------|---------|--------|--------|-------------------|------------|'
    );

    for (const pkg of report.analyzedPackages) {
      const status = pkg.isHealthy ? '✅ Healthy' : '⚠️ Needs Review';
      lines.push(
        `| ${pkg.packageName} | ${pkg.currentVersion} | ${pkg.latestVersion || 'N/A'} | ${status} | ${pkg.maintenanceScore}/100 | ${pkg.riskLevel} |`
      );
    }
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');

    if (report.needsAttention.length === 0) {
      lines.push(
        '✅ All dependencies are healthy and well-maintained. No immediate action required.'
      );
    } else {
      lines.push('### Immediate Actions Required:');
      lines.push('');

      const critical = report.needsAttention.filter(
        (p) => p.riskLevel === 'critical'
      );
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

  getNpmPackageInfo(packageName) {
    try {
      const output = execSync(
        `npm view ${packageName} version deprecated time.modified repository.url --json`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      );

      const info = JSON.parse(output);

      return {
        latestVersion: info.version || info,
        deprecated: info.deprecated,
        lastPublishDate: info['time.modified'],
        repositoryUrl: info['repository.url'],
      };
    } catch (error) {
      return null;
    }
  }

  calculateMaintenanceScore(lastPublishDate, repositoryUrl) {
    let score = 100;

    if (!lastPublishDate) {
      return 50;
    }

    const lastPublish = new Date(lastPublishDate);
    const now = new Date();
    const daysSincePublish = Math.floor(
      (now.getTime() - lastPublish.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePublish > 365 * 3) {
      score -= 60;
    } else if (daysSincePublish > 365 * 2) {
      score -= 40;
    } else if (daysSincePublish > 365) {
      score -= 20;
    } else if (daysSincePublish > 180) {
      score -= 10;
    }

    if (daysSincePublish < 30) {
      score = Math.min(100, score + 10);
    }

    if (!repositoryUrl) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  cleanVersion(version) {
    return version.replace(/^[\^~>=<]+/, '');
  }

  isVersionOutdated(current, latest) {
    const currentClean = this.cleanVersion(current);
    const latestClean = this.cleanVersion(latest);
    return currentClean !== latestClean;
  }
}

async function main() {
  console.log('🔍 Starting dependency audit...\n');

  const auditor = new DependencyAuditor();

  // Ensure docs directory exists
  try {
    mkdirSync(resolve(process.cwd(), 'docs'), { recursive: true });
  } catch (e) {
    // Directory already exists
  }

  // First audit production dependencies only
  console.log('📦 Analyzing production dependencies...');
  const prodReport = await auditor.auditProject('./package.json', {
    includeDevDependencies: false,
  });

  console.log(`✅ Analyzed ${prodReport.analyzedPackages.length} production packages\n`);

  const prodMarkdown = auditor.generateMarkdownReport(prodReport);
  const prodReportPath = resolve(
    process.cwd(),
    'docs/dependency-audit-production.md'
  );
  writeFileSync(prodReportPath, prodMarkdown);
  console.log(`📄 Production report saved to: ${prodReportPath}\n`);

  // Then audit all dependencies
  console.log('📦 Analyzing all dependencies (including dev)...');
  const fullReport = await auditor.auditProject('./package.json', {
    includeDevDependencies: true,
  });

  console.log(`✅ Analyzed ${fullReport.analyzedPackages.length} total packages\n`);

  const fullMarkdown = auditor.generateMarkdownReport(fullReport);
  const fullReportPath = resolve(process.cwd(), 'docs/dependency-audit-full.md');
  writeFileSync(fullReportPath, fullMarkdown);
  console.log(`📄 Full report saved to: ${fullReportPath}\n`);

  console.log('📊 Summary:');
  console.log(`   Total Dependencies: ${fullReport.totalDependencies}`);
  console.log(`   Production: ${fullReport.productionDependencies}`);
  console.log(`   Dev: ${fullReport.devDependencies}`);
  console.log('\n   Risk Distribution:');
  console.log(`   🔴 Critical: ${fullReport.riskDistribution.critical}`);
  console.log(`   🟠 High: ${fullReport.riskDistribution.high}`);
  console.log(`   🟡 Medium: ${fullReport.riskDistribution.medium}`);
  console.log(`   🟢 Low: ${fullReport.riskDistribution.low}`);

  if (fullReport.needsAttention.length > 0) {
    console.log('\n⚠️  Packages needing attention:');
    fullReport.needsAttention.forEach((pkg) => {
      console.log(`   - ${pkg.packageName} (${pkg.riskLevel}): ${pkg.riskReasons[0]}`);
    });
  } else {
    console.log('\n✅ All dependencies are healthy!');
  }

  console.log('\n✨ Audit complete!');
}

main().catch((error) => {
  console.error('❌ Error running audit:', error);
  process.exit(1);
});
