# Synapse Skin Layer - User Guide

## Overview

The Skin Layer is Synapse's standards-based UI framework built using **100% web standards**: Custom Elements v1, Shadow DOM, and HTML Templates. No build tools, no JSX, no proprietary dependencies.

### Biological Metaphor

Just as skin is the body's interface with the external world, the Skin layer provides the interface between users and your Synapse application. Components follow neuroscience terminology:

- **Receptors** - Input components that detect external stimuli (clicks, text input, etc.)
- **Effectors** - Output components that produce responses
- **Dermal Layers** - Structural components (containers, layouts)
- **Support Cells** - State management and optimization (like glial cells)

## Installation

The Skin layer is included with Synapse. Simply import the components you need:

```typescript
import { TouchReceptor, TextReceptor } from '@synapse-framework/core/skin';
```

Or in a browser (ES modules):

```html
<script type="module">
  import './dist/skin/receptors/TouchReceptor.js';
  import './dist/skin/receptors/TextReceptor.js';
</script>
```

## Quick Start

### Using in HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Synapse Skin Demo</title>
  </head>
  <body>
    <!-- TouchReceptor (Button) -->
    <touch-receptor
      label="Click Me"
      variant="primary"
      size="medium"
    ></touch-receptor>

    <!-- TextReceptor (Input) -->
    <text-receptor
      placeholder="Enter text..."
      type="text"
    ></text-receptor>

    <script type="module">
      // Components are automatically registered
      const button = document.querySelector('touch-receptor');
      button.addEventListener('touch', (e) => {
        console.log('Button touched!', e.detail);
      });

      const input = document.querySelector('text-receptor');
      input.addEventListener('data-input', (e) => {
        console.log('Value:', e.detail.value);
      });
    </script>
  </body>
</html>
```

### Using in TypeScript

```typescript
import { TouchReceptor, TextReceptor } from '@synapse-framework/core/skin';

// Create programmatically
const button = document.createElement('touch-receptor') as TouchReceptor;
button.setAttribute('label', 'Submit');
button.setAttribute('variant', 'primary');

button.addEventListener('touch', (e: CustomEvent) => {
  console.log('Touched!', e.detail);
});

document.body.appendChild(button);
```

## Components

### TouchReceptor (Button)

Mechanoreceptor that detects touch/click interactions.

#### Attributes

| Attribute  | Type                                    | Default     | Description             |
| ---------- | --------------------------------------- | ----------- | ----------------------- |
| `label`    | `string`                                | `"Button"`  | Button label text       |
| `variant`  | `"primary" \| "secondary" \| "danger" \| "ghost"` | `"primary"` | Visual style variant    |
| `size`     | `"small" \| "medium" \| "large"`        | `"medium"`  | Button size             |
| `disabled` | `boolean`                               | `false`     | Disabled state          |
| `loading`  | `boolean`                               | `false`     | Loading state           |

#### Events

**`touch`** - Emitted when button is clicked

```typescript
receptor.addEventListener('touch', (e: CustomEvent) => {
  console.log(e.detail); // { label, variant, timestamp }
});
```

**`neural-signal`** - Emitted for neural network integration

```typescript
receptor.addEventListener('neural-signal', (e: CustomEvent) => {
  console.log(e.detail); // { type, data, strength, timestamp, source }
});
```

#### Methods

```typescript
// Enable/disable
receptor.enable();
receptor.disable();

// Set loading state
receptor.setLoading(true);

// Programmatically trigger
receptor.press();

// Focus
receptor.focus();
receptor.blur();
```

#### Examples

```html
<!-- Primary button -->
<touch-receptor
  label="Submit"
  variant="primary"
  size="medium"
></touch-receptor>

<!-- Danger button -->
<touch-receptor
  label="Delete"
  variant="danger"
  size="large"
></touch-receptor>

<!-- Disabled button -->
<touch-receptor
  label="Disabled"
  variant="primary"
  disabled
></touch-receptor>

<!-- Loading button -->
<touch-receptor
  label="Loading..."
  variant="primary"
  loading
