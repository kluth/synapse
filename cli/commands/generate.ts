 
import * as path from 'path';
import { validateName, validateGlialType } from '../utils/validation';
import {
  renderNeuronTemplate,
  renderNeuronTestTemplate,
  renderGlialTemplate,
  renderGlialTestTemplate,
  renderCircuitTemplate,
  renderCircuitTestTemplate,
  renderEventTemplate,
  type NeuronType,
} from '../utils/templates';
import { writeFile, getCwd } from '../utils/fs';

/**
 * Generate a neuron (cortical or reflex)
 */
export function generateNeuron(name: string, type: NeuronType = 'cortical'): void {
  // Validate name
  validateName(name, 'Neuron');

  const cwd = getCwd();
  const neuronsDir = path.join(cwd, 'src', 'neurons');

  // Generate main file
  const mainFilePath = path.join(neuronsDir, `${name}.ts`);
  const mainContent = renderNeuronTemplate(name, type);
  writeFile(mainFilePath, mainContent);

  // Generate test file
  const testFilePath = path.join(neuronsDir, `${name}.test.ts`);
  const testContent = renderNeuronTestTemplate(name, type);
  writeFile(testFilePath, testContent);

  console.log(`✓ Created ${type} neuron: ${name}`);
  console.log(`  - ${mainFilePath}`);
  console.log(`  - ${testFilePath}`);
}

/**
 * Generate a glial cell
 */
export function generateGlial(type: string, name: string): void {
  // Validate type
  if (!validateGlialType(type)) {
    throw new Error(
      `Invalid glial type: ${type}. Must be one of: astrocyte, oligodendrocyte, microglia, ependymal`,
    );
  }

  // Validate name
  validateName(name, 'Glial');

  const cwd = getCwd();
  const glialDir = path.join(cwd, 'src', 'glial');

  // Generate main file
  const mainFilePath = path.join(glialDir, `${name}.ts`);
  const mainContent = renderGlialTemplate(type, name);
  writeFile(mainFilePath, mainContent);

  // Generate test file
  const testFilePath = path.join(glialDir, `${name}.test.ts`);
  const testContent = renderGlialTestTemplate(type, name);
  writeFile(testFilePath, testContent);

  console.log(`✓ Created ${type} glial cell: ${name}`);
  console.log(`  - ${mainFilePath}`);
  console.log(`  - ${testFilePath}`);
}

/**
 * Generate a neural circuit
 */
export function generateCircuit(name: string): void {
  // Validate name
  validateName(name, 'Circuit');

  const cwd = getCwd();
  const circuitDir = path.join(cwd, 'src', 'network');

  // Generate main file
  const mainFilePath = path.join(circuitDir, `${name}.ts`);
  const mainContent = renderCircuitTemplate(name);
  writeFile(mainFilePath, mainContent);

  // Generate test file
  const testFilePath = path.join(circuitDir, `${name}.test.ts`);
  const testContent = renderCircuitTestTemplate(name);
  writeFile(testFilePath, testContent);

  console.log(`✓ Created neural circuit: ${name}`);
  console.log(`  - ${mainFilePath}`);
  console.log(`  - ${testFilePath}`);
}

/**
 * Generate an event schema
 */
export function generateEvent(name: string): void {
  // Validate name
  validateName(name, 'Event');

  const cwd = getCwd();
  const eventsDir = path.join(cwd, 'src', 'events');

  // Generate event schema file
  const filePath = path.join(eventsDir, `${name}.ts`);
  const content = renderEventTemplate(name);
  writeFile(filePath, content);

  console.log(`✓ Created event schema: ${name}`);
  console.log(`  - ${filePath}`);
}
