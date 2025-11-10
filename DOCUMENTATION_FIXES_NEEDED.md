# Documentation Fixes - Action Items

**Created**: 2025-11-10
**Priority Levels**: Critical, High, Medium, Low
**Total Items**: 15 fixes needed

---

## CRITICAL PRIORITY (Fix Immediately)

### FIX-1: FireAndForget Pattern Documentation

**Location**: `/docs/systems/circulatory/README.md` (Lines 348-376)
**Issue**: Class doesn't exist in codebase
**Current Text**:
```markdown
### 5. Fire-and-Forget

Asynchronous one-way messages:

```typescript
import { FireAndForget } from '@synapse-framework/core';

const fireAndForget = new FireAndForget(heart);

// Send message without waiting for confirmation
fireAndForget.send('analytics.track', {
  event: 'user.login',
  userId: '123',
  timestamp: new Date()
});
// ... more code
```
```

**Solution A (Remove if not implemented)**:
Delete lines 348-376 entirely, OR move to "Planned Features" section

**Solution B (Implement if planned)**:
Create `/src/circulatory/patterns/FireAndForget.ts` with implementation

**Recommendation**: Solution B - feature seems useful and well-designed. Implement it to match documentation.

---

## HIGH PRIORITY (Fix This Week)

### FIX-2: Astrocyte Parameter Names

**Location**: `/docs/getting-started/first-app.md` (Lines 143-155)
**Issue**: Parameter names don't match actual code
**File Affected**: `/src/glial/Astrocyte.ts`

**Current (Wrong)**:
```typescript
this.userStore = new Astrocyte({
  id: 'user-store',
  maxSize: 1000,
  defaultTTL: 3600000, // 1 hour
});

this.sessionStore = new Astrocyte({
  id: 'session-store',
  maxSize: 500,
  defaultTTL: 1800000, // 30 minutes
});
```

**Corrected (Right)**:
```typescript
this.userStore = new Astrocyte({
  id: 'user-store',
  cacheSize: 1000,      // Changed from maxSize
  ttl: 3600000,         // Changed from defaultTTL (1 hour)
});

this.sessionStore = new Astrocyte({
  id: 'session-store',
  cacheSize: 500,       // Changed from maxSize
  ttl: 1800000,         // Changed from defaultTTL (30 minutes)
});
```

**Action**: Update both occurrences in the tutorial file

---

### FIX-3: Add BloodCell Import to Circulatory Examples

**Location**: `/docs/systems/circulatory/README.md` (Line 382-389)
**Issue**: BloodCell is used but not imported

**Current**:
```typescript
import { Heart, PublishSubscribe, RequestResponse } from '@synapse-framework/core';
```

**Corrected**:
```typescript
import {
  Heart,
  PublishSubscribe,
  RequestResponse,
  BloodCell  // ADD THIS
} from '@synapse-framework/core';
```

**Section Affected**: "Quick Start" section

---

### FIX-4: Complete Heart API Reference

**Location**: `/docs/systems/circulatory/README.md` (Lines 676-711)
**Issue**: API Reference is incomplete, missing several documented methods

**Current API Reference**:
```typescript
class Heart {
  constructor(options?: HeartOptions);

  // Publishing
  publish(topic: string, cell: BloodCell, options?: PublishOptions): Promise<void>;

  // Subscribing
  subscribe(topic: string, callback: (cell: BloodCell) => void): () => void;

  // Management
  acknowledge(cell: BloodCell): void;
  getStatistics(): HeartStatistics;
  getQueueSize(): number;

  // Event handlers
  onDeadLetter(handler: (cell: BloodCell) => void): void;
  onAcknowledge(handler: (cell: BloodCell) => void): void;
}
```

**What to Add**:
1. Document `HeartOptions` interface:
```typescript
interface HeartOptions {
  persistence?: boolean;      // Enable message persistence
  maxQueueSize?: number;      // Maximum queue capacity (default: 10000)
}
```

2. Document `PublishOptions` interface

3. Document `HeartStatistics` interface:
```typescript
interface HeartStatistics {
  published: number;
  delivered: number;
  failed: number;
  deadLettered: number;
}
```

4. Document all return types and exceptions

---

## HIGH PRIORITY (Fix This Sprint)

### FIX-5: Verify MuscleGroup Constructor

**Location**: `/docs/systems/SYSTEMS_OVERVIEW.md` (Lines 160-165)
**Issue**: Constructor signature needs verification against actual code

**Current Example**:
```typescript
const pipeline = new MuscleGroup('csv-pipeline', [
  parseCSV,
  new FilterMuscle(validateRow),
  new MapMuscle(transformRow),
]);
```

**Action Required**:
1. Check actual `/src/muscular/core/MuscleGroup.ts` constructor
2. Verify parameter order and types
3. Update docs to match actual signature
4. Check if FilterMuscle and MapMuscle constructors shown correctly

**Expected Result**: Verified code example that works

---

### FIX-6: Verify Astrocyte Methods

**Location**: `/docs/getting-started/first-app.md` (Lines 254-259)
**Issue**: Methods may not exist as shown