></touch-receptor>
```

### TextReceptor (Input Field)

Chemoreceptor that receives text/data input.

#### Attributes

| Attribute     | Type                                                      | Default  | Description           |
| ------------- | --------------------------------------------------------- | -------- | --------------------- |
| `value`       | `string`                                                  | `""`     | Current value         |
| `placeholder` | `string`                                                  | `""`     | Placeholder text      |
| `type`        | `"text" \| "email" \| "password" \| "tel" \| "url" \| "search"` | `"text"` | Input type            |
| `disabled`    | `boolean`                                                 | `false`  | Disabled state        |
| `required`    | `boolean`                                                 | `false`  | Required field        |
| `readonly`    | `boolean`                                                 | `false`  | Read-only state       |
| `error`       | `string`                                                  | -        | Error message         |
| `maxlength`   | `number`                                                  | -        | Maximum character count |

#### Events

**`data-input`** - Emitted on every input change

```typescript
receptor.addEventListener('data-input', (e: CustomEvent) => {
  console.log(e.detail); // { value, type, timestamp }
});
```

**`change`** - Emitted when input loses focus after changing

```typescript
receptor.addEventListener('change', (e: CustomEvent) => {
  console.log(e.detail); // { value, valid }
});
```

**`focus`** / **`blur`** - Focus state changes

#### Methods

```typescript
// Get/set value
const value = receptor.getValue();
receptor.setValue('new value');

// Validation
const isValid = receptor.isValid();

// Error handling
receptor.setError('This field is required');
receptor.clearError();

// Focus
receptor.focus();
receptor.blur();

// Enable/disable
receptor.enable();
receptor.disable();
```

#### Examples

```html
<!-- Text input -->
<text-receptor
  placeholder="Enter your name"
  type="text"
  required
></text-receptor>

<!-- Email input -->
<text-receptor
  placeholder="email@example.com"
  type="email"
  required
></text-receptor>

<!-- Password input -->
<text-receptor
  placeholder="Password"
  type="password"
  required
></text-receptor>

<!-- With character limit -->
<text-receptor
  placeholder="Max 100 characters"
  maxlength="100"
></text-receptor>

<!-- With error -->
<text-receptor
  placeholder="Required field"
  error="This field is required"
></text-receptor>

<!-- Read-only -->
<text-receptor
  value="Cannot edit this"
  readonly
></text-receptor>
```

## Form Example

```html
<form id="login-form">
  <div>
    <label for="email">Email</label>
    <text-receptor
      id="email"
      type="email"
      placeholder="email@example.com"
      required
    ></text-receptor>
  </div>

  <div>
    <label for="password">Password</label>
    <text-receptor
      id="password"
      type="password"
      placeholder="••••••••"
      required
    ></text-receptor>
  </div>

  <div style="display: flex; gap: 1rem">
    <touch-receptor
      id="cancel-btn"
      label="Cancel"
      variant="ghost"
    ></touch-receptor>
    <touch-receptor
      id="submit-btn"
      label="Sign In"
      variant="primary"
      style="flex: 1"
    ></touch-receptor>
  </div>
</form>

<script>
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  submitBtn.addEventListener('touch', async () => {
    // Validate
    if (!emailInput.isValid()) {
      emailInput.setError('Please enter a valid email');
      return;
    }

    if (!passwordInput.getValue()) {
      passwordInput.setError('Password is required');
      return;
    }

    // Submit
    submitBtn.setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.getValue(),
          password: passwordInput.getValue(),
        }),
      });

      if (response.ok) {
        submitBtn.setAttribute('label', 'Success!');
        submitBtn.setAttribute('variant', 'secondary');
      } else {
        emailInput.setError('Invalid credentials');
      }
    } finally {
      submitBtn.setLoading(false);
    }
  });

  cancelBtn.addEventListener('touch', () => {
    emailInput.setValue('');
    passwordInput.setValue('');
  });
</script>
```

## Neural Signal Integration

All Skin components emit neural signals for integration with Synapse's neural network:

```typescript
import { TouchReceptor } from '@synapse-framework/core/skin';
import { CorticalNeuron } from '@synapse-framework/core';

// Create a backend neuron
class LoginNeuron extends CorticalNeuron {
  async process(signal: Signal): Promise<Signal> {
    // Handle login logic
    return { type: 'login-success', data: {}, strength: 1.0 };
  }
}

const loginNeuron = new LoginNeuron('login-handler');
await loginNeuron.activate();

// Connect UI to neuron
const submitBtn = document.querySelector('touch-receptor');

submitBtn.addEventListener('neural-signal', async (e: CustomEvent) => {
  // Forward UI signal to neural network
  await loginNeuron.receive({
    type: e.detail.type,
    data: e.detail.data,
    strength: e.detail.strength,
  });
});
```

## Styling

Components use Shadow DOM with CSS custom properties for theming:

```css
touch-receptor {
  --touch-receptor-radius: 8px;
  --touch-receptor-transition: all 0.3s ease;
}

