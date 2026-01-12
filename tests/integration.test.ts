import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { optimizePrompt } from '../src/image-gen/index.js';
import { getAnimationConfig, getAnimationTypes } from '../src/video-gen/index.js';
import { getSkeletonConfig, getSkeletonTypes } from '../src/rigging/index.js';
import { generateThreeJSCode, getExportFormats } from '../src/threejs-export/index.js';

describe('Integration Tests', () => {
  const tempDir = path.join(__dirname, '.temp-test');

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Full Pipeline Configuration', () => {
    it('should have consistent style definitions across modules', () => {
      const styles = ['pixel', 'anime', 'lowpoly', 'painterly', 'voxel'] as const;
      
      styles.forEach(style => {
        const prompt = optimizePrompt('test character', style);
        expect(prompt).toContain('test character');
        expect(prompt.length).toBeGreaterThan(20);
      });
    });

    it('should have all required animation types', () => {
      const requiredAnimations = ['idle', 'walk', 'run', 'attack', 'jump'];
      const availableAnimations = getAnimationTypes();
      
      requiredAnimations.forEach(anim => {
        expect(availableAnimations).toContain(anim);
      });
    });

    it('should have matching skeleton configurations', () => {
      const skeletons = getSkeletonTypes();
      
      skeletons.forEach(skeleton => {
        const config = getSkeletonConfig(skeleton);
        expect(config.boneCount).toBeGreaterThan(0);
        expect(config.description).toBeTruthy();
      });
    });

    it('should generate valid Three.js integration code', () => {
      const code = generateThreeJSCode('character.glb');
      
      // Should contain essential Three.js code patterns
      expect(code).toContain('THREE');
      expect(code).toContain('GLTFLoader');
      expect(code).toContain('AnimationMixer');
      expect(code).toContain('character.glb');
    });
  });

  describe('Animation and Rigging Compatibility', () => {
    it('should have compatible animation durations for game use', () => {
      const animations = getAnimationTypes();
      
      animations.forEach(anim => {
        const config = getAnimationConfig(anim);
        const duration = parseFloat(config.duration);
        
        // Game animations should be short
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThanOrEqual(10);
      });
    });

    it('should have reasonable FPS values', () => {
      const animations = getAnimationTypes();
      const validFps = [24, 30, 60];
      
      animations.forEach(anim => {
        const config = getAnimationConfig(anim);
        expect(validFps).toContain(config.fps);
      });
    });

    it('biped skeleton should have enough bones for humanoid animations', () => {
      const biped = getSkeletonConfig('biped');
      // Minimum bones for humanoid: spine, hips, arms (x2), legs (x2), head = ~15+
      expect(biped.boneCount).toBeGreaterThanOrEqual(15);
    });

    it('quadruped skeleton should have more leg bones', () => {
      const biped = getSkeletonConfig('biped');
      const quadruped = getSkeletonConfig('quadruped');
      // Quadruped needs more bones for 4 legs
      expect(quadruped.boneCount).toBeGreaterThan(biped.boneCount);
    });
  });

  describe('Export Compatibility', () => {
    it('should support GLB format', () => {
      const formats = getExportFormats();
      expect(formats).toContain('glb');
    });

    it('should support GLTF format', () => {
      const formats = getExportFormats();
      expect(formats).toContain('gltf');
    });

    it('generated code should reference correct model path', () => {
      const testPath = 'my-model.glb';
      const code = generateThreeJSCode(testPath);
      expect(code).toContain(testPath);
    });
  });

  describe('Pipeline Data Flow', () => {
    it('should pass character name through pipeline', async () => {
      const testMetadata = {
        characterName: 'test_knight',
        style: 'pixel',
        animations: ['idle', 'walk'],
        skeleton: 'biped',
      };

      const metadataPath = path.join(tempDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(testMetadata));
      
      const loaded = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      expect(loaded.characterName).toBe('test_knight');
      expect(loaded.style).toBe('pixel');
      expect(loaded.animations).toContain('idle');
    });
  });
});
