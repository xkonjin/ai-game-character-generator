import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import type { CharacterStyle, ImageGenResult } from '../types.js';

export type ImageProvider = 'openai' | 'stability' | 'pixellab';

const STYLE_PROMPTS: Record<CharacterStyle, { prefix: string; suffix: string }> = {
  pixel: {
    prefix: 'pixel art sprite sheet, game asset, transparent background, ',
    suffix: ', 8-bit style, clean edges, no anti-aliasing, game-ready',
  },
  anime: {
    prefix: 'anime chibi character, game sprite, transparent background, ',
    suffix: ', cel shaded, cute proportions, high quality',
  },
  lowpoly: {
    prefix: 'low poly 3D character render, game asset, transparent background, ',
    suffix: ', flat shading, geometric, minimalist style',
  },
  painterly: {
    prefix: 'hand-painted fantasy character, game art, transparent background, ',
    suffix: ', stylized, vibrant colors, concept art quality',
  },
  voxel: {
    prefix: 'voxel art character, 3D cube style, game asset, transparent background, ',
    suffix: ', minecraft-like, blocky, isometric view',
  },
};

interface GenerateOptions {
  resolution?: number;
  provider?: ImageProvider;
  maxRetries?: number;
  retryDelay?: number;
}

export async function generateImage(
  prompt: string,
  style: CharacterStyle,
  outputDir: string,
  options: GenerateOptions = {}
): Promise<ImageGenResult> {
  const { 
    resolution = 512, 
    provider = 'openai',
    maxRetries = 3,
    retryDelay = 1000
  } = options;
  
  const stylePrompt = STYLE_PROMPTS[style];
  const fullPrompt = `${stylePrompt.prefix}${prompt}${stylePrompt.suffix}`;

  console.log(`[ImageGen] Generating ${style} character: "${prompt}"`);
  console.log(`[ImageGen] Provider: ${provider}, Resolution: ${resolution}`);

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result: ImageGenResult;
      
      switch (provider) {
        case 'openai':
          result = await generateWithOpenAI(fullPrompt, outputDir, resolution);
          break;
        case 'stability':
          result = await generateWithStability(fullPrompt, outputDir, resolution);
          break;
        case 'pixellab':
          result = await generateWithPixelLab(prompt, style, outputDir);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[ImageGen] Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[ImageGen] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Image generation failed after all retries');
}

async function generateWithOpenAI(
  prompt: string,
  outputDir: string,
  resolution: number
): Promise<ImageGenResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: resolution <= 512 ? '1024x1024' : '1792x1024',
    quality: 'hd',
    response_format: 'b64_json',
  });

  if (!response.data || response.data.length === 0) {
    throw new Error('No image data returned from OpenAI');
  }
  const imageData = response.data[0];
  if (!imageData.b64_json) {
    throw new Error('No base64 image data returned from OpenAI');
  }

  await fs.mkdir(outputDir, { recursive: true });
  const imagePath = path.join(outputDir, 'sprite.png');
  
  const buffer = Buffer.from(imageData.b64_json, 'base64');
  await fs.writeFile(imagePath, buffer);

  console.log(`[ImageGen] Saved sprite to ${imagePath}`);

  return {
    imagePath,
    prompt,
    provider: 'openai',
    metadata: {
      model: 'dall-e-3',
      revisedPrompt: imageData.revised_prompt,
      resolution,
    },
  };
}

async function generateWithStability(
  prompt: string,
  outputDir: string,
  resolution: number
): Promise<ImageGenResult> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('STABILITY_API_KEY environment variable is required');
  }

  const response = await axios.post(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: 7,
      height: Math.min(resolution, 1024),
      width: Math.min(resolution, 1024),
      samples: 1,
      steps: 30,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const artifacts = response.data.artifacts;
  if (!artifacts || artifacts.length === 0) {
    throw new Error('No image data returned from Stability AI');
  }

  await fs.mkdir(outputDir, { recursive: true });
  const imagePath = path.join(outputDir, 'sprite.png');
  
  const buffer = Buffer.from(artifacts[0].base64, 'base64');
  await fs.writeFile(imagePath, buffer);

  console.log(`[ImageGen] Saved sprite to ${imagePath}`);

  return {
    imagePath,
    prompt,
    provider: 'stability',
    metadata: {
      model: 'stable-diffusion-xl-1024-v1-0',
      seed: artifacts[0].seed,
      resolution,
    },
  };
}

async function generateWithPixelLab(
  prompt: string,
  style: CharacterStyle,
  outputDir: string
): Promise<ImageGenResult> {
  const apiKey = process.env.PIXELLAB_API_KEY;
  if (!apiKey) {
    throw new Error('PIXELLAB_API_KEY environment variable is required');
  }

  // PixelLab API endpoint - this is a placeholder as their API may differ
  const response = await axios.post(
    'https://api.pixellab.ai/v1/generate',
    {
      prompt,
      style: style === 'pixel' ? '8bit' : '16bit',
      width: 64,
      height: 64,
      animation: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.data.image) {
    throw new Error('No image data returned from PixelLab');
  }

  await fs.mkdir(outputDir, { recursive: true });
  const imagePath = path.join(outputDir, 'sprite.png');
  
  const buffer = Buffer.from(response.data.image, 'base64');
  await fs.writeFile(imagePath, buffer);

  console.log(`[ImageGen] Saved sprite to ${imagePath}`);

  return {
    imagePath,
    prompt,
    provider: 'pixellab',
    metadata: {
      model: 'pixellab-v1',
      style,
      resolution: 64,
    },
  };
}

export function optimizePrompt(userPrompt: string, style: CharacterStyle): string {
  const stylePrompt = STYLE_PROMPTS[style];
  return `${stylePrompt.prefix}${userPrompt}${stylePrompt.suffix}`;
}

export function getStylePrompts(): Record<CharacterStyle, { prefix: string; suffix: string }> {
  return { ...STYLE_PROMPTS };
}

export function getSupportedProviders(): ImageProvider[] {
  return ['openai', 'stability', 'pixellab'];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
