import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import type { CharacterStyle, ImageGenResult } from '../types.js';

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

export async function generateImage(
  prompt: string,
  style: CharacterStyle,
  outputDir: string,
  options: { resolution?: number; provider?: 'openai' | 'stability' } = {}
): Promise<ImageGenResult> {
  const { resolution = 512, provider = 'openai' } = options;
  const stylePrompt = STYLE_PROMPTS[style];
  const fullPrompt = `${stylePrompt.prefix}${prompt}${stylePrompt.suffix}`;

  console.log(`[ImageGen] Generating ${style} character: "${prompt}"`);
  console.log(`[ImageGen] Full prompt: ${fullPrompt}`);

  if (provider === 'openai') {
    return generateWithOpenAI(fullPrompt, outputDir, resolution);
  }
  
  throw new Error(`Provider ${provider} not implemented yet`);
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

export function optimizePrompt(userPrompt: string, style: CharacterStyle): string {
  const stylePrompt = STYLE_PROMPTS[style];
  return `${stylePrompt.prefix}${userPrompt}${stylePrompt.suffix}`;
}
