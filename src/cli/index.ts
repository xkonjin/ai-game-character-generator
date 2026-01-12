#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import ora from 'ora';
import { generateImage, getSupportedProviders as getImageProviders, ImageProvider } from '../image-gen/index.js';
import { createAnimationBatch, getAnimationTypes, getSupportedProviders as getVideoProviders, VideoProvider } from '../video-gen/index.js';
import { generateAndRig3DModel, getSkeletonTypes, getSupportedProviders as getRiggingProviders, RiggingProvider, checkTripoApiKey } from '../rigging/index.js';
import { exportForThreeJS, getExportFormats } from '../threejs-export/index.js';
import type { 
  CharacterStyle, 
  AnimationType, 
  SkeletonType, 
  PipelineResult,
  GenerationConfig,
  VideoGenResult
} from '../types.js';

dotenv.config();

const VERSION = '1.0.0';
const STYLES: CharacterStyle[] = ['pixel', 'anime', 'lowpoly', 'painterly', 'voxel'];

const program = new Command();

program
  .name('ai-game-character')
  .description(`
🎮 AI Game Character Generator

Generate animated 3D game characters from text descriptions using AI.

Pipeline: Image Generation → Video Animation → 3D Rigging → Three.js Export

Examples:
  $ ai-game-character generate -p "cute pixel knight" -s pixel -a idle,walk
  $ ai-game-character image-gen -p "anime wizard" -s anime
  $ ai-game-character rig-3d -i ./sprite.png -k biped
  `.trim())
  .version(VERSION, '-v, --version', 'Output version number')
  .option('--verbose', 'Enable verbose output')
  .option('--json', 'Output results as JSON')
  .option('--quiet', 'Suppress non-essential output');

// Generate command - full pipeline
program
  .command('generate')
  .description('Run the full character generation pipeline')
  .requiredOption('-p, --prompt <string>', 'Character description (required)')
  .option('-s, --style <style>', `Art style: ${STYLES.join(', ')}`, 'pixel')
  .option('-a, --animations <types>', `Animation types: ${getAnimationTypes().join(', ')}`, 'idle')
  .option('-r, --resolution <number>', 'Output resolution (256-2048)', '512')
  .option('-k, --skeleton <type>', `Skeleton type: ${getSkeletonTypes().join(', ')}`, 'biped')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--image-provider <provider>', `Image provider: ${getImageProviders().join(', ')}`, 'openai')
  .option('--video-provider <provider>', `Video provider: ${getVideoProviders().join(', ')}`, 'veo')
  .option('--rigging-provider <provider>', `Rigging provider: ${getRiggingProviders().join(', ')}`, 'tripo')
  .option('--skip-animation', 'Skip animation generation')
  .option('--skip-rigging', 'Skip 3D rigging')
  .action(async (options) => {
    const verbose = program.opts().verbose;
    const jsonOutput = program.opts().json;
    const quiet = program.opts().quiet;

    // Validate options
    if (!STYLES.includes(options.style)) {
      console.error(`Invalid style: ${options.style}. Valid styles: ${STYLES.join(', ')}`);
      process.exit(1);
    }

    const animations = options.animations.split(',').map((a: string) => a.trim()) as AnimationType[];
    const invalidAnims = animations.filter(a => !getAnimationTypes().includes(a));
    if (invalidAnims.length > 0) {
      console.error(`Invalid animations: ${invalidAnims.join(', ')}. Valid: ${getAnimationTypes().join(', ')}`);
      process.exit(1);
    }

    const config: GenerationConfig = {
      prompt: options.prompt,
      style: options.style as CharacterStyle,
      animations,
      resolution: parseInt(options.resolution),
      skeleton: options.skeleton as SkeletonType,
      outputDir: options.output,
    };

    const result = await runFullPipeline(config, {
      verbose,
      jsonOutput,
      quiet,
      imageProvider: options.imageProvider as ImageProvider,
      videoProvider: options.videoProvider as VideoProvider,
      riggingProvider: options.riggingProvider as RiggingProvider,
      skipAnimation: options.skipAnimation,
      skipRigging: options.skipRigging,
    });

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    }
  });

