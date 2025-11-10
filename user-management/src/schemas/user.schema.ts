import { Bone } from '../../../src/index';
import { z } from 'zod';

/**
 * User registration schema
 */
export const RegisterUserSchema = new Bone(
  'RegisterUser',
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
  })
);

/**
 * Login credentials schema
 */
export const LoginCredentialsSchema = new Bone(
  'LoginCredentials',
  z.object({
    email: z.string().email(),
    password: z.string(),
  })
);

/**
 * User entity schema
 */
export const UserSchema = new Bone(
  'User',
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string(),
    createdAt: z.date(),
    lastLogin: z.date().optional(),
  })
);

// Export TypeScript types
export type RegisterUserInput = z.infer<typeof RegisterUserSchema.schema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema.schema>;
export type User = z.infer<typeof UserSchema.schema>;
