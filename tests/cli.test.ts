import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const CLI_PATH = path.join(__dirname, '../src/cli/index.ts');
const runCli = (args: string) => {
  return execSync(`npx tsx ${CLI_PATH} ${args}`, {
    encoding: 'utf-8',
    env: { ...process.env, NODE_ENV: 'test' },
  });
};

describe('CLI', () => {
  describe('help command', () => {
    it('should display help information', () => {
      const output = runCli('--help');
      expect(output).toContain('AI Game Character Generator');
      expect(output).toContain('generate');
      expect(output).toContain('image-gen');
      expect(output).toContain('animate');
      expect(output).toContain('rig-3d');
      expect(output).toContain('export');
    });

    it('should display version', () => {
      const output = runCli('--version');
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('list command', () => {
    it('should list all options', () => {
      const output = runCli('list');
      expect(output).toContain('Art Styles');
      expect(output).toContain('Animation Types');
      expect(output).toContain('Skeleton Types');
      expect(output).toContain('Providers');
    });

    it('should list art styles', () => {
      const output = runCli('list --styles');
      expect(output).toContain('pixel');
      expect(output).toContain('anime');
      expect(output).toContain('lowpoly');
      expect(output).toContain('painterly');
      expect(output).toContain('voxel');
    });

    it('should list animations', () => {
      const output = runCli('list --animations');
      expect(output).toContain('idle');
      expect(output).toContain('walk');
      expect(output).toContain('run');
      expect(output).toContain('attack');
      expect(output).toContain('jump');
      expect(output).toContain('death');
      expect(output).toContain('hurt');
    });

    it('should list skeleton types', () => {
      const output = runCli('list --skeletons');
      expect(output).toContain('biped');
      expect(output).toContain('quadruped');
      expect(output).toContain('custom');
    });

    it('should list providers', () => {
      const output = runCli('list --providers');
      expect(output).toContain('openai');
      expect(output).toContain('veo');
      expect(output).toContain('tripo');
    });
  });

  describe('check command', () => {
    it('should check API key status', () => {
      const output = runCli('check');
      expect(output).toContain('API Key Status');
      expect(output).toContain('OpenAI');
      expect(output).toContain('Google');
      expect(output).toContain('Tripo');
    });
  });

  describe('generate command help', () => {
    it('should display generate command options', () => {
      const output = runCli('generate --help');
      expect(output).toContain('--prompt');
      expect(output).toContain('--style');
      expect(output).toContain('--animations');
      expect(output).toContain('--skeleton');
      expect(output).toContain('--output');
    });
  });

  describe('validation', () => {
    it('should reject invalid style', () => {
      try {
        runCli('generate -p "test" -s invalid-style');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(String(error)).toContain('Invalid style');
      }
    });

    it('should reject invalid animation type', () => {
      try {
        runCli('generate -p "test" -a invalid-anim');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(String(error)).toContain('Invalid animation');
      }
    });
  });
});
