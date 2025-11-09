/**
 * Hypothesis - Test Assertions
 *
 * A Hypothesis represents an assertion about component behavior.
 * It validates expectations about state, props, render output, or interactions.
 */

import type { TestSubject } from './TestSubject';

/**
 * Hypothesis result
 */
export interface HypothesisResult {
  /**
   * Hypothesis name
   */
  name: string;

  /**
   * Pass/fail status
   */
  passed: boolean;

  /**
   * Expected value
   */
  expected?: unknown;

  /**
   * Actual value
   */
  actual?: unknown;

  /**
   * Error message if failed
   */
  message?: string;

  /**
   * Assertion type
   */
  assertionType: string;
}

/**
 * Assertion function
 */
export type AssertionFn = (subject: TestSubject) => Promise<void> | void;

/**
 * Matcher function
 */
export type MatcherFn<T = unknown> = (actual: T, expected: T) => boolean;

/**
 * Hypothesis - Test assertion
 */
export class Hypothesis {
  private name: string;
  private assertionFn: AssertionFn | null = null;
  private assertionType: string = 'custom';

  constructor(name: string, assertionFn?: AssertionFn) {
    this.name = name;

    if (assertionFn !== undefined) {
      this.assertionFn = assertionFn;
    }
  }

  /**
   * Get hypothesis name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Set assertion function
   */
  public setAssertion(fn: AssertionFn): void {
    this.assertionFn = fn;
  }

  /**
   * Validate hypothesis
   */
  public async validate(subject: TestSubject): Promise<HypothesisResult> {
    if (this.assertionFn === null) {
      return {
        name: this.name,
        passed: false,
        message: 'No assertion function defined',
        assertionType: this.assertionType,
      };
    }

    try {
      await this.assertionFn(subject);

      return {
        name: this.name,
        passed: true,
        assertionType: this.assertionType,
      };
    } catch (error) {
      return {
        name: this.name,
        passed: false,
        message: error instanceof Error ? error.message : String(error),
        assertionType: this.assertionType,
      };
    }
  }

