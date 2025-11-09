/**
 * Protocol Tests
 */

import { Protocol } from '../atlas/Protocol';
import type { ProtocolGuideline, ProtocolExample, ComponentProtocol } from '../atlas/Protocol';

describe('Protocol - Usage Guidelines and Best Practices', () => {
  let protocol: Protocol;

  const createMockExample = (good: boolean): ProtocolExample => ({
    title: good ? 'Good Example' : 'Bad Example',
    description: 'Example description',
    code: '<button>Click me</button>',
    language: 'html',
    good,
    explanation: 'Example explanation',
  });

  const createMockGuideline = (id: string): ProtocolGuideline => ({
    id,
    title: `Guideline ${id}`,
    description: 'Guideline description',
    type: 'usage',
    severity: 'recommended',
    explanation: 'Detailed explanation',
    examples: [],
    related: [],
    tags: [],
    references: [],
    timestamp: Date.now(),
  });

  beforeEach(() => {
    protocol = new Protocol({ name: 'Test Protocol' });
  });

  describe('Construction', () => {
    it('should create protocol with default config', () => {
      const defaultProtocol = new Protocol();
      expect(defaultProtocol).toBeInstanceOf(Protocol);
    });

    it('should create protocol with custom config', () => {
      const customProtocol = new Protocol({
        name: 'Custom Protocol',
        enforceSeverity: true,
        includeExamples: true,
        autoGenerateChecklists: true,
      });
      expect(customProtocol).toBeInstanceOf(Protocol);
    });
  });

  describe('Guidelines', () => {
    it('should add guideline', () => {
      const guideline = createMockGuideline('test-1');
      protocol.addGuideline(guideline);

      expect(protocol.getGuideline('test-1')).toEqual(guideline);
    });

    it('should emit guideline:added event', (done) => {
      const guideline = createMockGuideline('test-1');

      protocol.on('guideline:added', (event: { id: string }) => {
        expect(event.id).toBe('test-1');
        done();
      });

      protocol.addGuideline(guideline);
    });

    it('should get all guidelines', () => {
      protocol.addGuideline(createMockGuideline('test-1'));
      protocol.addGuideline(createMockGuideline('test-2'));

      expect(protocol.getAllGuidelines()).toHaveLength(2);
    });

    it('should remove guideline', () => {
      const guideline = createMockGuideline('test-1');
      protocol.addGuideline(guideline);

      expect(protocol.removeGuideline('test-1')).toBe(true);
      expect(protocol.getGuideline('test-1')).toBeUndefined();
    });

    it('should emit guideline:removed event', (done) => {
      const guideline = createMockGuideline('test-1');
      protocol.addGuideline(guideline);

      protocol.on('guideline:removed', (event: { id: string }) => {
        expect(event.id).toBe('test-1');
        done();
      });

      protocol.removeGuideline('test-1');
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      protocol.addGuideline({
        ...createMockGuideline('usage-1'),
        type: 'usage',
        severity: 'critical',
        tags: ['button', 'form'],
      });

      protocol.addGuideline({
        ...createMockGuideline('accessibility-1'),
        type: 'accessibility',
        severity: 'important',
        tags: ['wcag', 'aria'],
      });

      protocol.addGuideline({
        ...createMockGuideline('performance-1'),
        type: 'performance',
        severity: 'recommended',
        tags: ['performance', 'optimization'],
      });
    });

    it('should search by type', () => {
      const results = protocol.search({ type: 'accessibility' });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('accessibility-1');
    });

    it('should search by severity', () => {
      const results = protocol.search({ severity: 'critical' });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('usage-1');
    });

    it('should search by tags', () => {
      const results = protocol.search({ tags: ['button'] });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('usage-1');
    });

    it('should search by text', () => {
      const results = protocol.search({ text: 'accessibility' });
      expect(results).toHaveLength(1);
      expect(results[0]!.type).toBe('accessibility');
    });

    it('should combine multiple filters', () => {
      const results = protocol.search({
        type: 'usage',
        severity: 'critical',
      });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('usage-1');
    });
  });

  describe('Get By Type and Severity', () => {
    beforeEach(() => {
      protocol.addGuideline({
        ...createMockGuideline('test-1'),
        type: 'accessibility',
        severity: 'critical',
      });

      protocol.addGuideline({
        ...createMockGuideline('test-2'),
        type: 'accessibility',
        severity: 'important',
      });
    });

    it('should get guidelines by type', () => {
      const results = protocol.getByType('accessibility');
      expect(results).toHaveLength(2);
    });

    it('should get guidelines by severity', () => {
      const results = protocol.getBySeverity('critical');
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('test-1');
    });
  });

  describe('Component Protocol', () => {
    it('should set component protocol', () => {
      const componentProtocol: ComponentProtocol = {
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [
          {
            ...createMockGuideline('a11y-1'),
            type: 'accessibility',
            severity: 'critical',
          },
        ],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      };

      protocol.setComponentProtocol(componentProtocol);

      expect(protocol.getComponentProtocol('button')).toEqual(componentProtocol);
    });

    it('should emit component:protocol-set event', (done) => {
      const componentProtocol: ComponentProtocol = {
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      };

      protocol.on('component:protocol-set', (event: { componentId: string }) => {
        expect(event.componentId).toBe('button');
        done();
      });

      protocol.setComponentProtocol(componentProtocol);
    });

    it('should auto-generate checklist', () => {
      const componentProtocol: ComponentProtocol = {
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [
          {
            ...createMockGuideline('a11y-1'),
            type: 'accessibility',
            severity: 'critical',
          },
        ],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      };

      protocol.setComponentProtocol(componentProtocol);

      const checklist = protocol.getChecklist('button');
      expect(checklist.length).toBeGreaterThan(0);
    });
  });

  describe('Checklist Generation', () => {
    it('should generate checklist from guidelines', () => {
      const componentProtocol: ComponentProtocol = {
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [
          {
            ...createMockGuideline('a11y-1'),
            title: 'Keyboard Accessible',
            type: 'accessibility',
            severity: 'critical',
          },
        ],
        performance: [
          {
            ...createMockGuideline('perf-1'),
            title: 'Optimize Rendering',
            type: 'performance',
            severity: 'recommended',
          },
        ],
        security: [],
        testing: [
          {
            ...createMockGuideline('test-1'),
            title: 'Unit Tests',
            type: 'testing',
            severity: 'important',
          },
        ],
        checklist: [],
      };

      protocol.setComponentProtocol(componentProtocol);
      const checklist = protocol.generateChecklist('button');

      expect(checklist.length).toBeGreaterThan(0);

      // Should have accessibility item
      const a11yItem = checklist.find((item) => item.category === 'Accessibility');
      expect(a11yItem).toBeDefined();
      expect(a11yItem!.required).toBe(true);

      // Should have performance item
      const perfItem = checklist.find((item) => item.category === 'Performance');
      expect(perfItem).toBeDefined();

      // Should have testing item
      const testItem = checklist.find((item) => item.category === 'Testing');
      expect(testItem).toBeDefined();
    });

    it('should mark critical items as required', () => {
      const componentProtocol: ComponentProtocol = {
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [
          {
            ...createMockGuideline('a11y-1'),
            type: 'accessibility',
            severity: 'critical',
          },
        ],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      };

      protocol.setComponentProtocol(componentProtocol);
      const checklist = protocol.getChecklist('button');

      const criticalItem = checklist.find((item) => item.guidelineId === 'a11y-1');
      expect(criticalItem!.required).toBe(true);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      const componentProtocol: ComponentProtocol = {
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [
          {
            ...createMockGuideline('a11y-1'),
            type: 'accessibility',
            severity: 'critical',
          },
          {
            ...createMockGuideline('a11y-2'),
            type: 'accessibility',
            severity: 'recommended',
          },
        ],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      };

      protocol.setComponentProtocol(componentProtocol);
    });

    it('should validate completed items', () => {
      const checklist = protocol.getChecklist('button');
      const requiredItem = checklist.find((item) => item.required);

      const result = protocol.validate('button', [requiredItem!.id]);

      expect(result.passed).toBe(true);
      expect(result.missingRequired).toHaveLength(0);
    });

    it('should fail validation when missing required items', () => {
      const result = protocol.validate('button', []);

      expect(result.passed).toBe(false);
      expect(result.missingRequired.length).toBeGreaterThan(0);
    });

    it('should calculate validation score', () => {
      const checklist = protocol.getChecklist('button');
      const halfCompleted = checklist
        .slice(0, Math.floor(checklist.length / 2))
        .map((item) => item.id);

      const result = protocol.validate('button', halfCompleted);

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    it('should create usage pattern', () => {
      const guideline = protocol.createUsagePattern(
        'usage-1',
        'Button Usage',
        'How to use buttons',
        [createMockExample(true)],
        {
          severity: 'recommended',
          tags: ['button', 'usage'],
        },
      );

      expect(guideline.type).toBe('usage');
      expect(protocol.getGuideline('usage-1')).toBeDefined();
    });

    it('should create accessibility guideline', () => {
      const guideline = protocol.createAccessibilityGuideline(
        'a11y-1',
        'Keyboard Navigation',
        'Support keyboard navigation',
        '2.1',
        '2.1.1',
        {
          severity: 'critical',
        },
      );

      expect(guideline.type).toBe('accessibility');
      expect(guideline.references.length).toBeGreaterThan(0);
      expect(protocol.getGuideline('a11y-1')).toBeDefined();
    });

    it('should create performance guideline', () => {
      const guideline = protocol.createPerformanceGuideline(
        'perf-1',
        'Optimize Render',
        'Minimize re-renders',
        'high',
        {
          tags: ['performance', 'rendering'],
        },
      );

      expect(guideline.type).toBe('performance');
      expect(guideline.severity).toBe('critical');
      expect(protocol.getGuideline('perf-1')).toBeDefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      protocol.addGuideline({
        ...createMockGuideline('test-1'),
        type: 'accessibility',
        severity: 'critical',
        examples: [createMockExample(true), createMockExample(false)],
      });

      protocol.addGuideline({
        ...createMockGuideline('test-2'),
        type: 'performance',
        severity: 'important',
        examples: [createMockExample(true)],
      });

      protocol.setComponentProtocol({
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      });
    });

    it('should calculate statistics', () => {
      const stats = protocol.getStatistics();

      expect(stats.totalGuidelines).toBe(2);
      expect(stats.byType.accessibility).toBe(1);
      expect(stats.byType.performance).toBe(1);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.important).toBe(1);
      expect(stats.totalExamples).toBe(3);
      expect(stats.componentsWithProtocols).toBe(1);
    });
  });

  describe('Import/Export', () => {
    it('should export protocols as JSON', () => {
      protocol.addGuideline(createMockGuideline('test-1'));

      protocol.setComponentProtocol({
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      });

      const exported = protocol.export();
      const parsed = JSON.parse(exported);

      expect(parsed.name).toBe('Test Protocol');
      expect(parsed.guidelines).toHaveLength(1);
      expect(parsed.componentProtocols).toHaveLength(1);
    });

    it('should import protocols from JSON', () => {
      const guideline = createMockGuideline('test-1');
      const componentProtocol: ComponentProtocol = {
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      };

      const json = JSON.stringify({
        guidelines: [guideline],
        componentProtocols: [componentProtocol],
        checklists: { button: [] },
      });

      protocol.import(json);

      expect(protocol.getGuideline('test-1')).toBeDefined();
      expect(protocol.getComponentProtocol('button')).toBeDefined();
    });

    it('should emit imported event', (done) => {
      const json = JSON.stringify({
        guidelines: [createMockGuideline('test-1')],
        componentProtocols: [],
        checklists: {},
      });

      protocol.on('imported', (event: { guidelines: number; protocols: number }) => {
        expect(event.guidelines).toBe(1);
        expect(event.protocols).toBe(0);
        done();
      });

      protocol.import(json);
    });
  });

  describe('Clear', () => {
    beforeEach(() => {
      protocol.addGuideline(createMockGuideline('test-1'));
      protocol.setComponentProtocol({
        componentId: 'button',
        componentName: 'Button',
        usagePatterns: [],
        bestPractices: [],
        accessibility: [],
        performance: [],
        security: [],
        testing: [],
        checklist: [],
      });
    });

    it('should clear all data', () => {
      protocol.clear();

      expect(protocol.getAllGuidelines()).toHaveLength(0);
      expect(protocol.getComponentProtocol('button')).toBeUndefined();
    });

    it('should emit cleared event', (done) => {
      protocol.on('cleared', () => {
        done();
      });

      protocol.clear();
    });
  });
});
