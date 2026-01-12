import { describe, it, expect } from 'vitest';
import { 
  RateLimiter,
  estimateImageGenCost,
  estimateVideoCost,
  estimateRiggingCost,
  estimatePipelineCost,
  estimateBatchCost,
  formatCost,
  getRateLimits,
} from '../src/rate-limit/index.js';

describe('Rate Limiting Module', () => {
  describe('RateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter(60000);
      
      // First request should be instant
      const start = Date.now();
      await limiter.acquire('openai');
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(100);
    });

    it('should track request status', async () => {
      const limiter = new RateLimiter(60000);
      
      await limiter.acquire('openai');
      await limiter.acquire('openai');
      
      const status = limiter.getStatus('openai');
      
      expect(status.used).toBe(2);
      expect(status.limit).toBe(60);
    });

    it('should return unlimited for unknown providers', () => {
      const limiter = new RateLimiter();
      const status = limiter.getStatus('unknown-provider');
      
      expect(status.limit).toBe(Infinity);
    });
  });

  describe('estimateImageGenCost', () => {
    it('should estimate OpenAI standard cost', () => {
      const estimate = estimateImageGenCost('openai', 5, 'standard');
      
      expect(estimate.provider).toBe('openai');
      expect(estimate.units).toBe(5);
      expect(estimate.estimatedCost).toBe(5 * 0.04);
      expect(estimate.currency).toBe('USD');
    });

    it('should estimate OpenAI HD cost', () => {
      const estimate = estimateImageGenCost('openai', 3, 'hd');
      
      expect(estimate.estimatedCost).toBe(3 * 0.08);
    });

    it('should estimate Stability cost', () => {
      const estimate = estimateImageGenCost('stability', 10);
      
      expect(estimate.provider).toBe('stability');
      expect(estimate.estimatedCost).toBe(10 * 0.025);
    });

    it('should estimate PixelLab cost', () => {
      const estimate = estimateImageGenCost('pixellab', 5);
      
      expect(estimate.provider).toBe('pixellab');
      expect(estimate.estimatedCost).toBeGreaterThan(0);
    });
  });

  describe('estimateVideoCost', () => {
    it('should estimate Veo cost', () => {
      const estimate = estimateVideoCost('veo', 4, 3);
      
      expect(estimate.provider).toBe('veo');
      expect(estimate.units).toBe(12); // 4 seconds * 3 animations
      expect(estimate.estimatedCost).toBe(12 * 0.05);
    });

    it('should estimate Runway cost', () => {
      const estimate = estimateVideoCost('runway', 4, 2);
      
      expect(estimate.provider).toBe('runway');
      expect(estimate.units).toBe(8);
      expect(estimate.estimatedCost).toBe(8 * 0.10);
    });

    it('should estimate placeholder as free', () => {
      const estimate = estimateVideoCost('placeholder', 10, 5);
      
      expect(estimate.estimatedCost).toBe(0);
    });
  });

  describe('estimateRiggingCost', () => {
    it('should estimate Tripo cost', () => {
      const estimate = estimateRiggingCost('tripo');
      
      expect(estimate.provider).toBe('tripo');
      expect(estimate.estimatedCost).toBe(0.25); // 0.15 + 0.10
    });

    it('should estimate placeholder as free', () => {
      const estimate = estimateRiggingCost('placeholder');
      
      expect(estimate.estimatedCost).toBe(0);
    });
  });

  describe('estimatePipelineCost', () => {
    it('should estimate full pipeline cost', () => {
      const estimate = estimatePipelineCost({
        imageProvider: 'openai',
        videoProvider: 'veo',
        riggingProvider: 'tripo',
        animationCount: 3,
        animationDuration: 4,
      });
      
      expect(estimate.imageGeneration.estimatedCost).toBe(0.04);
      expect(estimate.videoAnimation.estimatedCost).toBe(12 * 0.05);
      expect(estimate.rigging3D.estimatedCost).toBe(0.25);
      expect(estimate.total).toBeCloseTo(0.04 + 0.60 + 0.25, 5);
      expect(estimate.currency).toBe('USD');
    });

    it('should handle placeholder providers', () => {
      const estimate = estimatePipelineCost({
        imageProvider: 'openai',
        videoProvider: 'placeholder',
        riggingProvider: 'placeholder',
        animationCount: 5,
        animationDuration: 4,
      });
      
      expect(estimate.total).toBe(0.04); // Only image generation
    });
  });

  describe('estimateBatchCost', () => {
    it('should multiply cost by character count', () => {
      const estimate = estimateBatchCost(10, {
        imageProvider: 'openai',
        videoProvider: 'veo',
        riggingProvider: 'tripo',
        animationCount: 2,
        animationDuration: 4,
      });
      
      const perChar = estimate.perCharacter.total;
      expect(estimate.total).toBe(perChar * 10);
    });
  });

  describe('formatCost', () => {
    it('should format USD', () => {
      expect(formatCost(1.5, 'USD')).toBe('$1.50');
      expect(formatCost(10.99)).toBe('$10.99');
    });

    it('should format other currencies', () => {
      expect(formatCost(1.5, 'EUR')).toBe('1.50 EUR');
    });
  });

  describe('getRateLimits', () => {
    it('should return limits for known providers', () => {
      const limits = getRateLimits('openai');
      
      expect(limits).toBeDefined();
      expect(limits?.requestsPerMinute).toBe(60);
    });

    it('should return undefined for unknown providers', () => {
      const limits = getRateLimits('unknown');
      
      expect(limits).toBeUndefined();
    });
  });
});
