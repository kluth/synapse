# Installation & Setup

Welcome! This guide will help you install the Synapse Framework and set up your development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher (or **Bun** 1.0+)
- **npm** 9.0+ or **pnpm** 8.0+ (or bun)
- **TypeScript** 5.3+ (included as dependency)
- A code editor (VS Code recommended for TypeScript)

### Verify Your Environment

```bash
# Check Node.js version
node --version
# Should show v18.0.0 or higher

# Check npm version
npm --version
# Should show 9.0.0 or higher

# Optional: Check Bun version
bun --version
# Should show 1.0.0 or higher
```

## Installation Methods

### Method 1: Create a New Project (Recommended)

The fastest way to get started is using the Synapse CLI to create a new project:

```bash
# Using npm
npx @synapse-framework/create-synapse my-app
cd my-app

# Or using Bun
bunx @synapse-framework/create-synapse my-app
cd my-app
```

This creates a new project with:
- Pre-configured TypeScript setup
- Example components
- Test configuration
- Development scripts
- Recommended VS Code settings

### Method 2: Add to Existing Project

If you want to add Synapse to an existing project:

```bash
# Using npm
npm install @synapse-framework/core

# Using pnpm
pnpm add @synapse-framework/core

# Using Bun
bun add @synapse-framework/core
```

### Method 3: Clone and Build from Source

For contributors or those who want the latest development version:

```bash
# Clone the repository
git clone https://github.com/your-org/synapse.git
cd synapse

# Install dependencies
npm install

# Build the framework
npm run build

# Run tests to verify
npm test
```

## Project Structure

After installation, your project will have this structure:

```
my-app/
├── src/
│   ├── index.ts           # Application entry point
│   ├── components/        # Your neural components
│   ├── config/           # Configuration files
│   └── types/            # Custom TypeScript types
├── tests/
│   └── *.test.ts         # Unit tests
├── e2e/
│   └── *.spec.ts         # End-to-end tests
├── package.json
├── tsconfig.json
├── jest.config.js        # Test configuration
└── playwright.config.ts  # E2E test configuration
```

## TypeScript Configuration

Synapse requires strict TypeScript mode. Here's the recommended `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

Key settings:
- **strict: true** - Enables all strict type checking
- **target: ES2022** - Modern JavaScript features
- **moduleResolution: bundler** - For modern bundlers

## Verify Installation

Let's verify everything is working:

### 1. Create a Test File

Create `src/test-install.ts`:

```typescript
import { NeuralNode } from '@synapse-framework/core';

async function testInstallation() {
  console.log('Testing Synapse Framework installation...\n');

  // Create a simple neural node
  const node = new NeuralNode({
    id: 'test-node',
    type: 'cortical',
    threshold: 0.5,
  });

  // Activate it
  await node.activate();

  // Check status
  const status = node.getStatus();
  console.log(`Node Status: ${status}`);

  // Health check
  const health = node.healthCheck();
  console.log(`Node Healthy: ${health.healthy}`);

  if (health.healthy && status === 'active') {
    console.log('\n✅ Installation successful!');
  } else {
    console.log('\n❌ Installation failed');
  }

  // Cleanup
  await node.deactivate();
}

testInstallation();
```

### 2. Run the Test

```bash
# Using ts-node
npx ts-node src/test-install.ts

# Or build and run
npm run build
node dist/test-install.js

# Using Bun (fastest)
bun run src/test-install.ts
```

You should see:

```
Testing Synapse Framework installation...

Node Status: active
Node Healthy: true

✅ Installation successful!
```

## IDE Setup

### VS Code (Recommended)

Install these extensions for the best experience:

1. **TypeScript** - Built-in support
2. **ESLint** - Code linting
3. **Prettier** - Code formatting
4. **Jest** - Test runner
5. **GitLens** - Git integration

Recommended `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### WebStorm/IntelliJ IDEA

Synapse works great with JetBrains IDEs:

1. Enable TypeScript support
2. Configure ESLint and Prettier
3. Set up Jest test runner
4. Enable auto-import suggestions

## Development Scripts

The generated project includes these npm scripts:

```bash
# Development
npm run build          # Compile TypeScript
npm run dev           # Watch mode for development

# Testing
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run E2E tests with Playwright

# Code Quality
npm run lint          # Check code quality
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code with Prettier
npm run type-check    # TypeScript type checking
```

## Common Installation Issues

### Issue: Module not found

**Error**: `Cannot find module '@synapse-framework/core'`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

**Error**: `Property 'activate' does not exist on type 'NeuralNode'`

**Solution**:
```bash
# Ensure TypeScript version is 5.3+
npm install typescript@latest --save-dev

# Regenerate type definitions
npm run build
```

### Issue: Test failures

**Error**: Tests fail to run or timeout

**Solution**:
```bash
# Update Jest and ts-jest
npm install --save-dev jest@latest ts-jest@latest

# Clear Jest cache
npm test -- --clearCache
```

### Issue: Bun compatibility

**Error**: Bun-specific issues

**Solution**:
```bash
# Ensure Bun is up to date
bun upgrade

# Some features may require Node.js fallback
bun --bun run your-script.ts
```

## Next Steps

Great! You've successfully installed Synapse. Now you're ready to:

1. **[Build Your First Application](./first-app.md)** - Create a simple reactive app
2. **[Understand Core Concepts](../core-concepts/neuromorphic-architecture.md)** - Learn the framework philosophy
3. **[Explore System Guides](../systems/nervous/README.md)** - Deep dive into each system

## Getting Help

If you encounter issues:

1. Check the **[Troubleshooting Guide](../troubleshooting.md)**
2. Search **[GitHub Issues](https://github.com/your-org/synapse/issues)**
3. Join our **[Community](../community.md)**

## Upgrade Guide

To upgrade to the latest version:

```bash
# Check current version
npm list @synapse-framework/core

# Update to latest
npm update @synapse-framework/core

# Or specify a version
npm install @synapse-framework/core@latest
```

Check the **[CHANGELOG](../../CHANGELOG.md)** for breaking changes and migration guides.
