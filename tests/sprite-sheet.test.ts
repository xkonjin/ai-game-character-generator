import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { 
  getSpriteSheetFormats, 
  calculateOptimalColumns,
  createSpriteSheet,
  extractFramesFromVideo,
} from '../src/sprite-sheet/index.js';

describe('Sprite Sheet Module', () => {
  const tempDir = path.join(__dirname, '.temp-sprite-test');

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getSpriteSheetFormats', () => {
    it('should return supported formats', () => {
      const formats = getSpriteSheetFormats();
      expect(formats).toContain('png');
      expect(formats).toContain('gif');
      expect(formats).toContain('webp');
    });
  });

  describe('calculateOptimalColumns', () => {
    it('should calculate square-ish layout for 4 frames', () => {
      const cols = calculateOptimalColumns(4);
      expect(cols).toBe(2);
    });

    it('should calculate square-ish layout for 8 frames', () => {
      const cols = calculateOptimalColumns(8);
      expect(cols).toBe(3);
    });

    it('should calculate square-ish layout for 16 frames', () => {
      const cols = calculateOptimalColumns(16);
      expect(cols).toBe(4);
    });

    it('should handle single frame', () => {
      const cols = calculateOptimalColumns(1);
      expect(cols).toBe(1);
    });
  });

  describe('extractFramesFromVideo', () => {
    it('should extract requested number of frames', async () => {
      const framePaths = await extractFramesFromVideo(
        'placeholder.mp4',
        tempDir,
        { frameCount: 4 }
      );
      
      expect(framePaths).toHaveLength(4);
      
      // Verify frames exist
      for (const framePath of framePaths) {
        const exists = await fs.access(framePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });

  describe('createSpriteSheet', () => {
    it('should create sprite sheet from frames', async () => {
      // First extract frames
      const framePaths = await extractFramesFromVideo(
        'placeholder.mp4',
        tempDir,
        { frameCount: 4 }
      );
      
      // Create sprite sheet
      const result = await createSpriteSheet(
        framePaths,
        tempDir,
        'test_animation',
        { includeMetadata: true }
      );
      
      expect(result.frameCount).toBe(4);
      expect(result.columns).toBe(2);
      expect(result.rows).toBe(2);
      expect(result.format).toBe('png');
      
      // Verify sprite sheet exists
      const sheetExists = await fs.access(result.spriteSheetPath).then(() => true).catch(() => false);
      expect(sheetExists).toBe(true);
      
      // Verify metadata exists
      if (result.metadataPath) {
        const metaExists = await fs.access(result.metadataPath).then(() => true).catch(() => false);
        expect(metaExists).toBe(true);
        
        // Verify metadata structure
        const metadata = JSON.parse(await fs.readFile(result.metadataPath, 'utf-8'));
        expect(metadata.frames).toBeDefined();
        expect(metadata.meta).toBeDefined();
        expect(Object.keys(metadata.frames)).toHaveLength(4);
      }
    });

    it('should support custom columns', async () => {
      const framePaths = await extractFramesFromVideo(
        'placeholder.mp4',
        tempDir,
        { frameCount: 6 }
      );
      
      const result = await createSpriteSheet(
        framePaths,
        tempDir,
        'test_custom_cols',
        { columns: 3 }
      );
      
      expect(result.columns).toBe(3);
      expect(result.rows).toBe(2);
    });
  });
});
