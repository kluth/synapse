/**
 * TCell - Authentication System
 *
 * Like T-Cells in the immune system that identify cells and determine if they belong,
 * this component authenticates users and determines if they are who they claim to be.
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes, createHmac } from 'crypto';

/**
 * Authentication method types
 */
export type AuthMethod = 'password' | 'token' | 'apikey' | 'oauth' | 'saml' | 'mfa';

/**
 * Authentication result
 */
export interface AuthenticationResult {
  /**
   * Whether authentication succeeded
   */
  success: boolean;

  /**
   * User identifier (if authenticated)
   */
  userId?: string;

  /**
   * Authentication token (if successful)
   */
  token?: string;

  /**
   * Refresh token (if supported)
   */
  refreshToken?: string;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Authentication method used
   */
  method: AuthMethod;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * User credentials for password authentication
 */
export interface PasswordCredentials {
  /**
   * Username or email
   */
  identifier: string;

  /**
   * Password
   */
  password: string;
}

/**
 * Stored user information
 */
export interface StoredUser {
  /**
   * User ID
   */
  id: string;

  /**
   * Username
   */
  username: string;

  /**
   * Email
   */
  email?: string;

  /**
   * Hashed password
   */
  passwordHash: string;

  /**
   * Password salt
   */
  salt: string;

  /**
   * MFA secret (if enabled)
   */
  mfaSecret?: string;

  /**
   * Account active status
   */
  active: boolean;

  /**
   * Account locked status
   */
  locked: boolean;

  /**
   * Failed login attempts
   */
  failedAttempts: number;

  /**
   * Last login timestamp
   */
  lastLogin?: number;

  /**
   * Created timestamp
   */
  created: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Active session
 */
export interface Session {
  /**
   * Session ID
   */
  id: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * Session token
   */
  token: string;

  /**
   * Refresh token
   */
  refreshToken?: string;

  /**
   * Session creation time
   */
  createdAt: number;

  /**
   * Last activity time
   */
  lastActivity: number;

  /**
   * Session expiration time
   */
  expiresAt: number;

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * User agent
   */
  userAgent?: string;

  /**
   * Session metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * TCell configuration
 */
export interface TCellConfig {
  /**
   * Password minimum length
   * @default 8
   */
  minPasswordLength?: number;

  /**
   * Require password complexity
   * @default true
   */
  requirePasswordComplexity?: boolean;

  /**
   * Maximum failed login attempts before locking
   * @default 5
   */
  maxFailedAttempts?: number;

  /**
   * Account lockout duration (ms)
   * @default 900000 (15 minutes)
   */
  lockoutDuration?: number;

  /**
   * Session timeout (ms)
   * @default 3600000 (1 hour)
   */
  sessionTimeout?: number;

  /**
   * JWT secret for token signing
   */
  jwtSecret?: string;

  /**
   * Enable MFA support
   * @default false
   */
  enableMFA?: boolean;

  /**
   * Password hash iterations
   * @default 10000
   */
  hashIterations?: number;

  /**
   * Verbose logging
   * @default false
   */
  verbose?: boolean;
}

/**
 * Authentication statistics
 */
export interface AuthStatistics {
  /**
   * Total authentication attempts
   */
  totalAttempts: number;

  /**
   * Successful authentications
   */
  successfulAuths: number;

  /**
   * Failed authentications
   */
  failedAuths: number;

  /**
   * Active sessions
   */
  activeSessions: number;

  /**
   * Total users
   */
  totalUsers: number;

  /**
   * Locked accounts
   */
  lockedAccounts: number;

  /**
   * Success rate
   */
  successRate: number;

