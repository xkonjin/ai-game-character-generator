import { describe, it, expect } from 'vitest';
import { 
  formatFileSize,
  estimateOptimizedSize,
  getRecommendedOptimizations,
  ModelStats,
} from '../src/optimization/index.js';

describe('Optimization Module', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
    });
  });

  describe('estimateOptimizedSize', () => {
    const baseStats: ModelStats = {
      fileSize: 10 * 1024 * 1024, // 10 MB
      triangleCount: 50000,
      vertexCount: 25000,
      textureCount: 4,
      animationCount: 5,
      boneCount: 50,
      meshCount: 3,
    };

    it('should estimate Draco compression reduction', () => {
      const estimated = estimateOptimizedSize(baseStats, { enableDraco: true });
      // Should be significantly smaller
      expect(estimated).toBeLessThan(baseStats.fileSize * 0.3);
    });

    it('should estimate mesh simplification reduction', () => {
      const estimated = estimateOptimizedSize(baseStats, { simplifyRatio: 0.5 });
      expect(estimated).toBe(Math.round(baseStats.fileSize * 0.5));
    });

    it('should estimate texture reduction', () => {
      const estimated = estimateOptimizedSize(baseStats, { maxTextureSize: 512 });
      // Should be reduced due to smaller textures
      expect(estimated).toBeLessThan(baseStats.fileSize);
    });

    it('should combine multiple optimizations', () => {
      const estimated = estimateOptimizedSize(baseStats, {
        enableDraco: true,
        simplifyRatio: 0.5,
        maxTextureSize: 512,
      });
      // Should be much smaller with all optimizations
      expect(estimated).toBeLessThan(baseStats.fileSize * 0.15);
    });
  });

  describe('getRecommendedOptimizations', () => {
    it('should always recommend Draco', () => {
      const stats: ModelStats = {
        fileSize: 1024 * 1024, // 1 MB
        triangleCount: 10000,
        vertexCount: 5000,
        textureCount: 1,
        animationCount: 0,
        boneCount: 0,
        meshCount: 1,
      };
      
      const options = getRecommendedOptimizations(stats, 500);
      expect(options.enableDraco).toBe(true);
    });

    it('should recommend aggressive optimization for large reduction', () => {
      const stats: ModelStats = {
        fileSize: 20 * 1024 * 1024, // 20 MB
        triangleCount: 100000,
        vertexCount: 50000,
        textureCount: 4,
        animationCount: 5,
        boneCount: 50,
        meshCount: 3,
      };
      
      const options = getRecommendedOptimizations(stats, 2000); // Need 10x reduction
      
      expect(options.maxTextureSize).toBe(512);
      expect(options.simplifyRatio).toBe(0.5);
    });

    it('should recommend LODs for very large models', () => {
      const stats: ModelStats = {
        fileSize: 15 * 1024 * 1024, // 15 MB
        triangleCount: 200000,
        vertexCount: 100000,
        textureCount: 4,
        animationCount: 5,
        boneCount: 50,
        meshCount: 5,
      };
      
      const options = getRecommendedOptimizations(stats, 5000);
      
      expect(options.generateLODs).toBe(true);
      expect(options.lodLevels).toBeGreaterThan(0);
    });

    it('should recommend lighter optimization for small reduction', () => {
      const stats: ModelStats = {
        fileSize: 6 * 1024 * 1024, // 6 MB
        triangleCount: 30000,
        vertexCount: 15000,
        textureCount: 2,
        animationCount: 3,
        boneCount: 25,
        meshCount: 2,
      };
      
      const options = getRecommendedOptimizations(stats, 5000); // Need 1.2x reduction
      
      expect(options.maxTextureSize).toBeGreaterThanOrEqual(1024);
      expect(options.simplifyRatio).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe('optimization workflow', () => {
    it('should provide complete optimization workflow', () => {
      const stats: ModelStats = {
        fileSize: 10 * 1024 * 1024,
        triangleCount: 50000,
        vertexCount: 25000,
        textureCount: 2,
        animationCount: 3,
        boneCount: 25,
        meshCount: 2,
      };
      
      // Get recommendations
      const options = getRecommendedOptimizations(stats, 2000);
      
      // Estimate result
      const estimated = estimateOptimizedSize(stats, options);
      
      // Should get reasonably close to target
      expect(estimated).toBeLessThan(2000 * 1024 * 1.5); // Within 150% of target
    });
  });
});