**Code in Question**:
```typescript
public getStats() {
  return {
    totalUsers: this.userStore.getKeysByPattern('user:*').length,
    activeSessions: this.sessionStore.getKeysByPattern('session:*').length,
    userStoreStats: this.userStore.getStatistics(),
    sessionStoreStats: this.sessionStore.getStatistics(),
  };
}
```

**Verification Needed**:
- Does `Astrocyte.getKeysByPattern()` exist?
- Does `Astrocyte.getStatistics()` exist?
- What are the correct method names?
- Update example with correct methods

**Source to Check**: `/src/glial/Astrocyte.ts`

---

### FIX-7: Add Missing Imports to SYSTEMS_OVERVIEW

**Location**: `/docs/systems/SYSTEMS_OVERVIEW.md`

**Missing Imports in Examples**:

Line 143:
```typescript
// Add this line:
import { Muscle } from '@synapse-framework/core';

const parseCSV = new Muscle('parseCSV', (csv: string) => {
  return csv.split('\n').map(line => line.split(','));
});
```

Line 185:
```typescript
// Add this line:
import { WebSocketAdapter } from '@synapse-framework/core';

const ws = new WebSocketAdapter({
  port: 3000,
  path: '/ws',
});
```

---

## MEDIUM PRIORITY (Fix Next Sprint)

### FIX-8: Verify Macrophage.sanitize() Return Type

**Location**: `/docs/systems/immune/README.md` (Lines 523-541)
**Issue**: Return structure needs verification

**Code to Verify**:
```typescript
const result = sanitizer.sanitize({
  name: '<script>alert("xss")</script>',
  email: 'user@example.com',
  query: "'; DROP TABLE users; --",
  path: '../../../etc/passwd',
});

if (result.safe) {
  console.log('Clean input:', result.sanitized);
} else {
  console.log('Threats found:', result.threats);
}
```

**Action Required**:
1. Check actual `Macrophage.sanitize()` implementation
2. Verify return object structure:
   - Does it have `.safe` property?
   - Does it have `.sanitized` property?
   - Does it have `.threats` property?
3. Update if structure differs

**Source to Check**: `/src/immune/sanitization/Macrophage.ts`

---

### FIX-9: Document Configuration Defaults

**Location**: `/docs/systems/circulatory/README.md` (Lines 53-56)
**Issue**: Configuration options not fully documented

**Add Documentation For**:
```typescript
interface HeartOptions {
  // Default: false
  persistence?: boolean;

  // Default: 10000
  maxQueueSize?: number;

  // Determine what these do:
  // - What happens when persistence is true vs false?
  // - How are messages stored?
  // - Is there cleanup of old messages?
  // - What errors can occur?
}
```

**Required Additions**:
1. Default values
2. Behavioral implications of each option
3. When to use each setting
4. Example configurations

---

### FIX-10: Add Type Annotations to Theater Examples

**Location**: `/docs/testing/TESTING_GUIDE.md` (Lines 64-70)
**Issue**: Example lacks type information

**Current**:
```typescript
lab.experiment('should work', async () => {
  const component = stage.getComponent('my-component');
  const result = await component.process({ data: 'test' });
  Hypothesis.expect(result.success).toBe(true);
});
```

**Enhanced with Types**:
```typescript
lab.experiment('should work', async () => {
  const component = stage.getComponent<MyComponent>('my-component');
  const result: ProcessResult = await component.process({ data: 'test' });
  Hypothesis.expect(result.success).toBe(true);
});
```

**Action**: Add type annotations to all Theater System examples

---

### FIX-11: Clarify TCell Parameter Behavior

**Location**: `/docs/systems/immune/README.md` (Lines 50-59)
**Issue**: TCell configuration needs more details

**Current**:
```typescript
const auth = new TCell({
  id: 'authenticator',
  algorithm: 'HS256',           // JWT algorithm
  secretKey: process.env.SECRET,// Secret for signing
  expiresIn: '1h',             // Token expiration
  refreshEnabled: true,         // Allow token refresh
});
```

**Add Documentation For**:
1. What JWT algorithms are supported?
2. What is the format of `expiresIn`?
3. What happens when `refreshEnabled` is false?
4. Are there other configuration options?
5. What are the defaults?

---

### FIX-12: Document BCell Role Assignment

**Location**: `/docs/systems/immune/README.md` (Lines 379-391)
**Issue**: Authorization example missing context

**Current Example**:
```typescript
// Assign role to user
authz.assignRole('user-123', 'author');

// Assign multiple roles
authz.assignRole('user-456', 'admin');
authz.assignRole('user-456', 'author');

// Remove role
authz.revokeRole('user-123', 'author');
```

**Add Documentation For**:
1. How does BCell track role assignments internally?
2. What happens if assigning a role that doesn't exist?
3. How are role assignments persisted?
4. Can you query user's current roles?
5. What are the error conditions?

---

## LOW PRIORITY (Polish)

### FIX-13: Add Context to Signal Strength

