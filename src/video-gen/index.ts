import fs from 'fs/promises';
import path from 'path';
import type { AnimationType, VideoGenResult } from '../types.js';

export type VideoProvider = 'veo' | 'runway' | 'placeholder';

interface AnimationConfig {
  prompt: string;
  duration: string;
  fps: number;
}

const ANIMATION_PROMPTS: Record<AnimationType, AnimationConfig> = {
  idle: {
    prompt: 'subtle idle breathing animation, gentle swaying motion, seamless loop, character stays in place',
    duration: '4s',
    fps: 24,
  },
  walk: {
    prompt: 'walking animation cycle, smooth footsteps, 8-frame walk cycle, seamless loop, side view movement',
    duration: '4s',
    fps: 24,
  },
  run: {
    prompt: 'running animation, fast movement, dynamic pose, seamless loop, energetic motion',
    duration: '3s',
    fps: 30,
  },
  attack: {
    prompt: 'attack swing animation, weapon slash motion, return to idle pose, powerful strike',
    duration: '2s',
    fps: 30,
  },
  jump: {
    prompt: 'jumping animation, crouch to leap to landing, smooth arc, natural gravity',
    duration: '2s',
    fps: 24,
  },
  death: {
    prompt: 'death animation, dramatic fall, fade out effect, final pose',
    duration: '3s',
    fps: 24,
  },
  hurt: {
    prompt: 'hurt reaction animation, flinch backwards, brief recovery, return to stance',
    duration: '1s',
    fps: 24,
  },
};

interface AnimateOptions {
  duration?: string;
  provider?: VideoProvider;
  maxRetries?: number;
  retryDelay?: number;
}

export async function animateSprite(
  spritePath: string,
  animationType: AnimationType,
  outputDir: string,
  options: AnimateOptions = {}
): Promise<VideoGenResult> {
  const {
    duration,
    provider = 'veo',
    maxRetries = 3,
    retryDelay = 2000,
  } = options;

  const animConfig = ANIMATION_PROMPTS[animationType];
  const finalDuration = duration || animConfig.duration;

  console.log(`[VideoGen] Creating ${animationType} animation from ${spritePath}`);
  console.log(`[VideoGen] Provider: ${provider}, Duration: ${finalDuration}`);

  const imageBuffer = await fs.readFile(spritePath);
  const base64Image = imageBuffer.toString('base64');

  const animationDir = path.join(outputDir, 'animations');
  await fs.mkdir(animationDir, { recursive: true });

  const prompt = buildAnimationPrompt(animationType, animConfig);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let videoBuffer: Buffer;

      switch (provider) {
        case 'veo':
          videoBuffer = await generateWithVeo({
            prompt,
            image: base64Image,
            duration: finalDuration,
          });
          break;
        case 'runway':
          videoBuffer = await generateWithRunway({
            prompt,
            image: base64Image,
            duration: finalDuration,
          });
          break;
        case 'placeholder':
        default:
          videoBuffer = createPlaceholderVideo(animationType);
          break;
      }

      const videoPath = path.join(animationDir, `${animationType}.mp4`);
      await fs.writeFile(videoPath, videoBuffer);

      console.log(`[VideoGen] Saved ${animationType} animation to ${videoPath}`);

      return {
        videoPath,
        animationType,
        duration: parseDuration(finalDuration),
        fps: animConfig.fps,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[VideoGen] Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[VideoGen] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // Fallback to placeholder on failure
  console.warn('[VideoGen] All attempts failed, using placeholder video');
  const videoBuffer = createPlaceholderVideo(animationType);
  const videoPath = path.join(animationDir, `${animationType}.mp4`);
  await fs.writeFile(videoPath, videoBuffer);

  return {
    videoPath,
    animationType,
    duration: parseDuration(finalDuration),
    fps: animConfig.fps,
  };
}

function buildAnimationPrompt(animationType: AnimationType, config: AnimationConfig): string {
  const basePrompt = `Animate this character sprite: ${config.prompt}`;
  const constraints = 'Maintain character consistency, smooth motion, game-ready animation.';
  const style = `Animation type: ${animationType}, seamless looping required.`;
  
  return `${basePrompt}. ${constraints} ${style}`;
}

interface VeoGenerateParams {
  prompt: string;
  image: string;
  duration: string;
}

async function generateWithVeo(params: VeoGenerateParams): Promise<Buffer> {
  const { prompt, image, duration } = params;

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required for Veo');
  }

  // Veo 3.1 via Gemini API
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateContent';

  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/png',
            data: image,
          },
        },
      ],
    }],
    generationConfig: {
      responseModalities: ['VIDEO'],
      videoDuration: duration,
    },
  };

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Veo API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Extract video from response
  const videoData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!videoData) {
    throw new Error('No video data in Veo response');
  }

  return Buffer.from(videoData, 'base64');
}

async function generateWithRunway(params: VeoGenerateParams): Promise<Buffer> {
  const { prompt, image, duration } = params;

  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY environment variable is required for Runway');
  }

  // Runway Gen-3 Alpha API
  const response = await fetch('https://api.runwayml.com/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gen3a_turbo',
      prompt,
      init_image: `data:image/png;base64,${image}`,
      duration: parseDuration(duration),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Runway API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.video) {
    throw new Error('No video data in Runway response');
  }

  // Runway returns a URL, we need to download it
  const videoResponse = await fetch(data.video);
  if (!videoResponse.ok) {
    throw new Error('Failed to download video from Runway');
  }

  return Buffer.from(await videoResponse.arrayBuffer());
}

function createPlaceholderVideo(animationType: AnimationType): Buffer {
  // Create a minimal placeholder - in production this would be an actual video file
  const header = `PLACEHOLDER_VIDEO:${animationType}:${Date.now()}`;
  return Buffer.from(header);
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+(?:\.\d+)?)\s*s/i);
  return match ? parseFloat(match[1]) : 4;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createAnimationBatch(
  spritePath: string,
  animations: AnimationType[],
  outputDir: string,
  options: AnimateOptions = {}
): Promise<VideoGenResult[]> {
  const results: VideoGenResult[] = [];

  for (const animationType of animations) {
    try {
      const result = await animateSprite(spritePath, animationType, outputDir, options);
      results.push(result);
    } catch (error) {
      console.error(`[VideoGen] Failed to create ${animationType} animation:`, error);
      // Continue with other animations
    }
  }

  return results;
}

export function getAnimationTypes(): AnimationType[] {
  return Object.keys(ANIMATION_PROMPTS) as AnimationType[];
}

export function getAnimationConfig(animationType: AnimationType): AnimationConfig {
  return { ...ANIMATION_PROMPTS[animationType] };
}

export function getSupportedProviders(): VideoProvider[] {
  return ['veo', 'runway', 'placeholder'];
}