  /**
   * Assert that render output contains text
   */
  public static toContainText(_subject: TestSubject, expectedText: string): Hypothesis {
    const hypothesis = new Hypothesis(`should contain text: "${expectedText}"`);
    hypothesis.assertionType = 'toContainText';

    hypothesis.setAssertion((subj) => {
      const output = subj.getRenderOutput();

      if (!output.includes(expectedText)) {
        throw new Error(
          `Expected render output to contain "${expectedText}", but it did not.\nActual: ${output}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Assert that component has specific state
   */
  public static toHaveState(
    _subject: TestSubject,
    key: string,
    expectedValue: unknown,
  ): Hypothesis {
    const hypothesis = new Hypothesis(`should have state ${key} = ${String(expectedValue)}`);
    hypothesis.assertionType = 'toHaveState';

    hypothesis.setAssertion((subj) => {
      const state = subj.getState();
      const actualValue = state[key];

      if (actualValue !== expectedValue) {
        throw new Error(
          `Expected state.${key} to be ${String(expectedValue)}, but got ${String(actualValue)}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Assert that component has specific prop
   */
  public static toHaveProp(_subject: TestSubject, key: string, expectedValue: unknown): Hypothesis {
    const hypothesis = new Hypothesis(`should have prop ${key} = ${String(expectedValue)}`);
    hypothesis.assertionType = 'toHaveProp';

    hypothesis.setAssertion((subj) => {
      const props = subj.getProps();
      const actualValue = props[key as keyof typeof props];

      if (actualValue !== expectedValue) {
        throw new Error(
          `Expected prop.${key} to be ${String(expectedValue)}, but got ${String(actualValue)}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Assert that component is mounted
   */
  public static toBeMounted(_subject: TestSubject): Hypothesis {
    const hypothesis = new Hypothesis('should be mounted');
    hypothesis.assertionType = 'toBeMounted';

    hypothesis.setAssertion((subj) => {
      if (!subj.isMounted()) {
        throw new Error('Expected component to be mounted, but it is not');
      }
    });

    return hypothesis;
  }

  /**
   * Assert that component is active
   */
  public static toBeActive(_subject: TestSubject): Hypothesis {
    const hypothesis = new Hypothesis('should be active');
    hypothesis.assertionType = 'toBeActive';

    hypothesis.setAssertion((subj) => {
      if (!subj.isActive()) {
        throw new Error('Expected component to be active, but it is not');
      }
    });

    return hypothesis;
  }

  /**
   * Assert render count
   */
  public static toHaveRendered(_subject: TestSubject, count: number): Hypothesis {
    const hypothesis = new Hypothesis(`should have rendered ${count} time(s)`);
    hypothesis.assertionType = 'toHaveRendered';

    hypothesis.setAssertion((subj) => {
      const actualCount = subj.getRenderCount();

      if (actualCount !== count) {
        throw new Error(`Expected ${count} renders, but got ${actualCount}`);
      }
    });

    return hypothesis;
  }

  /**
   * Assert render output matches regex
   */
  public static toMatchOutput(_subject: TestSubject, pattern: RegExp): Hypothesis {
    const hypothesis = new Hypothesis(`should match output pattern: ${pattern.toString()}`);
    hypothesis.assertionType = 'toMatchOutput';

    hypothesis.setAssertion((subj) => {
      const output = subj.getRenderOutput();

      if (!pattern.test(output)) {
        throw new Error(
          `Expected render output to match ${pattern.toString()}, but it did not.\nActual: ${output}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Assert element exists in render output
   */
  public static toHaveElement(_subject: TestSubject, selector: string): Hypothesis {
    const hypothesis = new Hypothesis(`should have element: ${selector}`);
    hypothesis.assertionType = 'toHaveElement';

    hypothesis.setAssertion((subj) => {
      if (!subj.find(selector)) {
        throw new Error(
          `Expected to find element "${selector}", but it was not found.\nOutput: ${subj.getRenderOutput()}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Assert element count
   */
  public static toHaveElementCount(
    _subject: TestSubject,
    selector: string,
    expectedCount: number,
  ): Hypothesis {
    const hypothesis = new Hypothesis(
      `should have ${expectedCount} element(s) matching: ${selector}`,
    );
    hypothesis.assertionType = 'toHaveElementCount';

    hypothesis.setAssertion((subj) => {
      const elements = subj.findAll(selector);
      const actualCount = elements.length;

      if (actualCount !== expectedCount) {
        throw new Error(
          `Expected ${expectedCount} elements matching "${selector}", but found ${actualCount}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Assert text content
   */
  public static toHaveText(_subject: TestSubject, expectedText: string): Hypothesis {
    const hypothesis = new Hypothesis(`should have text: "${expectedText}"`);
    hypothesis.assertionType = 'toHaveText';

    hypothesis.setAssertion((subj) => {
      const text = subj.getText();

      if (text !== expectedText) {
        throw new Error(`Expected text to be "${expectedText}", but got "${text}"`);
      }
    });

    return hypothesis;
  }

  /**
   * Assert text contains substring
   */
  public static toIncludeText(_subject: TestSubject, substring: string): Hypothesis {
    const hypothesis = new Hypothesis(`should include text: "${substring}"`);
    hypothesis.assertionType = 'toIncludeText';

    hypothesis.setAssertion((subj) => {
      const text = subj.getText();

      if (!text.includes(substring)) {
        throw new Error(
          `Expected text to include "${substring}", but it did not.\nActual: ${text}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Custom assertion with matcher
   */
  public static toSatisfy<T = unknown>(
    _subject: TestSubject,
    description: string,
    getter: (subj: TestSubject) => T,
    matcher: MatcherFn<T>,
    expected: T,
  ): Hypothesis {
    const hypothesis = new Hypothesis(description);
    hypothesis.assertionType = 'toSatisfy';

    hypothesis.setAssertion((subj) => {
      const actual = getter(subj);

      if (!matcher(actual, expected)) {
        throw new Error(
          `Custom assertion failed.\nExpected: ${String(expected)}\nActual: ${String(actual)}`,
        );
      }
    });

    return hypothesis;
  }

  /**
   * Assert that async condition becomes true
   */

  public static async toEventually(
    _subject: TestSubject,
    description: string,
    condition: (subj: TestSubject) => boolean,
    timeout: number = 1000,
  ): Promise<Hypothesis> {
    const hypothesis = new Hypothesis(`should eventually ${description}`);
    hypothesis.assertionType = 'toEventually';

    hypothesis.setAssertion(async (subj) => {
      try {
        await subj.waitFor(() => condition(subj), { timeout });
      } catch {
        throw new Error(`Condition "${description}" did not become true within ${timeout}ms`);
      }
    });

    return hypothesis;
  }

  /**
   * Negate assertion
   */
  public not(): Hypothesis {
    const originalAssertion = this.assertionFn;

    if (originalAssertion === null) {
      throw new Error('Cannot negate hypothesis without assertion function');
    }

    const negatedHypothesis = new Hypothesis(`NOT ${this.name}`);
    negatedHypothesis.assertionType = `not_${this.assertionType}`;

    negatedHypothesis.setAssertion(async (subject) => {
      try {
        await originalAssertion(subject);
        // If original assertion passed, negation should fail
        throw new Error('Negated assertion failed: original assertion passed');
      } catch {
        // If original assertion failed, negation passes
        return;
      }
    });

    return negatedHypothesis;
  }

  /**
   * Combine hypotheses with AND logic
   */
  public and(other: Hypothesis): Hypothesis {
    const combinedHypothesis = new Hypothesis(`${this.name} AND ${other.getName()}`);
    combinedHypothesis.assertionType = 'and';

    const thisAssertion = this.assertionFn;
    const otherAssertion = other.assertionFn;

    if (thisAssertion === null || otherAssertion === null) {
      throw new Error('Cannot combine hypotheses without assertion functions');
    }

    combinedHypothesis.setAssertion(async (subject) => {
      await thisAssertion(subject);
      await otherAssertion(subject);
    });

    return combinedHypothesis;
  }

  /**
   * Combine hypotheses with OR logic
   */
  public or(other: Hypothesis): Hypothesis {
    const combinedHypothesis = new Hypothesis(`${this.name} OR ${other.getName()}`);
    combinedHypothesis.assertionType = 'or';

    const thisAssertion = this.assertionFn;
    const otherAssertion = other.assertionFn;

    if (thisAssertion === null || otherAssertion === null) {
      throw new Error('Cannot combine hypotheses without assertion functions');
    }

    combinedHypothesis.setAssertion(async (subject) => {
      let firstError: Error | null = null;

      try {
        await thisAssertion(subject);
        return; // First assertion passed
      } catch (error) {
        firstError = error instanceof Error ? error : new Error(String(error));
      }

      try {
        await otherAssertion(subject);
        return; // Second assertion passed
      } catch {
        // Both failed, throw first error
        throw firstError;
      }
    });

    return combinedHypothesis;
  }
}
