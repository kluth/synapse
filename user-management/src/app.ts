import { Heart } from '../../src/index';
import { UserService } from './services/user.service';
import { SecurityService } from './security/security.service';
import {
  RegisterUserSchema,
  LoginCredentialsSchema,
  type RegisterUserInput,
  type LoginCredentials,
  type User,
} from './schemas/user.schema';

interface AppEvent {
  id: string;
  type: string;
  source: string;
  data: any;
  timestamp: Date;
}

/**
 * Main Application
 */
export class UserManagementApp {
  private userService: UserService;
  private securityService: SecurityService;
  private messageRouter: Heart;

  constructor() {
    this.userService = new UserService();
    this.securityService = new SecurityService();
    this.messageRouter = new Heart();

    this.setupEventHandlers();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    console.log('Starting User Management Application...\n');

    // Activate all services
    await this.userService.activate();

    console.log('✅ All services activated\n');
  }

  /**
   * Setup event handlers for system events
   */
  private setupEventHandlers(): void {
    // Listen for user registration events
    this.messageRouter.on('user:registered', async (event: AppEvent) => {
      console.log(`📧 Sending welcome email to ${event.data.email}`);
      // In production, trigger email service
    });

    // Listen for login events
    this.messageRouter.on('user:logged-in', async (event: AppEvent) => {
      console.log(`👋 User ${event.data.username} logged in`);
      // In production, log analytics event
    });
  }

  /**
   * Register a new user
   */
  public async registerUser(input: unknown): Promise<{
    success: boolean;
    user?: { id: string; email: string; username: string };
    token?: string;
    error?: string;
  }> {
    try {
      // Step 1: Sanitize input
      const sanitized = this.securityService.sanitizeInput(input as Record<string, unknown>);

      // Step 2: Validate schema
      const validatedInput = RegisterUserSchema.validate(sanitized) as RegisterUserInput;

      // Step 3: Register user
      const user: User = await this.userService.registerUser(validatedInput);

      // Step 4: Create authentication token
      const token = await this.securityService.createToken(user.id, user.email);

      // Step 5: Emit event
      await this.messageRouter.emit('user:registered', {
        id: crypto.randomUUID(),
        type: 'user:registered',
        source: 'user-service',
        data: user,
        timestamp: new Date(),
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Login user
   */
  public async login(input: unknown): Promise<{
    success: boolean;
    user?: { id: string; email: string; username: string };
    token?: string;
    error?: string;
  }> {
    try {
      // Step 1: Sanitize input
      const sanitized = this.securityService.sanitizeInput(input as Record<string, unknown>);

      // Step 2: Validate schema
      const credentials = LoginCredentialsSchema.validate(sanitized) as LoginCredentials;

      // Step 3: Authenticate
      const { user }: { user: User } = await this.userService.login(credentials);

      // Step 4: Create token
      const token = await this.securityService.createToken(user.id, user.email);

      // Step 5: Emit event
      await this.messageRouter.emit('user:logged-in', {
        id: crypto.randomUUID(),
        type: 'user:logged-in',
        source: 'user-service',
        data: user,
        timestamp: new Date(),
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Get application statistics
   */
  public getStats() {
    return {
      userService: this.userService.getStats(),
      health: this.userService.healthCheck(),
    };
  }

  /**
   * Shutdown the application
   */
  public async shutdown(): Promise<void> {
    await this.userService.deactivate();
    console.log('Application shut down');
  }
}
