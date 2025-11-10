import { CorticalNeuron, Astrocyte } from '../../../src/index';
import type { RegisterUserInput, LoginCredentials, User } from '../schemas/user.schema';
import { randomUUID } from 'crypto';

/**
 * User Service - Handles user registration and authentication
 */
export class UserService extends CorticalNeuron {
  private userStore: Astrocyte;
  private sessionStore: Astrocyte;

  constructor() {
    super({
      id: 'user-service',
      threshold: 0.5,
    });

    // Initialize state stores
    this.userStore = new Astrocyte({
      id: 'user-store',
      cacheSize: 1000,
      ttl: 3600000, // 1 hour
    });

    this.sessionStore = new Astrocyte({
      id: 'session-store',
      cacheSize: 500,
      ttl: 1800000, // 30 minutes
    });
  }

  /**
   * Activate the service and its dependencies
   */
  public override async activate(): Promise<void> {
    await super.activate();
    await this.userStore.activate();
    await this.sessionStore.activate();
  }

  /**
   * Register a new user
   */
  public async registerUser(input: RegisterUserInput): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findUserByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const user: User = {
      id: randomUUID(),
      email: input.email,
      username: input.username,
      createdAt: new Date(),
    };

    // Store user (in production, hash the password!)
    await this.userStore.set(`user:${user.id}`, user);
    await this.userStore.set(`email:${user.email}`, user.id);

    // In production, you'd also store the hashed password separately
    // For demo purposes, we're skipping password storage

    return user;
  }

  /**
   * Authenticate user and create session
   */
  public async login(credentials: LoginCredentials): Promise<{
    user: User;
    sessionToken: string;
  }> {
    // Find user by email
    const user = await this.findUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // In production, verify the password hash
    // For demo, we'll skip password verification

    // Create session
    const sessionToken = randomUUID();
    await this.sessionStore.set(`session:${sessionToken}`, {
      userId: user.id,
      email: user.email,
      createdAt: new Date(),
    });

    // Update last login
    user.lastLogin = new Date();
    await this.userStore.set(`user:${user.id}`, user);

    return { user, sessionToken };
  }

  /**
   * Validate session token
   */
  public async validateSession(token: string): Promise<User | null> {
    const session = await this.sessionStore.get<{ userId: string }>(`session:${token}`);
    if (!session) {
      return null;
    }

    const user = await this.userStore.get<User>(`user:${session.userId}`);
    return user || null;
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    const userId = await this.userStore.get<string>(`email:${email}`);
    if (!userId) {
      return null;
    }

    return await this.userStore.get<User>(`user:${userId}`) || null;
  }

  /**
   * Get service statistics
   */
  public getStats() {
    return {
      totalUsers: this.userStore.keys('user:*').length,
      activeSessions: this.sessionStore.keys('session:*').length,
      userStoreStats: this.userStore.getStats(),
      sessionStoreStats: this.sessionStore.getStats(),
    };
  }
}
