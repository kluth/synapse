import { DependencyAuditor } from '../dependency-auditor';

describe('DependencyAuditor', () => {
  describe('analyzeDependency', () => {
    it('should identify a healthy, well-maintained package', async () => {
      const auditor = new DependencyAuditor();
      const result = await auditor.analyzeDependency('zod', '4.1.12');

      expect(result.packageName).toBe('zod');
      expect(result.currentVersion).toBe('4.1.12');
      expect(result.isHealthy).toBe(true);
      expect(result.riskLevel).toBe('low');
    });

    it('should detect an outdated package version', async () => {
      const auditor = new DependencyAuditor();
      const result = await auditor.analyzeDependency('zod', '3.0.0');

      expect(result.packageName).toBe('zod');
      expect(result.currentVersion).toBe('3.0.0');
      expect(result.isOutdated).toBe(true);
      expect(result.latestVersion).toBeDefined();
    });

    it('should calculate maintenance score based on last publish date', async () => {
      const auditor = new DependencyAuditor();
      const result = await auditor.analyzeDependency('commander', '14.0.2');

      expect(result.maintenanceScore).toBeGreaterThan(0);
      expect(result.maintenanceScore).toBeLessThanOrEqual(100);
      expect(result.lastPublishDate).toBeDefined();
    });

    it('should identify deprecated packages', async () => {
      const auditor = new DependencyAuditor();
      // Test with a hypothetical deprecated package
      const result = await auditor.analyzeDependency('request', '2.88.0');

      expect(result.isDeprecated).toBe(true);
      expect(result.riskLevel).toBe('critical');
    });
  });

  describe('auditProject', () => {
    it('should analyze all production dependencies', async () => {
      const auditor = new DependencyAuditor();
      const report = await auditor.auditProject('./package.json', {
        includeDevDependencies: false,
      });

      expect(report.totalDependencies).toBeGreaterThan(0);
      expect(report.productionDependencies).toBeDefined();
      expect(report.analyzedPackages).toBeInstanceOf(Array);
    });

    it('should include dev dependencies when requested', async () => {
      const auditor = new DependencyAuditor();
      const report = await auditor.auditProject('./package.json', {
        includeDevDependencies: true,
      });

      expect(report.totalDependencies).toBeGreaterThan(0);
      expect(report.devDependencies).toBeDefined();
    });

    it('should calculate risk distribution', async () => {
      const auditor = new DependencyAuditor();
      const report = await auditor.auditProject('./package.json');

      expect(report.riskDistribution).toBeDefined();
      expect(report.riskDistribution.critical).toBeGreaterThanOrEqual(0);
      expect(report.riskDistribution.high).toBeGreaterThanOrEqual(0);
      expect(report.riskDistribution.medium).toBeGreaterThanOrEqual(0);
      expect(report.riskDistribution.low).toBeGreaterThanOrEqual(0);
    });

    it('should identify packages that need attention', async () => {
      const auditor = new DependencyAuditor();
      const report = await auditor.auditProject('./package.json');

      expect(report.needsAttention).toBeInstanceOf(Array);
      // Packages with risk level > low should be in needsAttention
      const highRiskPackages = report.analyzedPackages.filter(
        (pkg) => pkg.riskLevel === 'critical' || pkg.riskLevel === 'high',
      );
      expect(report.needsAttention.length).toBeGreaterThanOrEqual(highRiskPackages.length);
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate a valid markdown report', async () => {
      const auditor = new DependencyAuditor();
      const report = await auditor.auditProject('./package.json');
      const markdown = auditor.generateMarkdownReport(report);

      expect(markdown).toContain('# Dependency Audit Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Risk Distribution');
      expect(markdown).toContain('## Analyzed Packages');
    });

    it('should include package details in markdown', async () => {
      const auditor = new DependencyAuditor();
      const report = await auditor.auditProject('./package.json');
      const markdown = auditor.generateMarkdownReport(report);

      // Should include package names
      expect(markdown).toContain('zod');
      expect(markdown).toContain('commander');
    });

    it('should highlight packages needing attention', async () => {
      const auditor = new DependencyAuditor();
      const report = await auditor.auditProject('./package.json');
      const markdown = auditor.generateMarkdownReport(report);

      if (report.needsAttention.length > 0) {
        expect(markdown).toContain('## Packages Needing Attention');
      }
    });
  });

  describe('risk assessment', () => {
    it('should assign critical risk to deprecated packages', async () => {
      const auditor = new DependencyAuditor();
      const result = await auditor.analyzeDependency('request', '2.88.0');

      expect(result.riskLevel).toBe('critical');
    });

    it('should assign high risk to unmaintained packages', async () => {
      const auditor = new DependencyAuditor();
      // A package with very low maintenance score should be high risk
      const result = await auditor.analyzeDependency('left-pad', '1.3.0');

      if (result.maintenanceScore < 30) {
        expect(['high', 'medium']).toContain(result.riskLevel);
      }
    });

    it('should assign low risk to well-maintained, up-to-date packages', async () => {
      const auditor = new DependencyAuditor();
      const result = await auditor.analyzeDependency('zod', '4.1.12');

      expect(result.riskLevel).toBe('low');
    });
  });
});
