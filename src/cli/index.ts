#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import ora from 'ora';
import { generateImage } from '../image-gen/index.js';
import { createAnimationBatch } from '../video-gen/index.js';
import { generateAndRig3DModel } from '../rigging/index.js';
import { exportForThreeJS, generateThreeJSCode } from '../threejs-export/index.js';
import type { 
  CharacterStyle, 
  AnimationType, 
  SkeletonType, 
  PipelineResult,
  GenerationConfig,
  VideoGenResult
} from '../types.js';

dotenv.config();

const program = new Command();

program
  .name('ai-game-character')
  .description('AI-powered game character generation pipeline')
  .version('1.0.0');

program
  .command('generate')
  .description('Run the full character generation pipeline')
  .requiredOption('-p, --prompt <string>', 'Character description')
  .option('-s, --style <style>', 'Art style (pixel, anime, lowpoly, painterly, voxel)', 'pixel')
  .option('-a, --animations <types>', 'Comma-separated animation types', 'idle')
  .option('-r, --resolution <number>', 'Output resolution', '512')
  .option('-k, --skeleton <type>', 'Skeleton type (biped, quadruped, custom)', 'biped')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(async (options) => {
    const config: GenerationConfig = {
      prompt: options.prompt,
      style: options.style as CharacterStyle,
      animations: options.animations.split(',').map((a: string) => a.trim()) as AnimationType[],
      resolution: parseInt(options.resolution),
      skeleton: options.skeleton as SkeletonType,
      outputDir: options.output,
    };

    await runFullPipeline(config);
  });

program
  .command('image-gen')
  .description('Generate character sprite only')
  .requiredOption('-p, --prompt <string>', 'Character description')
  .option('-s, --style <style>', 'Art style', 'pixel')
  .option('-r, --resolution <number>', 'Output resolution', '512')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(async (options) => {
    const spinner = ora('Generating character sprite...').start();
    try {
      const result = await generateImage(
        options.prompt,
        options.style as CharacterStyle,
        options.output,
        { resolution: parseInt(options.resolution) }
      );
      spinner.succeed(`Sprite saved to ${result.imagePath}`);
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

program
  .command('animate')
  .description('Animate an existing sprite')
  .requiredOption('-i, --input <path>', 'Path to sprite image')
  .option('-t, --types <types>', 'Comma-separated animation types', 'idle')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(async (options) => {
    const spinner = ora('Creating animations...').start();
    try {
      const animations = options.types.split(',').map((a: string) => a.trim()) as AnimationType[];
      const results = await createAnimationBatch(options.input, animations, options.output);
      spinner.succeed(`Created ${results.length} animations`);
      results.forEach(r => console.log(`  - ${r.animationType}: ${r.videoPath}`));
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

program
  .command('rig-3d')
  .description('Convert sprite to rigged 3D model')
  .requiredOption('-i, --input <path>', 'Path to sprite or animation')
  .option('-k, --skeleton <type>', 'Skeleton type', 'biped')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(async (options) => {
    const spinner = ora('Generating 3D model and rigging...').start();
    try {
      const result = await generateAndRig3DModel(
        options.input,
        options.output,
        options.skeleton as SkeletonType
      );
      spinner.succeed(`Rigged model saved to ${result.riggedModelPath}`);
      console.log(`  - Base model: ${result.modelPath}`);
      console.log(`  - Bones: ${result.boneCount}`);
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export model for Three.js')
  .requiredOption('-i, --input <path>', 'Path to rigged model')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--optimize', 'Optimize for web', true)
  .action(async (options) => {
    const spinner = ora('Exporting for Three.js...').start();
    try {
      const result = await exportForThreeJS(options.input, options.output, {
        optimize: options.optimize,
      });
      spinner.succeed('Export complete');
      console.log(`  - GLB: ${result.glbPath} (${(result.fileSize / 1024).toFixed(1)}KB)`);
      console.log(`  - Preview: ${result.previewPath}`);
    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

async function runFullPipeline(config: GenerationConfig): Promise<PipelineResult> {
  const startTime = Date.now();
  const characterName = config.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 30);
  
  const outputDir = path.join(config.outputDir, characterName);
  await fs.mkdir(outputDir, { recursive: true });

  console.log('\n🎮 AI Game Character Generator');
  console.log('================================');
  console.log(`Character: ${config.prompt}`);
  console.log(`Style: ${config.style}`);
  console.log(`Animations: ${config.animations.join(', ')}`);
  console.log(`Output: ${outputDir}\n`);

  let spinner = ora('Step 1/4: Generating character sprite...').start();
  let imageResult;
  try {
    imageResult = await generateImage(config.prompt, config.style, outputDir, {
      resolution: config.resolution,
    });
    spinner.succeed('Sprite generated');
  } catch (error) {
    spinner.fail('Sprite generation failed');
    throw error;
  }

  spinner = ora('Step 2/4: Creating animations with Veo...').start();
  let videoResults: VideoGenResult[] = [];
  try {
    videoResults = await createAnimationBatch(
      imageResult.imagePath,
      config.animations,
      outputDir
    );
    spinner.succeed(`${videoResults.length} animations created`);
  } catch (_error) {
    spinner.warn('Animation generation failed, continuing with static sprite');
    videoResults = [];
  }

  spinner = ora('Step 3/4: Generating 3D model and rigging with Tripo...').start();
  let riggingResult;
  try {
    riggingResult = await generateAndRig3DModel(
      imageResult.imagePath,
      outputDir,
      config.skeleton
    );
    spinner.succeed('3D model rigged');
  } catch (error) {
    spinner.fail('3D rigging failed');
    throw error;
  }

  spinner = ora('Step 4/4: Exporting for Three.js...').start();
  let exportResult;
  try {
    exportResult = await exportForThreeJS(
      riggingResult.riggedModelPath,
      outputDir,
      { animations: config.animations }
    );
    spinner.succeed('Export complete');
  } catch (error) {
    spinner.fail('Export failed');
    throw error;
  }

  const totalDuration = (Date.now() - startTime) / 1000;

  const result: PipelineResult = {
    characterName,
    imageGen: imageResult,
    videoGen: videoResults,
    rigging: riggingResult,
    export: exportResult,
    metadata: {
      createdAt: new Date().toISOString(),
      totalDuration,
      config,
    },
  };

  const metadataPath = path.join(outputDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(result, null, 2));

  console.log('\n✅ Character generation complete!');
  console.log('================================');
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🖼️  Sprite: ${imageResult.imagePath}`);
  console.log(`🎬 Animations: ${videoResults.length} clips`);
  console.log(`🦴 3D Model: ${riggingResult.riggedModelPath}`);
  console.log(`🌐 Preview: ${exportResult.previewPath}`);
  console.log(`⏱️  Total time: ${totalDuration.toFixed(1)}s`);

  console.log('\n📋 Three.js Integration:');
  console.log(generateThreeJSCode(path.basename(riggingResult.riggedModelPath)));

  return result;
}

program.parse();
