import { describe, it, expect } from 'vitest';
import { 
  validateBatchConfig, 
  createBatchConfigTemplate,
} from '../src/batch/index.js';

describe('Batch Module', () => {
  describe('validateBatchConfig', () => {
    it('should validate correct config', () => {
      const config = {
        characters: [
          { name: 'knight', prompt: 'pixel knight' },
          { name: 'wizard', prompt: 'anime wizard' },
        ],
        outputDir: './output',
      };
      
      expect(validateBatchConfig(config)).toBe(true);
    });

    it('should reject config without characters', () => {
      const config = {
        outputDir: './output',
      };
      
      expect(validateBatchConfig(config)).toBe(false);
    });

    it('should reject config without outputDir', () => {
      const config = {
        characters: [{ prompt: 'test' }],
      };
      
      expect(validateBatchConfig(config)).toBe(false);
    });

    it('should reject character without prompt', () => {
      const config = {
        characters: [{ name: 'test' }],
        outputDir: './output',
      };
      
      expect(validateBatchConfig(config)).toBe(false);
    });

    it('should reject null config', () => {
      expect(validateBatchConfig(null)).toBe(false);
    });

    it('should reject non-object config', () => {
      expect(validateBatchConfig('string')).toBe(false);
      expect(validateBatchConfig(123)).toBe(false);
    });
  });

  describe('createBatchConfigTemplate', () => {
    it('should create valid template', () => {
      const template = createBatchConfigTemplate();
      
      expect(validateBatchConfig(template)).toBe(true);
      expect(template.characters.length).toBeGreaterThan(0);
      expect(template.outputDir).toBeDefined();
      expect(template.defaults).toBeDefined();
      expect(template.providers).toBeDefined();
      expect(template.options).toBeDefined();
    });

    it('should include multiple character examples', () => {
      const template = createBatchConfigTemplate();
      
      expect(template.characters.length).toBeGreaterThanOrEqual(3);
      
      const names = template.characters.map(c => c.name);
      expect(names).toContain('knight');
      expect(names).toContain('wizard');
    });

    it('should include all style types in examples', () => {
      const template = createBatchConfigTemplate();
      
      const styles = template.characters.map(c => c.style).filter(Boolean);
      expect(styles).toContain('pixel');
      expect(styles).toContain('anime');
    });

    it('should include different skeleton types', () => {
      const template = createBatchConfigTemplate();
      
      const skeletons = template.characters.map(c => c.skeleton).filter(Boolean);
      expect(skeletons).toContain('biped');
      expect(skeletons).toContain('quadruped');
    });

    it('should have reasonable default options', () => {
      const template = createBatchConfigTemplate();
      
      expect(template.options?.concurrency).toBeGreaterThan(0);
      expect(template.options?.continueOnError).toBe(true);
    });
  });

  describe('batch configuration', () => {
    it('should support optional fields', () => {
      const minimalConfig = {
        characters: [
          { prompt: 'test character' },
        ],
        outputDir: './output',
      };
      
      expect(validateBatchConfig(minimalConfig)).toBe(true);
    });

    it('should support all optional character fields', () => {
      const fullConfig = {
        characters: [
          {
            name: 'full-char',
            prompt: 'full character description',
            style: 'pixel' as const,
            animations: ['idle', 'walk'] as const[],
            skeleton: 'biped' as const,
          },
        ],
        outputDir: './output',
        defaults: {
          style: 'anime' as const,
          animations: ['idle'] as const[],
          skeleton: 'biped' as const,
        },
        providers: {
          image: 'openai' as const,
          video: 'veo' as const,
          rigging: 'tripo' as const,
        },
        options: {
          concurrency: 3,
          continueOnError: false,
          skipAnimation: true,
          skipRigging: false,
        },
      };
      
      expect(validateBatchConfig(fullConfig)).toBe(true);
    });
  });
});
