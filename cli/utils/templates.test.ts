import {
  renderNeuronTemplate,
  renderNeuronTestTemplate,
  renderGlialTemplate,
  renderGlialTestTemplate,
  renderCircuitTemplate,
  renderEventTemplate,
} from './templates';

describe('Template Utils', () => {
  describe('renderNeuronTemplate', () => {
    it('should render cortical neuron template correctly', () => {
      const result = renderNeuronTemplate('UserService', 'cortical');

      expect(result).toContain('import { CorticalNeuron');
      expect(result).toContain('class UserService');
      expect(result).toContain('extends CorticalNeuron');
      expect(result).toContain('export default UserService');
    });

    it('should render reflex neuron template correctly', () => {
      const result = renderNeuronTemplate('ImageProcessor', 'reflex');

      expect(result).toContain('import { ReflexNeuron');
      expect(result).toContain('class ImageProcessor');
      expect(result).toContain('extends ReflexNeuron');
    });
  });

  describe('renderNeuronTestTemplate', () => {
    it('should render neuron test template correctly', () => {
      const result = renderNeuronTestTemplate('UserService', 'cortical');

      expect(result).toContain("import UserService from './UserService'");
      expect(result).toContain("describe('UserService'");
      expect(result).toContain('let neuron: UserService');
    });
  });

  describe('renderGlialTemplate', () => {
    it('should render astrocyte template correctly', () => {
      const result = renderGlialTemplate('astrocyte', 'CacheManager');

      expect(result).toContain("import { Astrocyte } from '@synapse-framework/core'");
      expect(result).toContain('class CacheManager');
      expect(result).toContain('extends Astrocyte');
    });
  });

  describe('renderGlialTestTemplate', () => {
    it('should render glial test template correctly', () => {
      const result = renderGlialTestTemplate('astrocyte', 'CacheManager');

      expect(result).toContain("import CacheManager from './CacheManager'");
      expect(result).toContain("describe('CacheManager'");
    });
  });

  describe('renderCircuitTemplate', () => {
    it('should render circuit template correctly', () => {
      const result = renderCircuitTemplate('UserManagement');

      expect(result).toContain('import { NeuralCircuit');
      expect(result).toContain('class UserManagement');
      expect(result).toContain('extends NeuralCircuit');
    });
  });

  describe('renderEventTemplate', () => {
    it('should render event schema template correctly', () => {
      const result = renderEventTemplate('UserRegistered');

      expect(result).toContain("import { z } from 'zod'");
      expect(result).toContain('export const UserRegisteredSchema = z.object');
      expect(result).toContain('export type UserRegistered');
    });
  });
});
