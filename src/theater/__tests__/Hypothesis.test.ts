/**
 * Hypothesis Tests
 */

import { Hypothesis } from '../laboratory/Hypothesis';
import { TestSubject } from '../laboratory/TestSubject';
import { VisualNeuron } from '../../ui/VisualNeuron';
// Test component
class TestComponent extends VisualNeuron<{ label: string; value: number }> {
  constructor() {
    super({
      id: 'test-component',
      type: 'cortical',
      threshold: 0.5,
      props: { label: 'Test', value: 0 },
      initialState: { count: 0, active: false },
    });
  }

  protected override executeProcessing<_TInput = unknown, TOutput = unknown>(): Promise<TOutput> {
    return Promise.resolve(undefined as TOutput);
  }

  protected override performRender() {
    const label = this.receptiveField.label ?? 'Test';
    const value = this.receptiveField.value ?? 0;

    return {
      type: 'render' as const,
      data: {
        vdom: {
          tag: 'div',
          props: { className: 'test' },
          children: [
            { tag: 'h1', children: [label] },
            { tag: 'span', props: { className: 'value' }, children: [String(value)] },
          ],
        },
        styles: {},
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}

describe('Hypothesis - Test Assertions', () => {
  let component: TestComponent;
  let subject: TestSubject;

  beforeEach(async () => {
    component = new TestComponent();
    subject = new TestSubject({ component, autoMount: true });
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  afterEach(async () => {
    await subject.cleanup();
  });

  describe('Basic Hypothesis', () => {
    it('should create hypothesis with name', () => {
      const hypothesis = new Hypothesis('test hypothesis');
      expect(hypothesis.getName()).toBe('test hypothesis');
    });

    it('should create hypothesis with assertion function', async () => {
      const hypothesis = new Hypothesis('test', (subj) => {
        expect(subj).toBeDefined();
      });

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(true);
    });

    it('should fail when no assertion function defined', async () => {
      const hypothesis = new Hypothesis('test');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No assertion function');
    });

    it('should set assertion function', async () => {
      const hypothesis = new Hypothesis('test');
      hypothesis.setAssertion(() => {
        throw new Error('Test error');
      });

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Test error');
    });
  });

  describe('toContainText', () => {
    it('should pass when text is contained', async () => {
      const hypothesis = Hypothesis.toContainText(subject, 'Test');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when text is not contained', async () => {
      const hypothesis = Hypothesis.toContainText(subject, 'NonExistent');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('NonExistent');
    });
  });

  describe('toHaveState', () => {
    it('should pass when state matches', async () => {
      subject.setState({ count: 5 });
      const hypothesis = Hypothesis.toHaveState(subject, 'count', 5);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when state does not match', async () => {
      subject.setState({ count: 5 });
      const hypothesis = Hypothesis.toHaveState(subject, 'count', 10);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('count');
    });

    it('should handle boolean state', async () => {
      subject.setState({ active: true });
      const hypothesis = Hypothesis.toHaveState(subject, 'active', true);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });
  });

  describe('toHaveProp', () => {
    it('should pass when prop matches', async () => {
      subject.setProps({ label: 'Custom' });
      const hypothesis = Hypothesis.toHaveProp(subject, 'label', 'Custom');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when prop does not match', async () => {
      subject.setProps({ value: 42 });
      const hypothesis = Hypothesis.toHaveProp(subject, 'value', 100);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('value');
    });
  });

  describe('toBeMounted', () => {
    it('should pass when component is mounted', async () => {
      const hypothesis = Hypothesis.toBeMounted(subject);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when component is not mounted', async () => {
      await subject.unmount();
      const hypothesis = Hypothesis.toBeMounted(subject);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('mounted');
    });
  });

  describe('toBeActive', () => {
    it('should pass when component is active', async () => {
      const hypothesis = Hypothesis.toBeActive(subject);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when component is not active', async () => {
      await subject.unmount();
      const hypothesis = Hypothesis.toBeActive(subject);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('active');
    });
  });

  describe('toHaveRendered', () => {
    it('should pass when render count matches', async () => {
      const currentCount = subject.getRenderCount();
      const hypothesis = Hypothesis.toHaveRendered(subject, currentCount);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when render count does not match', async () => {
      const wrongCount = subject.getRenderCount() + 10;
      const hypothesis = Hypothesis.toHaveRendered(subject, wrongCount);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('renders');
    });
  });

  describe('toMatchOutput', () => {
    it('should pass when output matches pattern', async () => {
      const hypothesis = Hypothesis.toMatchOutput(subject, /test/i);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when output does not match pattern', async () => {
      const hypothesis = Hypothesis.toMatchOutput(subject, /xyz123/);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
    });
  });

  describe('toHaveElement', () => {
    it('should pass when element exists', async () => {
      const hypothesis = Hypothesis.toHaveElement(subject, 'test');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when element does not exist', async () => {
      const hypothesis = Hypothesis.toHaveElement(subject, 'nonexistent-element');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
    });
  });

  describe('toHaveElementCount', () => {
    it('should pass when count matches', async () => {
      const spans = subject.findAll('span');
      const hypothesis = Hypothesis.toHaveElementCount(subject, 'span', spans.length);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when count does not match', async () => {
      const hypothesis = Hypothesis.toHaveElementCount(subject, 'span', 999);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
    });
  });

  describe('toHaveText', () => {
    it('should pass when text matches exactly', async () => {
      const text = subject.getText();
      const hypothesis = Hypothesis.toHaveText(subject, text);
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when text does not match', async () => {
      const hypothesis = Hypothesis.toHaveText(subject, 'Wrong Text');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
    });
  });

  describe('toIncludeText', () => {
    it('should pass when text includes substring', async () => {
      const hypothesis = Hypothesis.toIncludeText(subject, 'Test');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
    });

    it('should fail when text does not include substring', async () => {
      const hypothesis = Hypothesis.toIncludeText(subject, 'NonExistent');
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(false);
    });
  });

  describe('toSatisfy - Custom Assertion', () => {
    it('should pass when custom matcher returns true', async () => {
      const hypothesis = Hypothesis.toSatisfy(
        subject,
        'should have positive render count',
        (subj) => subj.getRenderCount(),
        (actual, expected) => actual > expected,
        0,
      );

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(true);
    });

    it('should fail when custom matcher returns false', async () => {
      const hypothesis = Hypothesis.toSatisfy(
        subject,
        'should have negative render count',
        (subj) => subj.getRenderCount(),
        (actual, expected) => actual < expected,
        0,
      );

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(false);
    });
  });

  describe('Hypothesis Modifiers', () => {
    it('should negate hypothesis with not()', async () => {
      const hypothesis = Hypothesis.toHaveState(subject, 'count', 999).not();
      const result = await hypothesis.validate(subject);

      expect(result.passed).toBe(true);
      expect(result.name).toContain('NOT');
    });

    it('should combine hypotheses with and()', async () => {
      subject.setState({ count: 5, active: true });

      const hypothesis = Hypothesis.toHaveState(subject, 'count', 5).and(
        Hypothesis.toHaveState(subject, 'active', true),
      );

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(true);
    });

    it('should fail combined hypotheses when one fails', async () => {
      subject.setState({ count: 5, active: false });

      const hypothesis = Hypothesis.toHaveState(subject, 'count', 5).and(
        Hypothesis.toHaveState(subject, 'active', true),
      );

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(false);
    });

    it('should combine hypotheses with or()', async () => {
      subject.setState({ count: 5 });

      const hypothesis = Hypothesis.toHaveState(subject, 'count', 5).or(
        Hypothesis.toHaveState(subject, 'count', 10),
      );

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(true);
    });

    it('should pass or() when second condition matches', async () => {
      subject.setState({ count: 10 });

      const hypothesis = Hypothesis.toHaveState(subject, 'count', 5).or(
        Hypothesis.toHaveState(subject, 'count', 10),
      );

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(true);
    });

    it('should fail or() when both conditions fail', async () => {
      subject.setState({ count: 15 });

      const hypothesis = Hypothesis.toHaveState(subject, 'count', 5).or(
        Hypothesis.toHaveState(subject, 'count', 10),
      );

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(false);
    });
  });

  describe('Async Hypotheses', () => {
    it('should support async assertion functions', async () => {
      const hypothesis = new Hypothesis('async test', async (subj) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(subj.isMounted()).toBe(true);
      });

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(true);
    });

    it('should handle async errors', async () => {
      const hypothesis = new Hypothesis('async error test', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      });

      const result = await hypothesis.validate(subject);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Async error');
    });
  });

  describe('Error Messages', () => {
    it('should include helpful error messages', async () => {
      const hypothesis = Hypothesis.toHaveState(subject, 'count', 999);
      const result = await hypothesis.validate(subject);

      expect(result.message).toBeDefined();
      expect(result.message).toContain('count');
      expect(result.message).toContain('999');
    });

    it('should include assertion type', async () => {
      const hypothesis = Hypothesis.toContainText(subject, 'Test');
      const result = await hypothesis.validate(subject);

      expect(result.assertionType).toBe('toContainText');
    });
  });
});
