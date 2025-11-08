#!/usr/bin/env node
import { DependencyAuditor } from './dependency-auditor';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  console.log('🔍 Starting dependency audit...\n');

  const auditor = new DependencyAuditor();

  // First audit production dependencies only
  console.log('📦 Analyzing production dependencies...');
  const prodReport = await auditor.auditProject('./package.json', {
    includeDevDependencies: false,
  });

  console.log(`✅ Analyzed ${prodReport.analyzedPackages.length} production packages\n`);

  // Generate markdown report for production dependencies
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

  // Generate markdown report for all dependencies
  const fullMarkdown = auditor.generateMarkdownReport(fullReport);
  const fullReportPath = resolve(process.cwd(), 'docs/dependency-audit-full.md');
  writeFileSync(fullReportPath, fullMarkdown);
  console.log(`📄 Full report saved to: ${fullReportPath}\n`);

  // Print summary
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
