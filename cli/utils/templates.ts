import type { GlialType } from './validation';

export type NeuronType = 'cortical' | 'reflex';

/**
 * Render neuron class template
 */
export function renderNeuronTemplate(name: string, type: NeuronType): string {
  const baseClass = type === 'cortical' ? 'CorticalNeuron' : 'ReflexNeuron';
  const description =
    type === 'cortical'
      ? 'Stateful neuron for long-running services'
      : 'Stateless neuron for event-driven functions';

  return `import { ${baseClass}, Input, Output } from '@synapse-framework/core';

/**
 * ${name}
 * ${description}
 */
class ${name} extends ${baseClass} {
  constructor() {
    super({
      id: '${name.toLowerCase()}',
      threshold: 0.7,
    });
  }

  /**
   * Process input and return output
   */
  async process(input: Input): Promise<Output> {
    // TODO: Implement your processing logic here
    console.log('Processing input:', input);

    return {
      data: { processed: true },
      success: true,
    };
  }
}

export default ${name};
`;
}

/**
 * Render neuron test template
 */
export function renderNeuronTestTemplate(name: string, type: NeuronType): string {
  return `import ${name} from './${name}';

describe('${name}', () => {
  let neuron: ${name};

  beforeEach(() => {
    neuron = new ${name}();
  });

  describe('initialization', () => {
    it('should create ${type} neuron with correct properties', () => {
      expect(neuron).toBeDefined();
      expect(neuron.id).toBe('${name.toLowerCase()}');
    });
  });

  describe('processing', () => {
    it('should process input successfully', async () => {
      await neuron.activate();

      const result = await neuron.process({
        data: { test: true },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('lifecycle', () => {
    it('should activate and deactivate correctly', async () => {
      await neuron.activate();
      expect(neuron.state).toBe('active');

      await neuron.deactivate();
      expect(neuron.state).toBe('inactive');
    });
  });
});
`;
}

/**
 * Render glial cell class template
 */
export function renderGlialTemplate(type: GlialType, name: string): string {
  const baseClass = type.charAt(0).toUpperCase() + type.slice(1);
  const descriptions: Record<GlialType, string> = {
    astrocyte: 'State management and caching',
    oligodendrocyte: 'Performance optimization and connection pooling',
    microglia: 'Health monitoring and error tracking',
    ependymal: 'API gateway and request routing',
  };

  const config: Record<GlialType, string> = {
    astrocyte: `maxSize: 1000,
      defaultTTL: 300000, // 5 minutes`,
    oligodendrocyte: `maxConnections: 10,
      connectionTTL: 300000,`,
    microglia: `errorThreshold: 10,`,
    ependymal: `rateLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },`,
  };

  return `import { ${baseClass} } from '@synapse-framework/core';

/**
 * ${name}
 * ${descriptions[type]}
 */
class ${name} extends ${baseClass} {
  constructor() {
    super({
      id: '${name.toLowerCase()}',
      ${config[type]}
    });
  }

  /**
   * Initialize and activate the glial cell
   */
  async initialize(): Promise<void> {
    await this.activate();
    // TODO: Add your initialization logic here
  }

  /**
   * Cleanup and deactivate
   */
  async cleanup(): Promise<void> {
    await this.deactivate();
    // TODO: Add your cleanup logic here
  }
}

export default ${name};
`;
}

/**
 * Render glial cell test template
 */
export function renderGlialTestTemplate(type: GlialType, name: string): string {
  return `import ${name} from './${name}';

describe('${name}', () => {
  let glial: ${name};

  beforeEach(() => {
    glial = new ${name}();
  });

  afterEach(async () => {
    if (glial.state === 'active') {
      await glial.cleanup();
    }
  });

  describe('initialization', () => {
    it('should create ${type} with correct properties', () => {
      expect(glial).toBeDefined();
      expect(glial.id).toBe('${name.toLowerCase()}');
    });

    it('should initialize successfully', async () => {
      await glial.initialize();
      expect(glial.state).toBe('active');
    });
  });

  describe('lifecycle', () => {
    it('should activate and cleanup correctly', async () => {
      await glial.initialize();
      expect(glial.state).toBe('active');

      await glial.cleanup();
      expect(glial.state).toBe('inactive');
    });
  });
});
`;
}

