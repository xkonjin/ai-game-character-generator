import { describe, it, expect } from 'vitest';
import { getSkeletonTypes, getSkeletonConfig, getSupportedProviders } from '../src/rigging/index.js';

describe('Rigging Module', () => {
  describe('getSkeletonTypes', () => {
    it('should return all skeleton types', () => {
      const types = getSkeletonTypes();
      expect(types).toContain('biped');
      expect(types).toContain('quadruped');
      expect(types).toContain('custom');
      expect(types).toHaveLength(3);
    });
  });

  describe('getSkeletonConfig', () => {
    it('should return config for biped skeleton', () => {
      const config = getSkeletonConfig('biped');
      expect(config.boneCount).toBe(25);
      expect(config.description).toContain('Humanoid');
    });

    it('should return config for quadruped skeleton', () => {
      const config = getSkeletonConfig('quadruped');
      expect(config.boneCount).toBe(32);
      expect(config.description).toContain('Four-legged');
    });

    it('should return config for custom skeleton', () => {
      const config = getSkeletonConfig('custom');
      expect(config.boneCount).toBe(20);
      expect(config.description).toContain('Custom');
    });

    it('should have reasonable bone counts', () => {
      const types = getSkeletonTypes();
      
      types.forEach(type => {
        const config = getSkeletonConfig(type);
        expect(config.boneCount).toBeGreaterThan(10);
        expect(config.boneCount).toBeLessThan(100);
      });
    });

    it('should have non-empty descriptions', () => {
      const types = getSkeletonTypes();
      
      types.forEach(type => {
        const config = getSkeletonConfig(type);
        expect(config.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = getSupportedProviders();
      expect(providers).toContain('tripo');
      expect(providers).toContain('placeholder');
      expect(providers).toHaveLength(2);
    });
  });

  describe('skeleton suitability', () => {
    it('biped should be suitable for humanoid characters', () => {
      const config = getSkeletonConfig('biped');
      expect(config.description.toLowerCase()).toMatch(/human|biped|standard/);
    });

    it('quadruped should have more bones than biped for complex leg structure', () => {
      const biped = getSkeletonConfig('biped');
      const quadruped = getSkeletonConfig('quadruped');
      expect(quadruped.boneCount).toBeGreaterThan(biped.boneCount);
    });
  });
});
