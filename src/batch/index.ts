import fs from 'fs/promises';
import path from 'path';
import { generateImage, ImageProvider } from '../image-gen/index.js';
import { createAnimationBatch, VideoProvider } from '../video-gen/index.js';
import { generateAndRig3DModel, RiggingProvider } from '../rigging/index.js';
import { exportForThreeJS } from '../threejs-export/index.js';
import type { CharacterStyle, AnimationType, SkeletonType, PipelineResult } from '../types.js';

export interface BatchCharacterConfig {
  name: string;
  prompt: string;
  style?: CharacterStyle;
  animations?: AnimationType[];
  skeleton?: SkeletonType;
}

export interface BatchConfig {
  characters: BatchCharacterConfig[];
  outputDir: string;
  defaults?: {
    style?: CharacterStyle;
    animations?: AnimationType[];
    skeleton?: SkeletonType;
  };
  providers?: {
    image?: ImageProvider;
    video?: VideoProvider;
    rigging?: RiggingProvider;
  };
  options?: {
    concurrency?: number;
    continueOnError?: boolean;
    skipAnimation?: boolean;
    skipRigging?: boolean;
  };
}

export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    name: string;
    success: boolean;
    result?: PipelineResult;
    error?: string;
    duration: number;
  }>;
  totalDuration: number;
}

export async function runBatchGeneration(config: BatchConfig): Promise<BatchResult> {
  const startTime = Date.now();
  const {
    characters,
    outputDir,
    defaults = {},
    providers = {},
    options = {},
  } = config;

  const {
    concurrency = 1,
    continueOnError = true,
    skipAnimation = false,
    skipRigging = false,
  } = options;

  console.log(`[Batch] Starting batch generation of ${characters.length} characters`);
  console.log(`[Batch] Output directory: ${outputDir}`);
  console.log(`[Batch] Concurrency: ${concurrency}`);

  await fs.mkdir(outputDir, { recursive: true });

  const results: BatchResult['results'] = [];
  let successful = 0;
  let failed = 0;

  // Process characters with concurrency limit
  const chunks = chunkArray(characters, concurrency);

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (charConfig) => {
        const charStartTime = Date.now();
        const charName = charConfig.name || sanitizeName(charConfig.prompt);

        console.log(`[Batch] Processing: ${charName}`);

        try {
          const result = await generateSingleCharacter({
            ...charConfig,
            name: charName,
            style: charConfig.style || defaults.style || 'pixel',
            animations: charConfig.animations || defaults.animations || ['idle'],
            skeleton: charConfig.skeleton || defaults.skeleton || 'biped',
          }, {
            outputDir: path.join(outputDir, charName),
            providers,
            skipAnimation,
            skipRigging,
          });

          successful++;
          console.log(`[Batch] ✓ Completed: ${charName}`);

          return {
            name: charName,
            success: true,
            result,
            duration: Date.now() - charStartTime,
          };
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Batch] ✗ Failed: ${charName} - ${errorMessage}`);

          if (!continueOnError) {
            throw error;
          }

          return {
            name: charName,
            success: false,
            error: errorMessage,
            duration: Date.now() - charStartTime,
          };
        }
      })
    );

    results.push(...chunkResults);
  }

  const totalDuration = Date.now() - startTime;

  // Generate batch summary
  const summary: BatchResult = {
    total: characters.length,
    successful,
    failed,
    results,
    totalDuration,
  };

  // Save batch report
  const reportPath = path.join(outputDir, 'batch-report.json');
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));

  console.log('\n[Batch] Generation complete!');
  console.log(`[Batch] Total: ${summary.total}, Success: ${successful}, Failed: ${failed}`);
  console.log(`[Batch] Total time: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`[Batch] Report saved to: ${reportPath}`);

  return summary;
}

interface SingleCharacterOptions {
  outputDir: string;
  providers: {
    image?: ImageProvider;
    video?: VideoProvider;
    rigging?: RiggingProvider;
  };
  skipAnimation: boolean;
  skipRigging: boolean;
}