// Image generation command
program
  .command('image-gen')
  .description('Generate character sprite only')
  .requiredOption('-p, --prompt <string>', 'Character description')
  .option('-s, --style <style>', `Art style: ${STYLES.join(', ')}`, 'pixel')
  .option('-r, --resolution <number>', 'Output resolution', '512')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--provider <provider>', `Provider: ${getImageProviders().join(', ')}`, 'openai')
  .action(async (options) => {
    const jsonOutput = program.opts().json;
    const spinner = ora('Generating character sprite...').start();
    
    try {
      const result = await generateImage(
        options.prompt,
        options.style as CharacterStyle,
        options.output,
        { 
          resolution: parseInt(options.resolution),
          provider: options.provider as ImageProvider,
        }
      );
      
      spinner.succeed(`Sprite saved to ${result.imagePath}`);
      
      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// Animation command
program
  .command('animate')
  .description('Animate an existing sprite')
  .requiredOption('-i, --input <path>', 'Path to sprite image')
  .option('-t, --types <types>', `Animation types: ${getAnimationTypes().join(', ')}`, 'idle')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--provider <provider>', `Provider: ${getVideoProviders().join(', ')}`, 'veo')
  .action(async (options) => {
    const jsonOutput = program.opts().json;
    const spinner = ora('Creating animations...').start();
    
    try {
      const animations = options.types.split(',').map((a: string) => a.trim()) as AnimationType[];
      const results = await createAnimationBatch(
        options.input, 
        animations, 
        options.output,
        { provider: options.provider as VideoProvider }
      );
      
      spinner.succeed(`Created ${results.length} animations`);
      
      if (jsonOutput) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        results.forEach(r => console.log(`  - ${r.animationType}: ${r.videoPath}`));
      }
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// 3D Rigging command
program
  .command('rig-3d')
  .description('Convert sprite to rigged 3D model')
  .requiredOption('-i, --input <path>', 'Path to sprite or animation')
  .option('-k, --skeleton <type>', `Skeleton type: ${getSkeletonTypes().join(', ')}`, 'biped')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--provider <provider>', `Provider: ${getRiggingProviders().join(', ')}`, 'tripo')
  .option('--face-limit <number>', 'Max faces in model', '10000')
  .action(async (options) => {
    const jsonOutput = program.opts().json;
    const spinner = ora('Generating 3D model and rigging...').start();
    
    try {
      const result = await generateAndRig3DModel(
        options.input,
        options.output,
        { 
          skeletonType: options.skeleton as SkeletonType,
          provider: options.provider as RiggingProvider,
          faceLimit: parseInt(options.faceLimit),
        }
      );
      
      spinner.succeed(`Rigged model saved to ${result.riggedModelPath}`);
      
      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`  - Base model: ${result.modelPath}`);
        console.log(`  - Bones: ${result.boneCount}`);
      }
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export model for Three.js')
  .requiredOption('-i, --input <path>', 'Path to rigged model')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-f, --format <format>', `Format: ${getExportFormats().join(', ')}`, 'glb')
  .option('--no-optimize', 'Disable optimization')
  .action(async (options) => {
    const jsonOutput = program.opts().json;
    const spinner = ora('Exporting for Three.js...').start();
    
    try {
      const result = await exportForThreeJS(options.input, options.output, {
        optimize: options.optimize !== false,
        format: options.format,
      });
      
      spinner.succeed('Export complete');
      
      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`  - GLB: ${result.glbPath} (${(result.fileSize / 1024).toFixed(1)}KB)`);
        console.log(`  - Preview: ${result.previewPath}`);
      }
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// List command - show available options
program
  .command('list')
  .description('List available styles, animations, and providers')
  .option('--styles', 'List art styles')
  .option('--animations', 'List animation types')
  .option('--skeletons', 'List skeleton types')
  .option('--providers', 'List all providers')
  .action((options) => {
    const all = !options.styles && !options.animations && !options.skeletons && !options.providers;
    
    if (all || options.styles) {
      console.log('\n📎 Art Styles:');
      STYLES.forEach(s => console.log(`  - ${s}`));
    }
    
    if (all || options.animations) {
      console.log('\n🎬 Animation Types:');
      getAnimationTypes().forEach(a => console.log(`  - ${a}`));
    }
    
    if (all || options.skeletons) {
      console.log('\n🦴 Skeleton Types:');
      getSkeletonTypes().forEach(s => console.log(`  - ${s}`));
    }
    
    if (all || options.providers) {
      console.log('\n🔌 Providers:');
      console.log('  Image:', getImageProviders().join(', '));
      console.log('  Video:', getVideoProviders().join(', '));
      console.log('  Rigging:', getRiggingProviders().join(', '));
    }
    
    console.log('');
  });

// Check command - verify API keys
program
  .command('check')
  .description('Check API key configuration')
  .action(async () => {
    console.log('\n🔑 API Key Status:\n');
    
    const keys = [
      { name: 'OPENAI_API_KEY', label: 'OpenAI (Image Gen)' },
      { name: 'STABILITY_API_KEY', label: 'Stability AI' },
      { name: 'GOOGLE_API_KEY', label: 'Google (Veo)' },
      { name: 'TRIPO_API_KEY', label: 'Tripo (3D Rigging)' },
    ];
    
    for (const key of keys) {
      const value = process.env[key.name];
      const status = value ? '✅ Configured' : '❌ Not set';
      console.log(`  ${key.label}: ${status}`);
    }
    
    console.log('\n🌐 API Connectivity:\n');
    
    const tripoStatus = await checkTripoApiKey();
    console.log(`  Tripo API: ${tripoStatus ? '✅ Connected' : '❌ Not connected'}`);
    
    console.log('\n📝 Set API keys in .env file or environment variables.');
    console.log('');
  });

interface PipelineOptions {
  verbose: boolean;
  jsonOutput: boolean;
  quiet: boolean;
  imageProvider: ImageProvider;
  videoProvider: VideoProvider;
  riggingProvider: RiggingProvider;
  skipAnimation: boolean;
  skipRigging: boolean;
}

async function runFullPipeline(
  config: GenerationConfig, 
  options: PipelineOptions
): Promise<PipelineResult> {
  const { verbose, quiet, skipAnimation, skipRigging, imageProvider, videoProvider, riggingProvider } = options;
  
  const startTime = Date.now();
  const characterName = config.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 30);
  
  const outputDir = path.join(config.outputDir, characterName);
  await fs.mkdir(outputDir, { recursive: true });

  if (!quiet) {
    console.log('\n🎮 AI Game Character Generator');
    console.log('================================');
    console.log(`Character: ${config.prompt}`);
    console.log(`Style: ${config.style}`);
    if (!skipAnimation) console.log(`Animations: ${config.animations.join(', ')}`);
    console.log(`Output: ${outputDir}`);
    if (verbose) {
      console.log(`Image Provider: ${imageProvider}`);
      console.log(`Video Provider: ${videoProvider}`);
      console.log(`Rigging Provider: ${riggingProvider}`);
    }
    console.log('');
  }

  const totalSteps = skipAnimation && skipRigging ? 1 : skipAnimation ? 2 : skipRigging ? 2 : 4;
  let currentStep = 0;

  // Step 1: Image Generation
  currentStep++;
  let spinner = ora(`Step ${currentStep}/${totalSteps}: Generating character sprite...`).start();
  let imageResult;
  try {
    imageResult = await generateImage(config.prompt, config.style, outputDir, {
      resolution: config.resolution,
      provider: imageProvider,
    });
    spinner.succeed('Sprite generated');
    if (verbose) console.log(`  → ${imageResult.imagePath}`);
  } catch (error) {
    spinner.fail('Sprite generation failed');
    throw error;
  }

  // Step 2: Animation (optional)
  let videoResults: VideoGenResult[] = [];
  if (!skipAnimation) {
    currentStep++;
    spinner = ora(`Step ${currentStep}/${totalSteps}: Creating animations...`).start();
    try {
      videoResults = await createAnimationBatch(
        imageResult.imagePath,
        config.animations,
        outputDir,
        { provider: videoProvider }
      );
      spinner.succeed(`${videoResults.length} animations created`);
      if (verbose) videoResults.forEach(r => console.log(`  → ${r.videoPath}`));
    } catch (_error) {
      spinner.warn('Animation generation failed, continuing...');
      videoResults = [];
    }
  }

  // Step 3: 3D Rigging (optional)
  let riggingResult = {
    modelPath: '',
    riggedModelPath: '',
    skeletonType: config.skeleton,
    boneCount: 0,
  };
  
  if (!skipRigging) {
    currentStep++;
    spinner = ora(`Step ${currentStep}/${totalSteps}: Generating 3D model...`).start();
    try {
      riggingResult = await generateAndRig3DModel(
        imageResult.imagePath,
        outputDir,
        { skeletonType: config.skeleton, provider: riggingProvider }
      );
      spinner.succeed('3D model rigged');
      if (verbose) console.log(`  → ${riggingResult.riggedModelPath} (${riggingResult.boneCount} bones)`);
    } catch (error) {
      spinner.fail('3D rigging failed');
      throw error;
    }

    // Step 4: Export
    currentStep++;
    spinner = ora(`Step ${currentStep}/${totalSteps}: Exporting for Three.js...`).start();
    try {
      await exportForThreeJS(
        riggingResult.riggedModelPath,
        outputDir,
        { animations: config.animations }
      );
      spinner.succeed('Export complete');
    } catch (error) {
      spinner.fail('Export failed');
      throw error;
    }
  }

  const totalDuration = (Date.now() - startTime) / 1000;

  const result: PipelineResult = {
    characterName,
    imageGen: imageResult,
    videoGen: videoResults,
    rigging: riggingResult,
    export: {
      glbPath: riggingResult.riggedModelPath,
      previewPath: path.join(outputDir, 'preview.html'),
      fileSize: 0,
      animations: config.animations,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      totalDuration,
      config,
    },
  };

  const metadataPath = path.join(outputDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(result, null, 2));

  if (!quiet && !options.jsonOutput) {
    console.log('\n✅ Character generation complete!');
    console.log('================================');
    console.log(`📁 Output: ${outputDir}`);
    console.log(`🖼️  Sprite: ${imageResult.imagePath}`);
    if (!skipAnimation) console.log(`🎬 Animations: ${videoResults.length} clips`);
    if (!skipRigging) {
      console.log(`🦴 3D Model: ${riggingResult.riggedModelPath}`);
      console.log(`🌐 Preview: ${path.join(outputDir, 'preview.html')}`);
    }
    console.log(`⏱️  Total time: ${totalDuration.toFixed(1)}s`);
    
    if (!skipRigging) {
      console.log('\n📋 Integration code saved to:');
      console.log(`  - ${path.join(outputDir, 'integration.js')}`);
      console.log(`  - ${path.join(outputDir, 'CharacterViewer.tsx')}`);
    }
  }

  return result;
}

program.parse();
