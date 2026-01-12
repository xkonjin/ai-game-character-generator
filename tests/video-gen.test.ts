import { describe, it, expect } from 'vitest';
import { getAnimationTypes, getAnimationConfig, getSupportedProviders } from '../src/video-gen/index.js';

describe('Video Generation', () => {
  describe('getAnimationTypes', () => {
    it('should return all animation types', () => {
      const types = getAnimationTypes();
      expect(types).toContain('idle');
      expect(types).toContain('walk');
      expect(types).toContain('run');
      expect(types).toContain('attack');
      expect(types).toContain('jump');
      expect(types).toContain('death');
      expect(types).toContain('hurt');
      expect(types).toHaveLength(7);
    });
  });

  describe('getAnimationConfig', () => {
    it('should return config for idle animation', () => {
      const config = getAnimationConfig('idle');
      expect(config.prompt).toContain('idle');
      expect(config.duration).toBe('4s');
      expect(config.fps).toBe(24);
    });

    it('should return config for walk animation', () => {
      const config = getAnimationConfig('walk');
      expect(config.prompt).toContain('walk');
      expect(config.duration).toBe('4s');
      expect(config.fps).toBe(24);
    });

    it('should return config for run animation', () => {
      const config = getAnimationConfig('run');
      expect(config.prompt).toContain('run');
      expect(config.duration).toBe('3s');
      expect(config.fps).toBe(30);
    });

    it('should return config for attack animation', () => {
      const config = getAnimationConfig('attack');
      expect(config.prompt).toContain('attack');
      expect(config.duration).toBe('2s');
      expect(config.fps).toBe(30);
    });

    it('should have loop mention in looping animations', () => {
      const loopingTypes = ['idle', 'walk', 'run'] as const;
      loopingTypes.forEach(type => {
        const config = getAnimationConfig(type);
        expect(config.prompt.toLowerCase()).toContain('loop');
      });
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = getSupportedProviders();
      expect(providers).toContain('veo');
      expect(providers).toContain('runway');
      expect(providers).toContain('placeholder');
      expect(providers).toHaveLength(3);
    });
  });

  describe('animation prompts quality', () => {
    it('should include motion-related keywords in all prompts', () => {
      const types = getAnimationTypes();
      const motionKeywords = ['animation', 'motion', 'movement', 'cycle', 'pose'];
      
      types.forEach(type => {
        const config = getAnimationConfig(type);
        const hasMotionKeyword = motionKeywords.some(kw => 
          config.prompt.toLowerCase().includes(kw)
        );
        expect(hasMotionKeyword).toBe(true);
      });
    });

    it('should have reasonable duration for each animation type', () => {
      const types = getAnimationTypes();
      
      types.forEach(type => {
        const config = getAnimationConfig(type);
        const match = config.duration.match(/(\d+)s/);
        expect(match).not.toBeNull();
        
        const seconds = parseInt(match![1]);
        expect(seconds).toBeGreaterThanOrEqual(1);
        expect(seconds).toBeLessThanOrEqual(10);
      });
    });

    it('should have valid fps values', () => {
      const types = getAnimationTypes();
      const validFps = [24, 30, 60];
      
      types.forEach(type => {
        const config = getAnimationConfig(type);
        expect(validFps).toContain(config.fps);
      });
    });
  });
});
