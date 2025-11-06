import { generateNeuron, generateGlial, generateCircuit, generateEvent } from './generate';
import * as fs from 'fs';

// Mock fs
jest.mock('fs');

describe('Generate Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNeuron', () => {
    it('should generate a cortical neuron with correct structure', () => {
      const neuronName = 'UserService';
      const neuronType = 'cortical';

      generateNeuron(neuronName, neuronType);

      // Check if file was created
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // .ts and .test.ts

      // Check file content includes neuron name
      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const mainFileContent = calls[0][1];
      expect(mainFileContent).toContain('UserService');
      expect(mainFileContent).toContain('CorticalNeuron');
    });

    it('should generate a reflex neuron with correct structure', () => {
      const neuronName = 'ImageProcessor';
      const neuronType = 'reflex';

      generateNeuron(neuronName, neuronType);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const mainFileContent = calls[0][1];
      expect(mainFileContent).toContain('ImageProcessor');
      expect(mainFileContent).toContain('ReflexNeuron');
    });

    it('should default to cortical when type is not specified', () => {
      const neuronName = 'DefaultService';

      generateNeuron(neuronName);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const mainFileContent = calls[0][1];
      expect(mainFileContent).toContain('CorticalNeuron');
    });

    it('should create both main and test files', () => {
      const neuronName = 'TestNeuron';

      generateNeuron(neuronName, 'cortical');

      // Should create 2 files: main + test
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should throw error if neuron name is invalid', () => {
      expect(() => generateNeuron('')).toThrow('Neuron name is required');
      expect(() => generateNeuron('invalid-name')).toThrow('Neuron name must be in PascalCase');
    });
  });

  describe('generateGlial', () => {
    const glialTypes = ['astrocyte', 'oligodendrocyte', 'microglia', 'ependymal'];

    glialTypes.forEach((type) => {
      it(`should generate ${type} with correct structure`, () => {
        const name = `My${type.charAt(0).toUpperCase() + type.slice(1)}`;

        generateGlial(type, name);

        expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

        const calls = (fs.writeFileSync as jest.Mock).mock.calls;
        const mainFileContent = calls[0][1];
        expect(mainFileContent).toContain(name);
        expect(mainFileContent).toContain(type.charAt(0).toUpperCase() + type.slice(1));
      });
    });

    it('should throw error for invalid glial type', () => {
      expect(() => generateGlial('invalid', 'TestGlial')).toThrow('Invalid glial type');
    });

    it('should throw error if glial name is invalid', () => {
      expect(() => generateGlial('astrocyte', '')).toThrow('Glial name is required');
    });
  });

  describe('generateCircuit', () => {
    it('should generate a neural circuit with correct structure', () => {
      const circuitName = 'UserManagement';

      generateCircuit(circuitName);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const mainFileContent = calls[0][1];
      expect(mainFileContent).toContain('UserManagement');
      expect(mainFileContent).toContain('NeuralCircuit');
    });

    it('should throw error if circuit name is invalid', () => {
      expect(() => generateCircuit('')).toThrow('Circuit name is required');
    });
  });

  describe('generateEvent', () => {
    it('should generate an event schema with correct structure', () => {
      const eventName = 'UserRegistered';

      generateEvent(eventName);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const fileContent = calls[0][1];
      expect(fileContent).toContain('UserRegistered');
      expect(fileContent).toContain('z.object');
    });

    it('should throw error if event name is invalid', () => {
      expect(() => generateEvent('')).toThrow('Event name is required');
    });
  });
});
