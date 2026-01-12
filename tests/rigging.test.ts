import { describe, it, expect } from 'vitest';
import { 
  getSkeletonTypes, 
  getSkeletonConfig, 
  getSupportedProviders,
  getAllSkeletonTypes,
  getAnySkeletonConfig,
  isAnimationCompatible,
  getCompatibleAnimations,
  getBoneHierarchy,
  suggestSkeletonForCharacter,
  ADDITIONAL_SKELETON_TYPES,
} from '../src/rigging/index.js';

describe('Rigging Module', () => {
  describe('getSkeletonTypes', () => {
    it('should return all base skeleton types', () => {
      const types = getSkeletonTypes();
      expect(types).toContain('biped');
      expect(types).toContain('quadruped');
      expect(types).toContain('custom');
      expect(types).toHaveLength(3);
    });
  });

  describe('getAllSkeletonTypes', () => {
    it('should return all skeleton types including additional', () => {
      const types = getAllSkeletonTypes();
      expect(types).toContain('biped');
      expect(types).toContain('quadruped');
      expect(types).toContain('bird');
      expect(types).toContain('fish');
      expect(types).toContain('spider');
      expect(types).toContain('snake');
      expect(types).toContain('mech');
      expect(types.length).toBeGreaterThan(5);
    });
  });

  describe('getSkeletonConfig', () => {
    it('should return config for biped skeleton with bones', () => {
      const config = getSkeletonConfig('biped');
      expect(config.boneCount).toBe(25);
      expect(config.description).toContain('Humanoid');
      expect(config.bones).toContain('Hips');
      expect(config.rootBone).toBe('Hips');
      expect(config.compatibility).toContain('walk');
    });

    it('should return config for quadruped skeleton', () => {
      const config = getSkeletonConfig('quadruped');
      expect(config.boneCount).toBe(32);
      expect(config.description).toContain('Four-legged');
      expect(config.bones).toContain('Tail1');
    });

    it('should return config for custom skeleton', () => {
      const config = getSkeletonConfig('custom');
      expect(config.boneCount).toBe(20);
      expect(config.description).toContain('Custom');
      expect(config.bones).toContain('Appendage1_Base');
    });

    it('should have reasonable bone counts', () => {
      const types = getSkeletonTypes();
      
      types.forEach(type => {
        const config = getSkeletonConfig(type);
        expect(config.boneCount).toBeGreaterThan(10);
        expect(config.boneCount).toBeLessThan(100);
      });
    });
  });

  describe('ADDITIONAL_SKELETON_TYPES', () => {
    it('should have bird skeleton with wings', () => {
      expect(ADDITIONAL_SKELETON_TYPES.bird.boneCount).toBe(28);
      expect(ADDITIONAL_SKELETON_TYPES.bird.bones).toContain('LeftWing1');
      expect(ADDITIONAL_SKELETON_TYPES.bird.rootBone).toBe('Root');
    });

    it('should have spider skeleton with 8 legs', () => {
      expect(ADDITIONAL_SKELETON_TYPES.spider.boneCount).toBe(42);
      expect(ADDITIONAL_SKELETON_TYPES.spider.rootBone).toBe('Cephalothorax');
      expect(ADDITIONAL_SKELETON_TYPES.spider.bones).toContain('Leg1L_1');
    });

    it('should have snake skeleton with spine', () => {
      expect(ADDITIONAL_SKELETON_TYPES.snake.boneCount).toBe(24);
      expect(ADDITIONAL_SKELETON_TYPES.snake.bones).toContain('Spine10');
    });

    it('should have mech skeleton with weapon mounts', () => {
      expect(ADDITIONAL_SKELETON_TYPES.mech.boneCount).toBe(30);
      expect(ADDITIONAL_SKELETON_TYPES.mech.bones).toContain('LeftWeaponMount');
    });

    it('should have fish skeleton', () => {
      expect(ADDITIONAL_SKELETON_TYPES.fish.boneCount).toBe(18);
      expect(ADDITIONAL_SKELETON_TYPES.fish.bones).toContain('DorsalFin');
    });
  });

  describe('getAnySkeletonConfig', () => {
    it('should return config for base types', () => {
      const config = getAnySkeletonConfig('biped');
      expect(config).not.toBeNull();
      expect(config?.boneCount).toBe(25);
    });

    it('should return config for additional types', () => {
      const config = getAnySkeletonConfig('spider');
      expect(config).not.toBeNull();
      expect(config?.boneCount).toBe(42);
    });

    it('should return null for unknown types', () => {
      const config = getAnySkeletonConfig('unknown');
      expect(config).toBeNull();
    });
  });

  describe('isAnimationCompatible', () => {
    it('should return true for compatible animations', () => {
      expect(isAnimationCompatible('biped', 'walk')).toBe(true);
      expect(isAnimationCompatible('biped', 'attack')).toBe(true);
      expect(isAnimationCompatible('biped', 'hurt')).toBe(true);
    });

    it('should return false for incompatible animations', () => {
      expect(isAnimationCompatible('snake', 'jump')).toBe(false);
      expect(isAnimationCompatible('fish', 'run')).toBe(false);
    });

    it('should return false for unknown skeletons', () => {
      expect(isAnimationCompatible('unknown', 'walk')).toBe(false);
    });
  });

  describe('getCompatibleAnimations', () => {
    it('should return animations for biped', () => {
      const anims = getCompatibleAnimations('biped');
      expect(anims).toContain('walk');
      expect(anims).toContain('hurt');
      expect(anims).toContain('jump');
    });

    it('should return limited animations for snake', () => {
      const anims = getCompatibleAnimations('snake');
      expect(anims).toContain('idle');
      expect(anims).not.toContain('jump');
    });

    it('should return empty for unknown', () => {
      const anims = getCompatibleAnimations('unknown');
      expect(anims).toHaveLength(0);
    });
  });

  describe('getBoneHierarchy', () => {
    it('should return bone hierarchy for biped', () => {
      const hierarchy = getBoneHierarchy('biped');
      expect(hierarchy).not.toBeNull();
      expect(hierarchy?.rootBone).toBe('Hips');
      expect(hierarchy?.bones).toContain('LeftArm');
    });

    it('should return bone hierarchy for spider', () => {
      const hierarchy = getBoneHierarchy('spider');
      expect(hierarchy).not.toBeNull();
      expect(hierarchy?.rootBone).toBe('Cephalothorax');
    });

    it('should return null for unknown', () => {
      expect(getBoneHierarchy('unknown')).toBeNull();
    });
  });

  describe('suggestSkeletonForCharacter', () => {
    it('should suggest biped for humanoid', () => {
      expect(suggestSkeletonForCharacter('cute pixel knight')).toBe('biped');
      expect(suggestSkeletonForCharacter('anime wizard')).toBe('biped');
    });

    it('should suggest quadruped for animals', () => {
      expect(suggestSkeletonForCharacter('wolf monster')).toBe('quadruped');
      expect(suggestSkeletonForCharacter('cute dog')).toBe('quadruped');
    });

    it('should suggest spider for arachnids', () => {
      expect(suggestSkeletonForCharacter('giant spider boss')).toBe('spider');
    });

    it('should suggest bird for flying creatures', () => {
      expect(suggestSkeletonForCharacter('flying dragon with wings')).toBe('bird');
    });

    it('should suggest fish for aquatic', () => {
      expect(suggestSkeletonForCharacter('swimming shark')).toBe('fish');
    });

    it('should suggest mech for robots', () => {
      expect(suggestSkeletonForCharacter('giant robot mech')).toBe('mech');
    });

    it('should suggest snake for serpents', () => {
      expect(suggestSkeletonForCharacter('giant snake boss')).toBe('snake');
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = getSupportedProviders();
      expect(providers).toContain('tripo');
      expect(providers).toContain('meshy');
      expect(providers).toContain('placeholder');
      expect(providers).toHaveLength(3);
    });
  });
});