/**
 * Render neural circuit template
 */
export function renderCircuitTemplate(name: string): string {
  return `import { NeuralCircuit, NeuralNode } from '@synapse-framework/core';

/**
 * ${name}
 * Neural circuit for managing connected neurons
 */
class ${name} extends NeuralCircuit {
  constructor() {
    super({
      id: '${name.toLowerCase()}',
    });
  }

  /**
   * Initialize the circuit with neurons and connections
   */
  async initialize(neurons: NeuralNode[]): Promise<void> {
    // Add neurons to the circuit
    neurons.forEach((neuron) => this.addNeuron(neuron));

    // TODO: Define connections between neurons
    // Example:
    // this.connect(neurons[0], neurons[1], { weight: 0.8, type: 'excitatory' });

    // Activate all neurons in the circuit
    await this.activateAll();
  }

  /**
   * Get circuit statistics
   */
  getStats() {
    return this.getStatistics();
  }

  /**
   * Shutdown the circuit
   */
  async shutdown(): Promise<void> {
    await this.deactivateAll();
  }
}

export default ${name};
`;
}

/**
 * Render circuit test template
 */
export function renderCircuitTestTemplate(name: string): string {
  return `import ${name} from './${name}';
import { NeuralNode } from '@synapse-framework/core';

describe('${name}', () => {
  let circuit: ${name};
  let testNeurons: NeuralNode[];

  beforeEach(() => {
    circuit = new ${name}();
    testNeurons = [
      new NeuralNode({ id: 'neuron-1', threshold: 0.5 }),
      new NeuralNode({ id: 'neuron-2', threshold: 0.5 }),
    ];
  });

  afterEach(async () => {
    if (circuit.neurons.length > 0) {
      await circuit.shutdown();
    }
  });

  describe('initialization', () => {
    it('should create circuit with correct properties', () => {
      expect(circuit).toBeDefined();
      expect(circuit.id).toBe('${name.toLowerCase()}');
    });

    it('should initialize with neurons', async () => {
      await circuit.initialize(testNeurons);

      const stats = circuit.getStats();
      expect(stats.neuronCount).toBe(2);
    });
  });

  describe('lifecycle', () => {
    it('should shutdown correctly', async () => {
      await circuit.initialize(testNeurons);
      await circuit.shutdown();

      testNeurons.forEach((neuron) => {
        expect(neuron.state).toBe('inactive');
      });
    });
  });
});
`;
}

/**
 * Render glial test template - duplicate removed, using existing function above
 */

/**
 * Render event schema template
 */
export function renderEventTemplate(name: string): string {
  return `import { z } from 'zod';

/**
 * ${name} Event Schema
 */
export const ${name}Schema = z.object({
  id: z.string().uuid(),
  type: z.literal('${name
    .toLowerCase()
    .replace(/([A-Z])/g, ':$1')
    .slice(1)}'),
  source: z.string(),
  data: z.object({
    // TODO: Define your event data structure here
    // Example:
    // userId: z.string(),
    // timestamp: z.date(),
  }),
  timestamp: z.date(),
  correlationId: z.string().optional(),
});

/**
 * Infer TypeScript type from schema
 */
export type ${name} = z.infer<typeof ${name}Schema>;

/**
 * Example usage:
 *
 * const event: ${name} = {
 *   id: crypto.randomUUID(),
 *   type: '${name
   .toLowerCase()
   .replace(/([A-Z])/g, ':$1')
   .slice(1)}',
 *   source: 'my-service',
 *   data: {
 *     // Your event data
 *   },
 *   timestamp: new Date(),
 * };
 *
 * // Validate at runtime
 * ${name}Schema.parse(event);
 */
`;
}
