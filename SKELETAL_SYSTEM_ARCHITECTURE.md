# Synapse Skeletal System Architecture

## Overview

The Skeletal System provides the **structural foundation** for Synapse applications. Like biological bones, it defines rigid, immutable data structures that everything else attaches to.

## Biological Metaphor

| Biology | Software | Purpose |
|---------|----------|---------|
| **Bones** | Data models & schemas | Rigid structure, type definitions |
| **Joints** | Relationships | Connect bones together |
| **Cartilage** | Interfaces | Smooth interaction between bones |
| **Marrow** | Factories | Generate new data instances |
| **Periosteum** | Validators | Outer layer that checks integrity |
| **Calcium** | Type constraints | Strengthen structure |

## Design Principles

1. **Immutability** - Bones don't change shape
2. **Type Safety** - 100% strict TypeScript
3. **Runtime Validation** - Verify structure at runtime
4. **Composability** - Bones connect via joints
5. **Self-Documentation** - Schema is documentation

## Core Components

### 1. Bone (Base Class)

A `Bone` represents an immutable data structure with a schema.

```typescript
class Bone<T> {
  readonly schema: Schema<T>;
  readonly name: string;

  validate(data: unknown): T;
  create(data: Partial<T>): T;
  connect<U>(other: Bone<U>, relationship: Relationship): Joint<T, U>;
}
```

**Properties:**
- Immutable once created
- Self-validating
- Type-safe at compile and runtime
- Composable via joints

**Examples:**
- `UserBone` - User data structure
- `OrderBone` - Order data structure
- `ProductBone` - Product catalog

### 2. Schema (Validation System)

A `Schema` defines the structure and constraints of a bone.

```typescript
interface Schema<T> {
  fields: Record<keyof T, FieldSchema>;
  validate(data: unknown): ValidationResult<T>;
  parse(data: unknown): T;
}

interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  nullable: boolean;
  default?: unknown;
  validators?: Validator[];
}
```

**Validation Rules:**
- Type checking
- Required fields
- Nullable fields
- Custom validators
- Default values

### 3. Joint (Connections)

A `Joint` connects two bones with a relationship.

```typescript
class Joint<A, B> {
  readonly boneA: Bone<A>;
  readonly boneB: Bone<B>;
  readonly relationship: Relationship;
  readonly cardinality: '1:1' | '1:N' | 'N:N';

  link(a: A, b: B): void;
  unlink(a: A, b: B): void;
  getRelated(a: A): B[];
}
```

**Relationship Types:**
- `ONE_TO_ONE` - User ↔ Profile
- `ONE_TO_MANY` - Order → OrderItems
- `MANY_TO_MANY` - Products ↔ Categories

### 4. Marrow (Factories)

`Marrow` generates new instances of bones.

```typescript
class Marrow<T> {
  constructor(private bone: Bone<T>);

  generate(overrides?: Partial<T>): T;
  generateMany(count: number, overrides?: Partial<T>): T[];
}
```

## Implementation Plan

### Phase 1: Core Foundation (Week 1)

1. **Base Bone Class**
   - Immutable data holder
   - Schema integration
   - Validation methods
   - Factory methods

2. **Schema System**
   - Field definitions
   - Type validators
   - Custom validators
   - Error messages

3. **Validators**
   - StringValidator (min/max length, regex)
   - NumberValidator (min/max, integer)
   - ArrayValidator (min/max items)
   - ObjectValidator (nested schemas)

### Phase 2: Connections (Week 2)

1. **Joint System**
   - Relationship types
   - Cardinality enforcement
   - Link/unlink operations
   - Query methods

2. **Cartilage (Interfaces)**
   - Abstract bone interfaces
   - Protocol definitions
   - Contract enforcement

### Phase 3: Advanced Features (Week 3)

1. **Marrow (Factories)**
   - Instance generation
   - Test data generation
   - Faker integration

2. **Periosteum (Validation Layer)**
   - Pre-validation hooks
   - Post-validation hooks
   - Transform functions

## Directory Structure

