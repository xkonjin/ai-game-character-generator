import fs from 'fs/promises';
import path from 'path';
import type { AnimationType, VideoGenResult } from '../types.js';

const ANIMATION_PROMPTS: Record<AnimationType, { prompt: string; duration: string }> = {
  idle: {
    prompt: 'subtle idle breathing animation, gentle swaying motion, seamless loop',
    duration: '4s',
  },
  walk: {
    prompt: 'walking animation cycle, smooth footsteps, 8-frame walk cycle, seamless loop',
    duration: '4s',
  },
  run: {
    prompt: 'running animation, fast movement, dynamic pose, seamless loop',
    duration: '3s',
  },
  attack: {
    prompt: 'attack swing animation, weapon slash motion, return to idle',
    duration: '2s',
  },
  jump: {
    prompt: 'jumping animation, crouch to leap to landing, smooth arc',
    duration: '2s',
  },
  death: {
    prompt: 'death animation, dramatic fall, fade out effect',
    duration: '3s',
  },
  hurt: {
    prompt: 'hurt reaction animation, flinch backwards, brief recovery',
    duration: '1s',
  },
};

interface VeoConfig {
  projectId: string;
  location: string;
  model: string;
}

export async function animateSprite(
  spritePath: string,
  animationType: AnimationType,
  outputDir: string,
  options: { duration?: string } = {}
): Promise<VideoGenResult> {
  const animConfig = ANIMATION_PROMPTS[animationType];
  const duration = options.duration || animConfig.duration;

  console.log(`[VideoGen] Creating ${animationType} animation from ${spritePath}`);
  console.log(`[VideoGen] Duration: ${duration}`);

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
  }

  const imageBuffer = await fs.readFile(spritePath);
  const base64Image = imageBuffer.toString('base64');

  const animationDir = path.join(outputDir, 'animations');
  await fs.mkdir(animationDir, { recursive: true });

  const result = await generateWithVeo({
    prompt: `Animate this character: ${animConfig.prompt}. Maintain character consistency, smooth motion.`,
    image: base64Image,
    duration,
    projectId,
  });

  const videoPath = path.join(animationDir, `${animationType}.mp4`);
  await fs.writeFile(videoPath, result.videoBuffer);

  console.log(`[VideoGen] Saved ${animationType} animation to ${videoPath}`);

  return {
    videoPath,
    animationType,
    duration: parseDuration(duration),
    fps: 24,
  };
}

interface VeoGenerateParams {
  prompt: string;
  image: string;
  duration: string;
  projectId: string;
}

async function generateWithVeo(params: VeoGenerateParams): Promise<{ videoBuffer: Buffer }> {
  const { prompt, image, duration, projectId } = params;
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateContent`;
  
  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        { 
          inlineData: {
            mimeType: 'image/png',
            data: image,
          }
        }
      ]
    }],
    generationConfig: {
      responseModalities: ['VIDEO'],
      videoDuration: duration,
    },
  };

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.log('[VideoGen] Warning: GOOGLE_API_KEY not set, using placeholder video');
    return { videoBuffer: createPlaceholderVideo() };
  }

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Veo API error: ${error}`);
  }

  const data = await response.json();
  
  if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    const videoBase64 = data.candidates[0].content.parts[0].inlineData.data;
    return { videoBuffer: Buffer.from(videoBase64, 'base64') };
  }

  throw new Error('No video data in Veo response');
}

function createPlaceholderVideo(): Buffer {
  return Buffer.from('PLACEHOLDER_VIDEO_DATA');
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)s/);
  return match ? parseInt(match[1], 10) : 4;
}

export async function createAnimationBatch(
  spritePath: string,
  animations: AnimationType[],
  outputDir: string
): Promise<VideoGenResult[]> {
  const results: VideoGenResult[] = [];
  
  for (const animationType of animations) {
    const result = await animateSprite(spritePath, animationType, outputDir);
    results.push(result);
  }
  
  return results;
}
