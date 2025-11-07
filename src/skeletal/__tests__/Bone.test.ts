/**
 * Bone Tests
 *
 * TDD: Write tests first, then implement Bone
 */

import { Bone } from '../core/Bone';
import { Schema } from '../core/Schema';
import { FieldSchema } from '../core/FieldSchema';
import { minLength, email } from '../validators/StringValidator';
import { min, max, integer } from '../validators/NumberValidator';

describe('Bone', () => {
  describe('Basic Bone Definition', () => {
    it('should create a bone with schema', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      const UserBone = new Bone('User', userSchema);

      expect(UserBone.getName()).toBe('User');
      expect(UserBone.getSchema()).toBe(userSchema);
    });

    it('should create valid bone instances', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      const UserBone = new Bone('User', userSchema);

      const result = UserBone.create({
        name: 'John',
        age: 30,
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should reject invalid data', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      const UserBone = new Bone('User', userSchema);

      const result = UserBone.create({
        name: 'John',
        age: 'thirty',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Complex Bone Models', () => {
    it('should create a user registration bone', () => {
      const UserBone = new Bone(
        'User',
        new Schema({
          username: new FieldSchema('string').validate(minLength(3)),
          email: new FieldSchema('string').validate(email()),
          age: new FieldSchema('number').validate(min(18)).validate(max(120)).validate(integer()),
          role: new FieldSchema('string').optional().default('user'),
        }),
      );

      const result = UserBone.create({
        username: 'johndoe',
        email: 'john@example.com',
        age: 25,
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        username: 'johndoe',
        email: 'john@example.com',
        age: 25,
        role: 'user',
      });
    });

    it('should validate and return all errors', () => {
      const UserBone = new Bone(
        'User',
        new Schema({
          username: new FieldSchema('string').validate(minLength(3)),
          email: new FieldSchema('string').validate(email()),
          age: new FieldSchema('number').validate(min(18)),
        }),
      );

      const result = UserBone.create({
        username: 'ab',
        email: 'invalid',
        age: 15,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('Bone Immutability', () => {
    it('should create separate instances on each create call', () => {
      const CounterBone = new Bone(
        'Counter',
        new Schema({
          value: new FieldSchema('number'),
        }),
      );

      const result1 = CounterBone.create({ value: 1 });
      const result2 = CounterBone.create({ value: 2 });

      expect(result1.data).toEqual({ value: 1 });
      expect(result2.data).toEqual({ value: 2 });
      expect(result1.data).not.toBe(result2.data);
    });
  });

  describe('Bone Metadata', () => {
    it('should provide access to schema metadata', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      const UserBone = new Bone('User', userSchema);

      const fields = UserBone.getSchema().getFields();
      expect(Object.keys(fields)).toContain('name');
      expect(Object.keys(fields)).toContain('age');
    });

    it('should allow querying field information', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number').optional(),
      });

      const UserBone = new Bone('User', userSchema);

      const nameField = UserBone.getSchema().getField('name');
      const ageField = UserBone.getSchema().getField('age');

      expect(nameField?.type).toBe('string');
      expect(nameField?.required).toBe(true);
      expect(ageField?.type).toBe('number');
      expect(ageField?.required).toBe(false);
    });
  });

  describe('Validation Method', () => {
    it('should provide a validate method', () => {
      const UserBone = new Bone(
        'User',
        new Schema({
          name: new FieldSchema('string'),
        }),
      );

      const result = UserBone.validate({ name: 'John' });

      expect(result.valid).toBe(true);
    });

    it('should validate without creating data', () => {
      const UserBone = new Bone(
        'User',
        new Schema({
          name: new FieldSchema('string'),
        }),
      );

      const result = UserBone.validate({ name: 123 });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Type Safety', () => {
    it('should work with TypeScript generics', () => {
      interface User {
        username: string;
        email: string;
        age: number;
      }

      const UserBone = new Bone<User>(
        'User',
        new Schema({
          username: new FieldSchema('string'),
          email: new FieldSchema('string'),
          age: new FieldSchema('number'),
        }),
      );

      const result = UserBone.create({
        username: 'john',
        email: 'john@example.com',
        age: 30,
      });

      if (result.valid) {
        // TypeScript should infer the correct type
        const user: User = result.data;
        expect(user.username).toBe('john');
      }
    });
  });

  describe('Real-World Scenarios', () => {
    it('should model a blog post', () => {
      const PostBone = new Bone(
        'Post',
        new Schema({
          title: new FieldSchema('string').validate(minLength(1)),
          content: new FieldSchema('string').validate(minLength(10)),
          author: new FieldSchema('string'),
          published: new FieldSchema('boolean').default(false),
          tags: new FieldSchema('array').optional(),
        }),
      );

      const result = PostBone.create({
        title: 'My First Post',
        content: 'This is a great post about TypeScript!',
        author: 'John Doe',
      });

      expect(result.valid).toBe(true);
      expect(result.data).toMatchObject({
        title: 'My First Post',
        content: 'This is a great post about TypeScript!',
        author: 'John Doe',
        published: false,
      });
    });

    it('should model product data', () => {
      const ProductBone = new Bone(
        'Product',
        new Schema({
          sku: new FieldSchema('string').validate(minLength(3)),
          name: new FieldSchema('string'),
          price: new FieldSchema('number').validate(min(0)),
          inStock: new FieldSchema('boolean').default(true),
          quantity: new FieldSchema('number').validate(min(0)).validate(integer()),
        }),
      );

      const result = ProductBone.create({
        sku: 'WIDGET-001',
        name: 'Super Widget',
        price: 29.99,
        quantity: 100,
      });

      expect(result.valid).toBe(true);
      expect(result.data).toMatchObject({
        sku: 'WIDGET-001',
        name: 'Super Widget',
        price: 29.99,
        inStock: true,
        quantity: 100,
      });
    });
  });
});
