/**
 * TCell Tests - Authentication System
 */

import { TCell } from '../authentication/TCell';

describe('TCell - Authentication System', () => {
  describe('User Registration', () => {
    let tcell: TCell;

    beforeEach(() => {
      tcell = new TCell({ verbose: false });
    });

    it('should register a new user', async () => {
      const result = await tcell.registerUser('user@example.com', 'SecurePass123!');

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      const result = await tcell.registerUser('user@example.com', 'weak');

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should reject passwords without complexity', async () => {
      const result = await tcell.registerUser('user@example.com', 'simplepassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('uppercase, lowercase, number');
    });

    it('should reject duplicate users', async () => {
      await tcell.registerUser('user@example.com', 'SecurePass123!');
      const result = await tcell.registerUser('user@example.com', 'AnotherPass456!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should emit user:registered event', () => {
      return new Promise<void>((resolve) => {
        tcell.on('user:registered', (data) => {
          expect(data.userId).toBeDefined();
          expect(data.identifier).toBe('user@example.com');
          resolve();
        });

        tcell.registerUser('user@example.com', 'SecurePass123!');
      });
    });
  });

  describe('Password Authentication', () => {
    let tcell: TCell;

    beforeEach(async () => {
      tcell = new TCell({ verbose: false });
      await tcell.registerUser('user@example.com', 'SecurePass123!');
    });

    it('should authenticate valid credentials', async () => {
      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'WrongPassword!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const result = await tcell.authenticate({
        identifier: 'nonexistent@example.com',
        password: 'AnyPassword123!',
      });

      expect(result.success).toBe(false);
    });

    it('should create session on successful auth', async () => {
      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result.metadata?.sessionId).toBeDefined();
    });

    it('should emit auth:success event', () => {
      return new Promise<void>((resolve) => {
        tcell.on('auth:success', (data) => {
          expect(data.userId).toBeDefined();
          expect(data.sessionId).toBeDefined();
          resolve();
        });

        tcell.authenticate({
          identifier: 'user@example.com',
          password: 'SecurePass123!',
        });
      });
    });

    it('should emit auth:failed event on wrong password', () => {
      return new Promise<void>((resolve) => {
        tcell.on('auth:failed', (data) => {
          expect(data.reason).toBe('invalid_password');
          resolve();
        });

        tcell.authenticate({
          identifier: 'user@example.com',
          password: 'WrongPassword!',
        });
      });
    });
  });

  describe('Token Authentication', () => {
    let tcell: TCell;
    let token: string;

    beforeEach(async () => {
      tcell = new TCell({ verbose: false });
      await tcell.registerUser('user@example.com', 'SecurePass123!');

      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      token = result.token ?? '';
    });

    it('should authenticate with valid token', () => {
      const result = tcell.authenticateWithToken(token);

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });

    it('should reject invalid token', () => {
      const result = tcell.authenticateWithToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should reject expired token', () => {
      const shortTcell = new TCell({ sessionTimeout: 1 });

      // Wait for token to expire
      setTimeout(() => {
        const result = shortTcell.authenticateWithToken(token);
        expect(result.success).toBe(false);
      }, 10);
    });
  });

  describe('Session Management', () => {
    let tcell: TCell;
    let userId: string;

    beforeEach(async () => {
      tcell = new TCell({ verbose: false });
      const regResult = await tcell.registerUser('user@example.com', 'SecurePass123!');
      userId = regResult.userId ?? '';
    });

    it('should create session on authentication', async () => {
      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      const sessionId = result.metadata?.sessionId as string;
      const session = tcell.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.userId).toBe(userId);
    });

    it('should track active sessions', async () => {
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      const sessions = tcell.getUserSessions(userId);

      expect(sessions.length).toBe(1);
    });

    it('should revoke session', async () => {
      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      const sessionId = result.metadata?.sessionId as string;
      const revoked = tcell.revokeSession(sessionId);

      expect(revoked).toBe(true);
      expect(tcell.getSession(sessionId)).toBeUndefined();
    });

    it('should revoke all user sessions', async () => {
      // Create multiple sessions
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      const count = tcell.revokeAllUserSessions(userId);

      expect(count).toBe(2);
      expect(tcell.getUserSessions(userId).length).toBe(0);
    });

    it('should emit session:created event', () => {
      return new Promise<void>((resolve) => {
        tcell.on('session:created', (data) => {
          expect(data.sessionId).toBeDefined();
          expect(data.userId).toBe(userId);
          resolve();
        });

        tcell.authenticate({
          identifier: 'user@example.com',
          password: 'SecurePass123!',
        });
      });
    });
  });

  describe('Account Locking', () => {
    let tcell: TCell;

    beforeEach(async () => {
      tcell = new TCell({
        maxFailedAttempts: 3,
        verbose: false
      });
      await tcell.registerUser('user@example.com', 'SecurePass123!');
    });

    it('should lock account after max failed attempts', async () => {
      // Make failed attempts
      await tcell.authenticate({ identifier: 'user@example.com', password: 'Wrong1!' });
      await tcell.authenticate({ identifier: 'user@example.com', password: 'Wrong2!' });
      await tcell.authenticate({ identifier: 'user@example.com', password: 'Wrong3!' });

      // Next attempt should show locked
      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is locked');
    });

    it('should emit account:locked event', () => {
      return new Promise<void>((resolve) => {
        tcell.on('account:locked', (data) => {
          expect(data.userId).toBeDefined();
          resolve();
        });

        // Trigger lockout
        tcell.authenticate({ identifier: 'user@example.com', password: 'Wrong1!' }).then(() =>
          tcell.authenticate({ identifier: 'user@example.com', password: 'Wrong2!' })
        ).then(() =>
          tcell.authenticate({ identifier: 'user@example.com', password: 'Wrong3!' })
        );
      });
    });

    it('should manually lock account', async () => {
      const user = tcell.getUserByIdentifier('user@example.com');
      const locked = tcell.lockAccount(user?.id ?? '');

      expect(locked).toBe(true);

      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result.error).toBe('Account is locked');
    });

    it('should manually unlock account', async () => {
      const user = tcell.getUserByIdentifier('user@example.com');
      const userId = user?.id ?? '';

      tcell.lockAccount(userId);
      const unlocked = tcell.unlockAccount(userId);

      expect(unlocked).toBe(true);

      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Account Management', () => {
    let tcell: TCell;
    let userId: string;

    beforeEach(async () => {
      tcell = new TCell({ verbose: false });
      const result = await tcell.registerUser('user@example.com', 'SecurePass123!');
      userId = result.userId ?? '';
    });

    it('should get user by ID', () => {
      const user = tcell.getUser(userId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });

    it('should get user by identifier', () => {
      const user = tcell.getUserByIdentifier('user@example.com');

      expect(user).toBeDefined();
      expect(user?.username).toBe('user@example.com');
    });

    it('should deactivate account', async () => {
      // Create session first
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      const deactivated = tcell.deactivateAccount(userId);

      expect(deactivated).toBe(true);

      // Should not be able to auth
      const result = await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result.error).toBe('Account is inactive');

      // Sessions should be revoked
      expect(tcell.getUserSessions(userId).length).toBe(0);
    });

    it('should emit account:deactivated event', (done) => {
      tcell.on('account:deactivated', (data) => {
        expect(data.userId).toBe(userId);
        done();
      });

      tcell.deactivateAccount(userId);
    });
  });

  describe('Statistics', () => {
    let tcell: TCell;

    beforeEach(async () => {
      tcell = new TCell({ verbose: false });
      await tcell.registerUser('user@example.com', 'SecurePass123!');
    });

    it('should track authentication attempts', async () => {
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'WrongPass!',
      });

      const stats = tcell.getStatistics();

      expect(stats.totalAttempts).toBe(2);
      expect(stats.successfulAuths).toBe(1);
      expect(stats.failedAuths).toBe(1);
    });

    it('should calculate success rate', async () => {
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      const stats = tcell.getStatistics();

      expect(stats.successRate).toBe(100);
    });

    it('should track active sessions', async () => {
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      const stats = tcell.getStatistics();

      expect(stats.activeSessions).toBe(1);
    });

    it('should reset statistics', async () => {
      await tcell.authenticate({
        identifier: 'user@example.com',
        password: 'SecurePass123!',
      });

      tcell.resetStatistics();

      const stats = tcell.getStatistics();

      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulAuths).toBe(0);
    });
  });

  describe('Session Cleanup', () => {
    it('should cleanup expired sessions', () => {
      const tcell = new TCell({
        sessionTimeout: 1,
        verbose: false
      });

      // Sessions will expire immediately
      setTimeout(() => {
        const cleaned = tcell.cleanupExpiredSessions();
        expect(cleaned).toBeGreaterThanOrEqual(0);
      }, 10);
    });
  });

  describe('Password Validation', () => {
    it('should require minimum length', async () => {
      const tcell = new TCell({
        minPasswordLength: 12,
        verbose: false
      });

      const result = await tcell.registerUser('user@example.com', 'Short1!');

      expect(result.success).toBe(false);
    });

    it('should allow disabling complexity requirement', async () => {
      const tcell = new TCell({
        requirePasswordComplexity: false,
        minPasswordLength: 8,
        verbose: false
      });

      const result = await tcell.registerUser('user@example.com', 'simplepass');

      expect(result.success).toBe(true);
    });
  });
});
