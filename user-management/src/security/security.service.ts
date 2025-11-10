import { Macrophage, TCell } from '../../../src/index';
import type { Session } from '../../../src/index';

/**
 * Security Service - Input sanitization and authentication
 */
export class SecurityService {
  private sanitizer: Macrophage;
  private authenticator: TCell;

  constructor() {
    this.sanitizer = new Macrophage({
      aggressive: true,
    });

    this.authenticator = new TCell({
      jwtSecret: process.env['JWT_SECRET'] || 'your-secret-key',
    });
  }

  /**
   * Sanitize user input
   */
  public sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const sanitizedInput: Record<string, unknown> = {};
    for (const key in input) {
      if (typeof input[key] === 'string') {
        const result = this.sanitizer.sanitizeHTML(input[key] as string);
        sanitizedInput[key] = result.value;
      } else {
        sanitizedInput[key] = input[key];
      }
    }
    return sanitizedInput;
  }

  /**
   * Create authentication token
   */
  public async createToken(userId: string, email: string): Promise<string> {
    const result = await this.authenticator.authenticate({
      identifier: email,
      password: '', // Password is not used for token creation
    }, { userId });

    if (!result.success || !result.token) {
      throw new Error('Failed to create authentication token');
    }

    return result.token;
  }

  /**
   * Verify authentication token
   */
  public async verifyToken(token: string): Promise<Session> {
    const result = this.authenticator.authenticateWithToken(token);

    if (!result.success || !result.metadata?.['sessionId']) {
      throw new Error('Invalid or expired token');
    }

    const session = this.authenticator.getSession(result.metadata['sessionId'] as string);
    if (!session) {
      throw new Error('Invalid or expired token');
    }

    return session;
  }
}