**Location**: `/docs/core-concepts/neuromorphic-architecture.md` (Lines 316-322)
**Issue**: Vague strength interpretation

**Current**:
```
- **0.0 - 0.3**: Weak signal (suggestions, hints)
- **0.4 - 0.6**: Moderate signal (normal operation)
- **0.7 - 0.9**: Strong signal (important data)
- **1.0**: Critical signal (emergencies, errors)
```

**Add Clarification**:
1. What happens if strength > 1.0?
2. What happens if strength < 0.0?
3. Is it automatically clamped?
4. How does signal type affect interpretation?
5. Give concrete examples

---

### FIX-14: Document Connection Types Behavior

**Location**: `/docs/core-concepts/neuromorphic-architecture.md` (Lines 217-227)
**Issue**: Connection type behaviors not explained

**Current**:
```
1. **Excitatory** - Promotes activation (positive signal)
2. **Inhibitory** - Prevents activation (negative signal)
3. **Modulatory** - Adjusts sensitivity (modifies threshold)
```

**Add Documentation**:
1. How does each type affect signal strength?
2. Do they modify the signal's strength value?
3. How do they interact with threshold calculations?
4. Can a single neuron have all three connection types?
5. Example with concrete numbers

---

### FIX-15: Standardize Parameter Names

**Location**: Multiple files
**Issue**: Inconsistent naming across documentation

**Examples of Inconsistency**:
1. `maxSize` vs `cacheSize` vs `size`
2. `defaultTTL` vs `ttl` vs `TTL`
3. `darkMode` vs `dark` vs `theme`
4. `secretKey` vs `secret` vs `key`

**Create Standard**:
1. Establish naming conventions
2. Apply consistently across all docs
3. Add glossary of standard term names
4. Update all examples

---

## Verification Checklist

### Before Publishing
- [ ] FIX-1: FireAndForget decision made
- [ ] FIX-2: Astrocyte parameters updated
- [ ] FIX-3: BloodCell import added
- [ ] FIX-4: Heart API Reference completed
- [ ] FIX-5: MuscleGroup verified
- [ ] FIX-6: Astrocyte methods verified
- [ ] FIX-7: Missing imports added
- [ ] FIX-8: Macrophage return type verified
- [ ] FIX-9: Configuration defaults documented
- [ ] FIX-10: Type annotations added
- [ ] FIX-11: TCell behavior documented
- [ ] FIX-12: BCell context added
- [ ] FIX-13: Signal strength clarified
- [ ] FIX-14: Connection types documented
- [ ] FIX-15: Parameters standardized

### Testing After Fixes
- [ ] All code examples compile
- [ ] All imports are valid
- [ ] All method calls exist
- [ ] All parameter names are correct
- [ ] All type annotations are accurate
- [ ] Cross-references work
- [ ] Examples run without errors

---

## Implementation Priority

### Phase 1: Critical Fixes (1-2 days)
1. FIX-1: Resolve FireAndForget
2. FIX-2: Fix Astrocyte parameters
3. FIX-3: Add BloodCell import
4. FIX-4: Complete Heart API reference

### Phase 2: High Priority (3-5 days)
5. FIX-5: Verify MuscleGroup
6. FIX-6: Verify Astrocyte methods
7. FIX-7: Add missing imports
8. FIX-8: Verify Macrophage

### Phase 3: Medium Priority (1 week)
9. FIX-9: Document configuration
10. FIX-10: Add type annotations
11. FIX-11: Document TCell
12. FIX-12: Add BCell context

### Phase 4: Polish (Ongoing)
13. FIX-13: Clarify signals
14. FIX-14: Document connections
15. FIX-15: Standardize naming

---

## Testing Script Template

Create test file `/verify-docs.ts` to validate examples:

```typescript
import {
  Heart, PublishSubscribe, RequestResponse,
  TCell, BCell, Macrophage, Antibody,
  CorticalNeuron, ReflexNeuron,
  Astrocyte, Bone,
  Stage, Laboratory, Hypothesis
} from '@synapse-framework/core';

// Test 1: Astrocyte parameters
const astrocyte = new Astrocyte({
  id: 'test',
  cacheSize: 1000,  // Verify this works
  ttl: 60000        // Verify this works
});

// Test 2: BloodCell import
const cell = new BloodCell({ test: 'data' }, {
  type: 'Test'
});

// Test 3: Heart configuration
const heart = new Heart({
  persistence: true,
  maxQueueSize: 10000
});

// Add more tests for each fix...
```

---

## Notes for Documentation Team

1. **Priority**: Follow the priority levels - don't do all at once
2. **Testing**: Test every fix with actual code after updating docs
3. **Review**: Have another person review changes
4. **Communication**: Note the issue being fixed in commit message
5. **Tracking**: Use issue tracker to track fix progress
6. **Verification**: Re-run documentation tests after each fix

---

**Total Estimated Effort**: 20-30 hours
**Recommended Timeline**: 2-3 sprints
**Owner**: Documentation Team
**Reviewers**: Framework Team + Community

---

For detailed information on each issue, see `/DOCUMENTATION_ISSUE_LOG.md`