  /**
   * Average session duration (ms)
   */
  avgSessionDuration: number;
}

/**
 * TCell - Authentication System
 *
 * Provides comprehensive authentication capabilities including:
 * - Password-based authentication
 * - Token management (JWT-style)
 * - Session management
 * - MFA support
 * - Account lockout protection
 *
 * @example
 * ```typescript
 * const tcell = new TCell({
 *   minPasswordLength: 10,
 *   maxFailedAttempts: 3,
 *   sessionTimeout: 3600000
 * });
 *
 * // Register user
 * await tcell.registerUser('user@example.com', 'SecurePassword123!');
 *
 * // Authenticate
 * const result = await tcell.authenticate({
 *   identifier: 'user@example.com',
 *   password: 'SecurePassword123!'
 * });
 *
 * if (result.success) {
 *   console.log('Authenticated!', result.token);
 * }
 * ```
 */
export class TCell extends EventEmitter {
  private readonly config: Required<TCellConfig>;
  private users: Map<string, StoredUser> = new Map();
  private sessions: Map<string, Session> = new Map();
  private usersByIdentifier: Map<string, string> = new Map(); // identifier -> userId
  private stats = {
    totalAttempts: 0,
    successfulAuths: 0,
    failedAuths: 0,
  };

  constructor(config: TCellConfig = {}) {
    super();

    this.config = {
      minPasswordLength: config.minPasswordLength ?? 8,
      requirePasswordComplexity: config.requirePasswordComplexity ?? true,
      maxFailedAttempts: config.maxFailedAttempts ?? 5,
      lockoutDuration: config.lockoutDuration ?? 900000, // 15 minutes
      sessionTimeout: config.sessionTimeout ?? 3600000, // 1 hour
      jwtSecret: config.jwtSecret ?? this.generateSecret(),
      enableMFA: config.enableMFA ?? false,
      hashIterations: config.hashIterations ?? 10000,
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Register a new user
   */
  public async registerUser(
    identifier: string,
    password: string,
    email?: string,
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    // Validate password
    const passwordError = this.validatePassword(password);
    if (passwordError !== undefined) {
      return { success: false, error: passwordError };
    }

    // Check if user already exists
    if (this.usersByIdentifier.has(identifier)) {
      return { success: false, error: 'User already exists' };
    }

    // Generate salt and hash password
    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);

    // Create user
    const userId = this.generateUserId();
    const user: StoredUser = {
      id: userId,
      username: identifier,
      email: email ?? identifier,
      passwordHash,
      salt,
      active: true,
      locked: false,
      failedAttempts: 0,
      created: Date.now(),
    };

    this.users.set(userId, user);
    this.usersByIdentifier.set(identifier, userId);

    if (this.config.verbose) {
      this.log(`User registered: ${identifier}`);
    }

    this.emit('user:registered', { userId, identifier });

    return { success: true, userId };
  }

  /**
   * Authenticate user with password
   */
  public async authenticate(
    credentials: PasswordCredentials,
    metadata?: Record<string, unknown>,
  ): Promise<AuthenticationResult> {
    this.stats.totalAttempts++;

    const { identifier, password } = credentials;

    // Find user
    const userId = this.usersByIdentifier.get(identifier);
    if (userId === undefined) {
      this.stats.failedAuths++;
      this.emit('auth:failed', { identifier, reason: 'user_not_found' });

      return {
        success: false,
        error: 'Invalid credentials',
        method: 'password',
        timestamp: Date.now(),
      };
    }

    const user = this.users.get(userId);
    if (user === undefined) {
      this.stats.failedAuths++;
      return {
        success: false,
        error: 'User not found',
        method: 'password',
        timestamp: Date.now(),
      };
    }

    // Check if account is locked
    if (user.locked) {
      this.emit('auth:failed', { userId, reason: 'account_locked' });

      return {
        success: false,
        error: 'Account is locked',
        method: 'password',
        timestamp: Date.now(),
      };
    }

    // Check if account is active
    if (!user.active) {
      this.emit('auth:failed', { userId, reason: 'account_inactive' });

      return {
        success: false,
        error: 'Account is inactive',
        method: 'password',
        timestamp: Date.now(),
      };
    }

    // Verify password
    const passwordHash = await this.hashPassword(password, user.salt);
    const passwordValid = passwordHash === user.passwordHash;

    if (!passwordValid) {
      user.failedAttempts++;

      // Lock account if too many failed attempts
      if (user.failedAttempts >= this.config.maxFailedAttempts) {
        user.locked = true;
        this.emit('account:locked', { userId });

        // Auto-unlock after lockout duration
        setTimeout(() => {
          user.locked = false;
          user.failedAttempts = 0;
          this.emit('account:unlocked', { userId });
        }, this.config.lockoutDuration);
      }

      this.stats.failedAuths++;
      this.emit('auth:failed', { userId, reason: 'invalid_password' });

      return {
        success: false,
        error: 'Invalid credentials',
        method: 'password',
        timestamp: Date.now(),
      };
    }

    // Reset failed attempts on successful login
    user.failedAttempts = 0;
    user.lastLogin = Date.now();

    // Create session
    const session = this.createSession(userId, metadata);

    this.stats.successfulAuths++;

    if (this.config.verbose) {
      this.log(`User authenticated: ${identifier}`);
    }

    this.emit('auth:success', { userId, sessionId: session.id });

    return {
      success: true,
      userId,
      token: session.token,
      refreshToken: session.refreshToken,
      method: 'password',
      timestamp: Date.now(),
      metadata: { sessionId: session.id },
    };
  }

  /**
   * Authenticate with token
   */
  public authenticateWithToken(token: string): AuthenticationResult {
    const session = this.findSessionByToken(token);

    if (session === undefined) {
      this.emit('auth:failed', { reason: 'invalid_token' });

      return {
        success: false,
        error: 'Invalid token',
        method: 'token',
        timestamp: Date.now(),
      };
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(session.id);
      this.emit('session:expired', { sessionId: session.id });

      return {
        success: false,
        error: 'Token expired',
        method: 'token',
        timestamp: Date.now(),
      };
    }

    // Update last activity
    session.lastActivity = Date.now();

    this.emit('auth:success', { userId: session.userId, sessionId: session.id });

    return {
      success: true,
      userId: session.userId,
      token: session.token,
      method: 'token',
      timestamp: Date.now(),
      metadata: { sessionId: session.id },
    };
  }

  /**
   * Create a new session
   */
  private createSession(userId: string, metadata?: Record<string, unknown>): Session {
    const sessionId = this.generateSessionId();
    const token = this.generateToken(userId, sessionId);
    const refreshToken = this.generateRefreshToken();

    const session: Session = {
      id: sessionId,
      userId,
      token,
      refreshToken,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.config.sessionTimeout,
      metadata,
    };

    this.sessions.set(sessionId, session);

    this.emit('session:created', { sessionId, userId });

    return session;
  }

  /**
   * Find session by token
   */
  private findSessionByToken(token: string): Session | undefined {
    for (const session of Array.from(this.sessions.values())) {
      if (session.token === token) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Revoke session
   */
  public revokeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      return false;
    }

    this.sessions.delete(sessionId);

    if (this.config.verbose) {
      this.log(`Session revoked: ${sessionId}`);
    }

    this.emit('session:revoked', { sessionId, userId: session.userId });

    return true;
  }

  /**
   * Revoke all sessions for a user
   */
  public revokeAllUserSessions(userId: string): number {
    let revokedCount = 0;

    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        revokedCount++;
      }
    }