```
src/skeletal/
├── core/
│   ├── Bone.ts              # Base bone class
│   ├── Schema.ts            # Schema definition
│   ├── FieldSchema.ts       # Field definitions
│   └── ValidationResult.ts  # Validation results
├── joints/
│   ├── Joint.ts             # Base joint class
│   ├── OneToOne.ts          # 1:1 relationship
│   ├── OneToMany.ts         # 1:N relationship
│   └── ManyToMany.ts        # N:N relationship
├── validators/
│   ├── Validator.ts         # Base validator
│   ├── StringValidator.ts
│   ├── NumberValidator.ts
│   ├── DateValidator.ts
│   ├── ArrayValidator.ts
│   └── ObjectValidator.ts
├── marrow/
│   ├── Marrow.ts            # Factory class
│   └── generators/          # Data generators
├── cartilage/
│   └── interfaces.ts        # Common interfaces
├── __tests__/
│   ├── Bone.test.ts
│   ├── Schema.test.ts
│   ├── Joint.test.ts
│   ├── validators/
│   └── integration/
└── index.ts
```

## Usage Examples

### Define a User Bone

```typescript
import { Bone, Schema } from '@synapse-framework/core/skeletal';

interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  createdAt: Date;
}

const userSchema: Schema<User> = {
  fields: {
    id: { type: 'string', required: true, nullable: false },
    email: {
      type: 'string',
      required: true,
      nullable: false,
      validators: [emailValidator, uniqueValidator]
    },
    name: { type: 'string', required: true, nullable: false },
    age: {
      type: 'number',
      required: false,
      nullable: true,
      validators: [minValidator(0), maxValidator(150)]
    },
    createdAt: {
      type: 'date',
      required: true,
      nullable: false,
      default: () => new Date()
    }
  }
};

const UserBone = new Bone('User', userSchema);

// Create instance
const user = UserBone.create({
  id: '123',
  email: 'alice@example.com',
  name: 'Alice'
});

// Validate unknown data
const result = UserBone.validate(unknownData);
if (result.valid) {
  const user: User = result.data;
}
```

### Connect Bones with Joints

```typescript
// Define Order bone
const OrderBone = new Bone('Order', orderSchema);

// Define OrderItem bone
const OrderItemBone = new Bone('OrderItem', orderItemSchema);

// Create 1:N relationship
const orderItemsJoint = OrderBone.connect(
  OrderItemBone,
  {
    type: 'ONE_TO_MANY',
    foreignKey: 'orderId'
  }
);

// Link instances
const order = OrderBone.create({ id: '1', total: 100 });
const item1 = OrderItemBone.create({ id: '1', orderId: '1', price: 50 });
const item2 = OrderItemBone.create({ id: '2', orderId: '1', price: 50 });

orderItemsJoint.link(order, item1);
orderItemsJoint.link(order, item2);

// Query related
const items = orderItemsJoint.getRelated(order); // [item1, item2]
```

### Use Marrow for Test Data

```typescript
import { Marrow } from '@synapse-framework/core/skeletal';

const userMarrow = new Marrow(UserBone);

// Generate single user
const testUser = userMarrow.generate({
  email: 'test@example.com'
});

// Generate multiple users
const users = userMarrow.generateMany(10);
```

## Testing Strategy

### Unit Tests
- Bone creation and validation
- Schema parsing and validation
- Validator correctness
- Joint operations

### Integration Tests
- Complex schemas with nested objects
- Multiple joints between bones
- End-to-end validation

### Performance Tests
- Validation speed (>10,000 validations/sec)
- Large dataset handling
- Memory usage

## Coverage Goals

- **Branches**: ≥80%
- **Functions**: ≥90%
- **Lines**: ≥90%
- **Statements**: ≥85%

## Next Steps

1. Implement base `Bone` class with tests
2. Create schema validation system
3. Add built-in validators
4. Implement joint system
5. Add marrow factories
6. Write comprehensive documentation
7. Create example bones for common use cases

## Benefits

✅ **Type Safety** - Compile-time and runtime
✅ **Self-Documenting** - Schema is documentation
✅ **Testable** - Easy to generate test data
✅ **Composable** - Bones connect via joints
✅ **Immutable** - No accidental mutations
✅ **Validated** - Always correct structure
✅ **Extensible** - Custom validators
✅ **Performance** - Cached validation