async function generateSingleCharacter(
  config: BatchCharacterConfig & { style: CharacterStyle; animations: AnimationType[]; skeleton: SkeletonType },
  options: SingleCharacterOptions
): Promise<PipelineResult> {
  const { outputDir, providers, skipAnimation, skipRigging } = options;

  await fs.mkdir(outputDir, { recursive: true });

  // Step 1: Generate image
  const imageResult = await generateImage(
    config.prompt,
    config.style,
    outputDir,
    { provider: providers.image }
  );

  // Step 2: Animate (optional)
  let videoResults: PipelineResult['videoGen'] = [];
  if (!skipAnimation) {
    try {
      videoResults = await createAnimationBatch(
        imageResult.imagePath,
        config.animations,
        outputDir,
        { provider: providers.video }
      );
    } catch (_error) {
      console.warn(`[Batch] Animation failed for ${config.name}, continuing...`);
    }
  }

  // Step 3: 3D Rigging (optional)
  let riggingResult: PipelineResult['rigging'] = {
    modelPath: '',
    riggedModelPath: '',
    skeletonType: config.skeleton,
    boneCount: 0,
  };

  let exportResult: PipelineResult['export'] = {
    glbPath: '',
    previewPath: '',
    fileSize: 0,
    animations: config.animations,
  };

  if (!skipRigging) {
    riggingResult = await generateAndRig3DModel(
      imageResult.imagePath,
      outputDir,
      { skeletonType: config.skeleton, provider: providers.rigging }
    );

    exportResult = await exportForThreeJS(
      riggingResult.riggedModelPath,
      outputDir,
      { animations: config.animations }
    );
  }

  const result: PipelineResult = {
    characterName: config.name,
    imageGen: imageResult,
    videoGen: videoResults,
    rigging: riggingResult,
    export: exportResult,
    metadata: {
      createdAt: new Date().toISOString(),
      totalDuration: 0,
      config: {
        prompt: config.prompt,
        style: config.style,
        animations: config.animations,
        resolution: 512,
        skeleton: config.skeleton,
        outputDir,
      },
    },
  };

  // Save individual metadata
  const metadataPath = path.join(outputDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(result, null, 2));

  return result;
}

export async function loadBatchConfig(configPath: string): Promise<BatchConfig> {
  const content = await fs.readFile(configPath, 'utf-8');
  const ext = path.extname(configPath).toLowerCase();

  if (ext === '.json') {
    return JSON.parse(content);
  } else if (ext === '.yaml' || ext === '.yml') {
    // Basic YAML parsing (for simple configs)
    // In production, use a proper YAML parser
    throw new Error('YAML config not yet supported. Use JSON format.');
  }

  throw new Error(`Unsupported config format: ${ext}`);
}

export function validateBatchConfig(config: unknown): config is BatchConfig {
  if (!config || typeof config !== 'object') return false;
  
  const c = config as Record<string, unknown>;
  
  if (!Array.isArray(c.characters)) return false;
  if (typeof c.outputDir !== 'string') return false;
  
  for (const char of c.characters) {
    if (!char || typeof char !== 'object') return false;
    if (typeof (char as Record<string, unknown>).prompt !== 'string') return false;
  }
  
  return true;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sanitizeName(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 30);
}

export function createBatchConfigTemplate(): BatchConfig {
  return {
    characters: [
      {
        name: 'knight',
        prompt: 'cute pixel art knight with sword and shield',
        style: 'pixel',
        animations: ['idle', 'walk', 'attack'],
        skeleton: 'biped',
      },
      {
        name: 'wizard',
        prompt: 'anime wizard with magical staff',
        style: 'anime',
        animations: ['idle', 'walk'],
        skeleton: 'biped',
      },
      {
        name: 'dragon',
        prompt: 'cute pixel dragon breathing fire',
        style: 'pixel',
        animations: ['idle', 'walk'],
        skeleton: 'quadruped',
      },
    ],
    outputDir: './output/batch',
    defaults: {
      style: 'pixel',
      animations: ['idle'],
      skeleton: 'biped',
    },
    providers: {
      image: 'openai',
      video: 'veo',
      rigging: 'tripo',
    },
    options: {
      concurrency: 2,
      continueOnError: true,
      skipAnimation: false,
      skipRigging: false,
    },
  };
}
