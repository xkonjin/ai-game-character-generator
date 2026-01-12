import { describe, it, expect } from 'vitest';
import { optimizePrompt } from '../src/image-gen/index.js';

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
});
