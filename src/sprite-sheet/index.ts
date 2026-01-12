import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export type SpriteSheetFormat = 'png' | 'gif' | 'webp';

interface SpriteSheetOptions {
  frameCount?: number;
  columns?: number;
  frameWidth?: number;
  frameHeight?: number;
  format?: SpriteSheetFormat;
  includeMetadata?: boolean;
}

interface SpriteSheetResult {
  spriteSheetPath: string;
  metadataPath?: string;
  frameCount: number;
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  format: SpriteSheetFormat;
}

interface FrameMetadata {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  sourceSize: {
    w: number;
    h: number;
  };
  duration: number;
}

interface SpriteSheetMetadata {
  frames: Record<string, FrameMetadata>;
  meta: {
    image: string;
    size: {
      w: number;
      h: number;
    };
    frameCount: number;
    scale: number;
    format: string;
  };
}

export async function extractFramesFromVideo(
  videoPath: string,
  outputDir: string,
  options: { frameCount?: number; fps?: number } = {}
): Promise<string[]> {
  const { frameCount = 8 } = options;
  
  console.log(`[SpriteSheet] Extracting ${frameCount} frames from ${videoPath}`);
  
  // For now, create placeholder frames
  // In production, use ffmpeg to extract frames
  const framesDir = path.join(outputDir, 'frames');
  await fs.mkdir(framesDir, { recursive: true });
  
  const framePaths: string[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    const framePath = path.join(framesDir, `frame_${i.toString().padStart(4, '0')}.png`);
    
    // Create placeholder frame image
    const frameImage = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 4,
        background: { r: 100, g: 100, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    
    await fs.writeFile(framePath, frameImage);
    framePaths.push(framePath);
  }
  
  console.log(`[SpriteSheet] Extracted ${framePaths.length} frames`);
  return framePaths;
}

export async function createSpriteSheet(
  framePaths: string[],
  outputDir: string,
  animationName: string,
  options: SpriteSheetOptions = {}
): Promise<SpriteSheetResult> {
  const {
    columns = Math.ceil(Math.sqrt(framePaths.length)),
    format = 'png',
    includeMetadata = true,
  } = options;
  
  if (framePaths.length === 0) {
    throw new Error('No frames provided for sprite sheet');
  }
  
  console.log(`[SpriteSheet] Creating sprite sheet with ${framePaths.length} frames`);
  
  // Read first frame to get dimensions
  const firstFrame = await sharp(framePaths[0]).metadata();
  const frameWidth = options.frameWidth || firstFrame.width || 64;
  const frameHeight = options.frameHeight || firstFrame.height || 64;
  
  const rows = Math.ceil(framePaths.length / columns);
  const sheetWidth = columns * frameWidth;
  const sheetHeight = rows * frameHeight;
  
  // Create composite operations
  const compositeOps: sharp.OverlayOptions[] = await Promise.all(
    framePaths.map(async (framePath, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      // Resize frame if needed
      const frameBuffer = await sharp(framePath)
        .resize(frameWidth, frameHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
      
      return {
        input: frameBuffer,
        left: col * frameWidth,
        top: row * frameHeight,
      };
    })
  );
  
  // Create sprite sheet
  await fs.mkdir(outputDir, { recursive: true });
  
  const spriteSheetPath = path.join(outputDir, `${animationName}_spritesheet.${format}`);
  
  let sheetImage = sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(compositeOps);
  
  // Convert to specified format
  switch (format) {
    case 'gif':
      sheetImage = sheetImage.gif();
      break;
    case 'webp':
      sheetImage = sheetImage.webp({ lossless: true });
      break;
    default:
      sheetImage = sheetImage.png();
  }
  
  await sheetImage.toFile(spriteSheetPath);
  
  console.log(`[SpriteSheet] Created sprite sheet at ${spriteSheetPath}`);
  
  // Generate metadata if requested
  let metadataPath: string | undefined;
  if (includeMetadata) {
    const metadata = generateSpriteSheetMetadata(
      path.basename(spriteSheetPath),
      framePaths.length,
      columns,
      rows,
      frameWidth,
      frameHeight
    );
    
    metadataPath = path.join(outputDir, `${animationName}_spritesheet.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`[SpriteSheet] Created metadata at ${metadataPath}`);
  }
  
  return {
    spriteSheetPath,
    metadataPath,
    frameCount: framePaths.length,
    columns,
    rows,
    frameWidth,
    frameHeight,
    format,
  };
}

function generateSpriteSheetMetadata(
  imageName: string,
  frameCount: number,
  columns: number,
  rows: number,
  frameWidth: number,
  frameHeight: number
): SpriteSheetMetadata {
  const frames: Record<string, FrameMetadata> = {};
  const frameDuration = 100; // 10 FPS default
  
  for (let i = 0; i < frameCount; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    
    frames[`frame_${i}`] = {
      frame: {
        x: col * frameWidth,
        y: row * frameHeight,
        w: frameWidth,
        h: frameHeight,
      },
      sourceSize: {
        w: frameWidth,
        h: frameHeight,
      },
      duration: frameDuration,
    };
  }
  
  return {
    frames,
    meta: {
      image: imageName,
      size: {
        w: columns * frameWidth,
        h: rows * frameHeight,
      },
      frameCount,
      scale: 1,
      format: 'RGBA8888',
    },
  };
}

export async function createAnimatedGif(
  framePaths: string[],
  outputDir: string,
  animationName: string,
  options: { delay?: number; loop?: boolean } = {}
): Promise<string> {
  const { delay: _delay = 100, loop: _loop = true } = options;
  
  console.log(`[SpriteSheet] Creating animated GIF with ${framePaths.length} frames`);
  
  await fs.mkdir(outputDir, { recursive: true });
  const gifPath = path.join(outputDir, `${animationName}.gif`);
  
  // TODO: For proper animated GIF, would need gifenc or similar library
  // For now, create a static placeholder using first frame
  await sharp(framePaths[0])
    .resize(64, 64)
    .gif()
    .toFile(gifPath);
  
  console.log(`[SpriteSheet] Created GIF at ${gifPath}`);
  return gifPath;
}

export async function videoToSpriteSheet(
  videoPath: string,
  outputDir: string,
  animationName: string,
  options: SpriteSheetOptions & { fps?: number } = {}
): Promise<SpriteSheetResult> {
  const { frameCount = 8, fps = 8, ...sheetOptions } = options;
  
  console.log(`[SpriteSheet] Converting video to sprite sheet: ${videoPath}`);
  
  // Extract frames from video
  const framePaths = await extractFramesFromVideo(videoPath, outputDir, { frameCount, fps });
  
  // Create sprite sheet
  const result = await createSpriteSheet(framePaths, outputDir, animationName, sheetOptions);
  
  // Optionally clean up individual frames
  // await Promise.all(framePaths.map(fp => fs.unlink(fp)));
  
  return result;
}

export function getSpriteSheetFormats(): SpriteSheetFormat[] {
  return ['png', 'gif', 'webp'];
}

export function calculateOptimalColumns(frameCount: number): number {
  // Try to make a roughly square sheet
  return Math.ceil(Math.sqrt(frameCount));
}