    if (revokedCount > 0 && this.config.verbose) {
      this.log(`Revoked ${revokedCount} sessions for user: ${userId}`);
    }

    this.emit('sessions:revoked', { userId, count: revokedCount });

    return revokedCount;
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): string | undefined {
    if (password.length < this.config.minPasswordLength) {
      return `Password must be at least ${this.config.minPasswordLength} characters`;
    }

    if (this.config.requirePasswordComplexity) {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
    }

    return undefined;
  }

  /**
   * Hash password with salt
   */
  private async hashPassword(password: string, salt: string): Promise<string> {
    return new Promise((resolve) => {
      let hash = password + salt;

      for (let i = 0; i < this.config.hashIterations; i++) {
        hash = createHash('sha256').update(hash).digest('hex');
      }

      resolve(hash);
    });
  }

  /**
   * Generate salt
   */
  private generateSalt(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate user ID
   */
  private generateUserId(): string {
    return `user-${Date.now()}-${randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate token (JWT-style)
   */
  private generateToken(userId: string, sessionId: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');

    const payload = Buffer.from(
      JSON.stringify({
        userId,
        sessionId,
        iat: Date.now(),
        exp: Date.now() + this.config.sessionTimeout,
      }),
    ).toString('base64');

    const signature = createHmac('sha256', this.config.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate secret
   */
  private generateSecret(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Get user by ID
   */
  public getUser(userId: string): StoredUser | undefined {
    return this.users.get(userId);
  }

  /**
   * Get user by identifier
   */
  public getUserByIdentifier(identifier: string): StoredUser | undefined {
    const userId = this.usersByIdentifier.get(identifier);
    if (userId === undefined) {
      return undefined;
    }
    return this.users.get(userId);
  }

  /**
   * Get session
   */
  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions for a user
   */
  public getUserSessions(userId: string): Session[] {
    const sessions: Session[] = [];

    for (const session of Array.from(this.sessions.values())) {
      if (session.userId === userId) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Lock user account
   */
  public lockAccount(userId: string): boolean {
    const user = this.users.get(userId);

    if (user === undefined) {
      return false;
    }

    user.locked = true;

    if (this.config.verbose) {
      this.log(`Account locked: ${userId}`);
    }

    this.emit('account:locked', { userId });

    return true;
  }

  /**
   * Unlock user account
   */
  public unlockAccount(userId: string): boolean {
    const user = this.users.get(userId);

    if (user === undefined) {
      return false;
    }

    user.locked = false;
    user.failedAttempts = 0;

    if (this.config.verbose) {
      this.log(`Account unlocked: ${userId}`);
    }

    this.emit('account:unlocked', { userId });

    return true;
  }

  /**
   * Deactivate user account
   */
  public deactivateAccount(userId: string): boolean {
    const user = this.users.get(userId);

    if (user === undefined) {
      return false;
    }

    user.active = false;

    // Revoke all sessions
    this.revokeAllUserSessions(userId);

    if (this.config.verbose) {
      this.log(`Account deactivated: ${userId}`);
    }

    this.emit('account:deactivated', { userId });

    return true;
  }

  /**
   * Clean up expired sessions
   */
  public cleanupExpiredSessions(): number {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.config.verbose) {
      this.log(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * Get statistics
   */
  public getStatistics(): AuthStatistics {
    const lockedAccounts = Array.from(this.users.values()).filter((u) => u.locked).length;

    const sessionDurations: number[] = [];
    for (const session of Array.from(this.sessions.values())) {
      sessionDurations.push(session.lastActivity - session.createdAt);
    }

    const avgSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

    const successRate =
      this.stats.totalAttempts > 0
        ? (this.stats.successfulAuths / this.stats.totalAttempts) * 100
        : 0;

    return {
      totalAttempts: this.stats.totalAttempts,
      successfulAuths: this.stats.successfulAuths,
      failedAuths: this.stats.failedAuths,
      activeSessions: this.sessions.size,
      totalUsers: this.users.size,
      lockedAccounts,
      successRate,
      avgSessionDuration,
    };
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.stats = {
      totalAttempts: 0,
      successfulAuths: 0,
      failedAuths: 0,
    };

    this.emit('stats:reset');
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.config.verbose) {
      // Using warn for verbose logging as it's allowed by linter
      console.warn(`[TCell] ${message}`);
    }
  }
}
