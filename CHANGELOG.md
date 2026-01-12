# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-12

### Added

#### Core Features
- Full character generation pipeline: image → animation → 3D → export
- Multi-provider image generation (OpenAI DALL-E, Stability AI, PixelLab)
- Video animation with Google Veo 3.1 and Runway Gen-3
- 3D model generation and auto-rigging with Tripo AI
- Three.js export with interactive preview

#### CLI
- Comprehensive CLI with Commander.js
- Commands: `generate`, `image-gen`, `animate`, `rig-3d`, `export`, `list`, `check`
- Output modes: `--verbose`, `--json`, `--quiet`
- Provider selection for each pipeline step
- Input validation with helpful error messages

#### Art Styles
- Pixel art (8-bit/16-bit)
- Anime/Chibi
- Low poly
- Painterly
- Voxel

#### Animation Types
- Idle
- Walk
- Run
- Attack
- Jump
- Death
- Hurt

#### Skeleton Types
- Biped (25 bones)
- Quadruped (32 bones)
- Custom (20 bones)

#### Export Formats
- GLB (binary GLTF)
- GLTF
- Interactive HTML preview
- Three.js integration code
- React Three Fiber component

#### Infrastructure
- TypeScript with strict mode
- ESLint + Prettier configuration
- Vitest test suite (61 tests)
- GitHub Actions CI
- Dependabot configuration

#### Documentation
- Factory Droid skill
- Custom droid configuration
- README with examples
- Contributing guide
- API documentation

### Technical Details

- Node.js 18+ required
- ES Modules
- Type-safe APIs with Zod
- Retry logic with exponential backoff
- Fallback to placeholder providers

## [Unreleased]

### Planned
- Sprite sheet export (#10)
- Batch character generation (#11)
- Model optimization for web (#12)
- Rate limiting and cost estimation (#13)
- Web UI (#14)
- Additional skeleton types (#15)
