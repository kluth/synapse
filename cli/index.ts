#!/usr/bin/env node

import { Command } from 'commander';
import { generateNeuron, generateGlial, generateCircuit, generateEvent } from './commands/generate';
import { GLIAL_TYPES } from './utils/validation';

const program = new Command();

program
  .name('synapse')
  .description('CLI tool for generating Synapse Framework components')
  .version('0.1.0');

// Generate neuron command
program
  .command('generate:neuron')
  .alias('g:neuron')
  .description('Generate a neuron (cortical or reflex)')
  .argument('<name>', 'Neuron name (PascalCase)')
  .argument('[type]', 'Neuron type (cortical|reflex)', 'cortical')
  .action((name: string, type: string) => {
    try {
      if (type !== 'cortical' && type !== 'reflex') {
        console.error('❌ Error: Type must be either "cortical" or "reflex"');
        process.exit(1);
      }
      generateNeuron(name, type as 'cortical' | 'reflex' | undefined);
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Generate glial cell command
program
  .command('generate:glial')
  .alias('g:glial')
  .description('Generate a glial cell (astrocyte, oligodendrocyte, microglia, or ependymal)')
  .argument('<type>', `Glial type (${GLIAL_TYPES.join('|')})`)
  .argument('<name>', 'Glial cell name (PascalCase)')
  .action((type: string, name: string) => {
    try {
      generateGlial(type, name);
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Generate circuit command
program
  .command('generate:circuit')
  .alias('g:circuit')
  .description('Generate a neural circuit')
  .argument('<name>', 'Circuit name (PascalCase)')
  .action((name: string) => {
    try {
      generateCircuit(name);
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Generate event schema command
program
  .command('generate:event')
  .alias('g:event')
  .description('Generate an event schema')
  .argument('<name>', 'Event name (PascalCase)')
  .action((name: string) => {
    try {
      generateEvent(name);
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);