text-receptor {
  --text-receptor-radius: 6px;
  --text-receptor-border: #cbd5e1;
  --text-receptor-focus: #0066cc;
  --text-receptor-error: #dc2626;
}
```

### Global Styles

```css
/* Style all touch receptors */
touch-receptor {
  display: inline-block;
  margin: 0.5rem;
}

/* Style all text receptors */
text-receptor {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
}
```

## Accessibility

All components are fully accessible:

- ✅ **Keyboard navigation** - Tab, Enter, Space
- ✅ **Focus management** - Visible focus indicators
- ✅ **ARIA attributes** - Proper roles and labels
- ✅ **Screen readers** - Semantic HTML inside Shadow DOM

```html
<!-- Accessible by default -->
<touch-receptor
  label="Submit Form"
  variant="primary"
></touch-receptor>

<!-- Screen readers announce: "Submit Form, button" -->
```

## Browser Support

| Browser | Version | Status |
| ------- | ------- | ------ |
| Chrome  | 54+     | ✅ Full support |
| Edge    | 79+     | ✅ Full support |
| Safari  | 10.1+   | ✅ Full support |
| Firefox | 63+     | ✅ Full support |

**Requirements:**
- Custom Elements v1
- Shadow DOM v1
- ES6 Modules

## Best Practices

### 1. Use Semantic HTML

```html
<!-- Good: Use form elements -->
<form>
  <text-receptor type="email" required></text-receptor>
  <touch-receptor label="Submit"></touch-receptor>
</form>

<!-- Avoid: Don't use buttons for links -->
<!-- Use <a> tags for navigation -->
```

### 2. Validate Before Submit

```javascript
const inputs = document.querySelectorAll('text-receptor[required]');
const allValid = Array.from(inputs).every(input => input.isValid());

if (!allValid) {
  // Show errors
  inputs.forEach(input => {
    if (!input.isValid()) {
      input.setError('This field is required');
    }
  });
  return;
}
```

### 3. Handle Loading States

```javascript
submitBtn.addEventListener('touch', async () => {
  submitBtn.setLoading(true);

  try {
    await performAction();
    submitBtn.setAttribute('label', 'Success!');
  } catch (error) {
    submitBtn.setAttribute('label', 'Error');
    submitBtn.setAttribute('variant', 'danger');
  } finally {
    submitBtn.setLoading(false);
  }
});
```

### 4. Clean Up Event Listeners

```javascript
const receptor = document.createElement('touch-receptor');

const handler = (e) => console.log(e.detail);
receptor.addEventListener('touch', handler);

// When done
receptor.removeEventListener('touch', handler);
receptor.remove(); // Cleanup is automatic
```

## Testing

Components are fully testable with standard testing tools:

```typescript
import { TouchReceptor } from '@synapse-framework/core/skin';

describe('TouchReceptor', () => {
  let receptor: TouchReceptor;

  beforeEach(() => {
    receptor = document.createElement('touch-receptor') as TouchReceptor;
    document.body.appendChild(receptor);
  });

  afterEach(() => {
    receptor.remove();
  });

  it('should emit touch event', (done) => {
    receptor.addEventListener('touch', (e: CustomEvent) => {
      expect(e.detail).toBeDefined();
      done();
    });

    const button = receptor.shadowRoot?.querySelector('button');
    button?.click();
  });
});
```

## Performance

Skin components are highly optimized:

- **Small bundle size** - ~2KB per component (gzipped)
- **Fast rendering** - Uses native template cloning
- **Efficient updates** - Shadow DOM prevents style recalculation
- **Lazy loading** - Import only what you need

## Examples

See `/examples/skin-demo.html` for a complete interactive demo.

## Next Steps

- Learn about [creating custom receptors](./SKIN_CUSTOM_COMPONENTS.md)
- Explore [integration with Synapse neurons](./NEURAL_INTEGRATION.md)
- Read the [WebNN integration guide](./SKIN_WEBNN_ARCHITECTURE.md)

## Support

- 📖 [Full API Documentation](./API_DOCUMENTATION.md)
- 💬 [GitHub Discussions](https://github.com/synapse-framework/synapse/discussions)
- 🐛 [Report Issues](https://github.com/synapse-framework/synapse/issues)
