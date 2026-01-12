export interface APIProviderLimits {
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  tokensPerMinute?: number;
  concurrentRequests?: number;
}

export interface CostEstimate {
  provider: string;
  operation: string;
  units: number;
  unitPrice: number;
  currency: string;
  estimatedCost: number;
}

export interface PipelineCostEstimate {
  imageGeneration: CostEstimate;
  videoAnimation: CostEstimate;
  rigging3D: CostEstimate;
  total: number;
  currency: string;
}

// Pricing data (as of 2026-01)
const PRICING = {
  openai: {
    'dall-e-3': { standard: 0.04, hd: 0.08 }, // per image
    'gpt-4-vision': { input: 0.01, output: 0.03 }, // per 1k tokens
  },
  stability: {
    'sd-xl': 0.002, // per step (typically 30-50 steps)
    'sd-3': 0.025, // per image
  },
  google: {
    'veo-3.1': 0.05, // per second of video
    'veo-2': 0.03,
  },
  runway: {
    'gen-3-alpha': 0.10, // per second
    'gen-2': 0.05,
  },
  tripo: {
    'image-to-3d': 0.15, // per model
    'rigging': 0.10, // per model
    'texturing': 0.05,
  },
};

// Rate limits
const RATE_LIMITS: Record<string, APIProviderLimits> = {
  openai: {
    requestsPerMinute: 60,
    requestsPerDay: 10000,
    tokensPerMinute: 90000,
    concurrentRequests: 5,
  },
  stability: {
    requestsPerMinute: 150,
    concurrentRequests: 10,
  },
  google: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    concurrentRequests: 5,
  },
  runway: {
    requestsPerMinute: 20,
    requestsPerHour: 100,
    concurrentRequests: 3,
  },
  tripo: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    concurrentRequests: 5,
  },
};

export class RateLimiter {
  private queues: Map<string, number[]> = new Map();
  private windowMs: number;

  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;
  }

  async acquire(provider: string): Promise<void> {
    const limits = RATE_LIMITS[provider];
    if (!limits) {
      return; // No limits defined
    }

    const now = Date.now();
    const queue = this.queues.get(provider) || [];
    
    // Clean old entries
    const validQueue = queue.filter(t => now - t < this.windowMs);
    
    if (validQueue.length >= limits.requestsPerMinute) {
      // Need to wait
      const oldestEntry = validQueue[0];
      const waitTime = this.windowMs - (now - oldestEntry);
      console.log(`[RateLimit] ${provider}: waiting ${(waitTime / 1000).toFixed(1)}s...`);
      await this.sleep(waitTime);
      return this.acquire(provider);
    }
    
    validQueue.push(now);
    this.queues.set(provider, validQueue);
  }

  release(_provider: string): void {
    // No explicit release needed for time-window rate limiting
  }

  getStatus(provider: string): { used: number; limit: number; resetIn: number } {
    const limits = RATE_LIMITS[provider];
    if (!limits) {
      return { used: 0, limit: Infinity, resetIn: 0 };
    }

    const now = Date.now();
    const queue = this.queues.get(provider) || [];
    const validQueue = queue.filter(t => now - t < this.windowMs);

    const oldestEntry = validQueue[0] || now;
    const resetIn = Math.max(0, this.windowMs - (now - oldestEntry));

    return {
      used: validQueue.length,
      limit: limits.requestsPerMinute,
      resetIn,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function estimateImageGenCost(
  provider: 'openai' | 'stability' | 'pixellab',
  count: number = 1,
  quality: 'standard' | 'hd' = 'standard'
): CostEstimate {
  let unitPrice = 0;
  let operation = 'image-generation';

  switch (provider) {
    case 'openai':
      unitPrice = quality === 'hd' ? PRICING.openai['dall-e-3'].hd : PRICING.openai['dall-e-3'].standard;
      operation = `dall-e-3-${quality}`;
      break;
    case 'stability':
      unitPrice = PRICING.stability['sd-3'];
      operation = 'sd-3';
      break;
    case 'pixellab':
      unitPrice = 0.02; // Estimated
      operation = 'pixellab';
      break;
  }

  return {
    provider,
    operation,
    units: count,
    unitPrice,
    currency: 'USD',
    estimatedCost: count * unitPrice,
  };
}

export function estimateVideoCost(
  provider: 'veo' | 'runway' | 'placeholder',
  durationSeconds: number,
  animationCount: number = 1
): CostEstimate {
  let unitPrice = 0;
  let operation = 'video-generation';

  switch (provider) {
    case 'veo':
      unitPrice = PRICING.google['veo-3.1'];
      operation = 'veo-3.1';
      break;
    case 'runway':
      unitPrice = PRICING.runway['gen-3-alpha'];
      operation = 'gen-3-alpha';
      break;
    case 'placeholder':
      unitPrice = 0;
      operation = 'placeholder';
      break;
  }

  const totalSeconds = durationSeconds * animationCount;

  return {
    provider,
    operation,
    units: totalSeconds,
    unitPrice,
    currency: 'USD',
    estimatedCost: totalSeconds * unitPrice,
  };
}

export function estimateRiggingCost(
  provider: 'tripo' | 'placeholder'
): CostEstimate {
  let cost = 0;
  let operation = '3d-rigging';

  switch (provider) {
    case 'tripo':
      cost = PRICING.tripo['image-to-3d'] + PRICING.tripo['rigging'];
      operation = 'tripo-full';
      break;
    case 'placeholder':
      cost = 0;
      operation = 'placeholder';
      break;
  }

  return {
    provider,
    operation,
    units: 1,
    unitPrice: cost,
    currency: 'USD',
    estimatedCost: cost,
  };
}

export interface PipelineEstimateOptions {
  imageProvider: 'openai' | 'stability' | 'pixellab';
  videoProvider: 'veo' | 'runway' | 'placeholder';
  riggingProvider: 'tripo' | 'placeholder';
  animationCount: number;
  animationDuration: number;
  imageQuality?: 'standard' | 'hd';
}

export function estimatePipelineCost(options: PipelineEstimateOptions): PipelineCostEstimate {
  const imageGen = estimateImageGenCost(options.imageProvider, 1, options.imageQuality);
  const videoGen = estimateVideoCost(options.videoProvider, options.animationDuration, options.animationCount);
  const rigging = estimateRiggingCost(options.riggingProvider);

  return {
    imageGeneration: imageGen,
    videoAnimation: videoGen,
    rigging3D: rigging,
    total: imageGen.estimatedCost + videoGen.estimatedCost + rigging.estimatedCost,
    currency: 'USD',
  };
}

export function estimateBatchCost(
  characterCount: number,
  options: PipelineEstimateOptions
): { perCharacter: PipelineCostEstimate; total: number } {
  const perCharacter = estimatePipelineCost(options);
  return {
    perCharacter,
    total: perCharacter.total * characterCount,
  };
}

export function formatCost(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

export function getRateLimits(provider: string): APIProviderLimits | undefined {
  return RATE_LIMITS[provider];
}

export function getAllProviderPricing(): typeof PRICING {
  return PRICING;
}
