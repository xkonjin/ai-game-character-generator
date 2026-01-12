import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { optimizePrompt, getStylePrompts, getSupportedProviders } from '../src/image-gen/index.js';

describe('Image Generation', () => {
  describe('optimizePrompt', () => {
    it('should add pixel art prefix and suffix for pixel style', () => {
      const result = optimizePrompt('cute knight', 'pixel');
      expect(result).toContain('pixel art sprite sheet');
      expect(result).toContain('cute knight');
      expect(result).toContain('8-bit style');
    });

    it('should add anime prefix and suffix for anime style', () => {
      const result = optimizePrompt('wizard character', 'anime');
      expect(result).toContain('anime chibi');
      expect(result).toContain('wizard character');
      expect(result).toContain('cel shaded');
    });

    it('should add lowpoly prefix and suffix for lowpoly style', () => {
      const result = optimizePrompt('robot', 'lowpoly');
      expect(result).toContain('low poly');
      expect(result).toContain('robot');
      expect(result).toContain('geometric');
    });

    it('should add painterly prefix and suffix for painterly style', () => {
      const result = optimizePrompt('dragon', 'painterly');
      expect(result).toContain('hand-painted');
      expect(result).toContain('dragon');
      expect(result).toContain('concept art');
    });

    it('should add voxel prefix and suffix for voxel style', () => {
      const result = optimizePrompt('warrior', 'voxel');
      expect(result).toContain('voxel art');
      expect(result).toContain('warrior');
      expect(result).toContain('minecraft-like');
    });

    it('should always include transparent background', () => {
      const styles = ['pixel', 'anime', 'lowpoly', 'painterly', 'voxel'] as const;
      styles.forEach(style => {
        const result = optimizePrompt('character', style);
        expect(result).toContain('transparent background');
      });
    });
  });

  describe('getStylePrompts', () => {
    it('should return all style prompts', () => {
      const prompts = getStylePrompts();
      expect(Object.keys(prompts)).toHaveLength(5);
      expect(prompts).toHaveProperty('pixel');
      expect(prompts).toHaveProperty('anime');
      expect(prompts).toHaveProperty('lowpoly');
      expect(prompts).toHaveProperty('painterly');
      expect(prompts).toHaveProperty('voxel');
    });

    it('should return style prompts with prefix and suffix', () => {
      const prompts = getStylePrompts();
      Object.values(prompts).forEach(prompt => {
        expect(prompt).toHaveProperty('prefix');
        expect(prompt).toHaveProperty('suffix');
        expect(typeof prompt.prefix).toBe('string');
        expect(typeof prompt.suffix).toBe('string');
      });
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = getSupportedProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('stability');
      expect(providers).toContain('pixellab');
      expect(providers).toHaveLength(3);
    });
  });

  describe('prompt quality', () => {
    it('should generate prompts with game-specific keywords', () => {
      const styles = ['pixel', 'anime', 'lowpoly', 'painterly', 'voxel'] as const;
      const gameKeywords = ['game', 'sprite', 'asset', 'character'];
      
      styles.forEach(style => {
        const result = optimizePrompt('hero', style);
        const hasGameKeyword = gameKeywords.some(kw => 
          result.toLowerCase().includes(kw)
        );
        expect(hasGameKeyword).toBe(true);
      });
    });

    it('should preserve user prompt content', () => {
      const userPrompts = [
        'cute knight with sword',
        'fire mage casting spell',
        'robot with laser eyes',
        'dragon breathing fire',
        'ninja in shadows'
      ];

      userPrompts.forEach(userPrompt => {
        const result = optimizePrompt(userPrompt, 'pixel');
        expect(result).toContain(userPrompt);
      });
    });
  });
});
