import { describe, it, expect } from 'vitest';
import { getExportFormats, generateThreeJSCode } from '../src/threejs-export/index.js';

describe('Three.js Export Module', () => {
  describe('getExportFormats', () => {
    it('should return supported export formats', () => {
      const formats = getExportFormats();
      expect(formats).toContain('glb');
      expect(formats).toContain('gltf');
      expect(formats).toHaveLength(2);
    });
  });

  describe('generateThreeJSCode', () => {
    it('should generate valid JavaScript code', () => {
      const code = generateThreeJSCode('character.glb');
      expect(code).toContain('import * as THREE');
      expect(code).toContain('GLTFLoader');
      expect(code).toContain('character.glb');
    });

    it('should include CharacterLoader class', () => {
      const code = generateThreeJSCode('model.glb');
      expect(code).toContain('class CharacterLoader');
      expect(code).toContain('load(');
      expect(code).toContain('playAnimation(');
      expect(code).toContain('update(');
    });

    it('should include animation handling', () => {
      const code = generateThreeJSCode('test.glb');
      expect(code).toContain('AnimationMixer');
      expect(code).toContain('animations');
      expect(code).toContain('fadeIn');
      expect(code).toContain('fadeOut');
    });

    it('should include position and scale methods', () => {
      const code = generateThreeJSCode('test.glb');
      expect(code).toContain('setPosition');
      expect(code).toContain('setRotation');
      expect(code).toContain('setScale');
    });

    it('should include usage example', () => {
      const code = generateThreeJSCode('test.glb');
      expect(code).toContain('Usage example');
      expect(code).toContain('clock.getDelta()');
    });
  });

  describe('code quality', () => {
    it('should generate code with proper imports', () => {
      const code = generateThreeJSCode('model.glb');
      const importLines = code.split('\n').filter(line => line.includes('import'));
      expect(importLines.length).toBeGreaterThanOrEqual(2);
    });

    it('should include Three.js specific types', () => {
      const code = generateThreeJSCode('model.glb');
      expect(code).toContain('THREE');
      expect(code).toContain('LoopRepeat');
    });
  });
});
