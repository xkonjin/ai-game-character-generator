# AI Game Character Generator

An end-to-end pipeline for creating animated 3D game characters from text prompts using AI.

[![CI](https://github.com/xkonjin/ai-game-character-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/xkonjin/ai-game-character-generator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Pipeline Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  Image Gen      │───▶│  Veo Video   │───▶│  Tripo 3D       │───▶│  Three.js Export │
│  (DALL-E/SD)    │    │  Animation   │    │  Rigging        │    │  (GLB/GLTF)      │
└─────────────────┘    └──────────────┘    └─────────────────┘    └──────────────────┘
```

## Quick Start

```bash
# Install
npm install
cp .env.example .env
# Add your API keys to .env

# Check configuration
npm run dev -- check

# Generate a character
npm run dev -- generate -p "cute pixel knight with sword" -s pixel -a idle,walk
```

## Features

- **Multi-Provider Image Generation**: DALL-E 3, Stability AI, PixelLab
- **Video Animation**: Google Veo 3.1, Runway Gen-3
- **3D Rigging**: Tripo AI auto-rigging with multiple skeleton types
- **Three.js Export**: GLB/GLTF with interactive preview

## CLI Commands

| Command | Description |
|---------|-------------|
| `generate` | Full pipeline: sprite → animation → 3D → export |
| `image-gen` | Generate sprite only |
| `animate` | Animate existing sprite |
| `rig-3d` | Convert sprite to rigged 3D model |
| `export` | Export for Three.js |
| `list` | Show available options |
| `check` | Verify API configuration |

### Examples

```bash
# Full pipeline with all options
npm run dev -- generate \
  -p "anime wizard with staff" \
  -s anime \
  -a idle,walk,attack \
  -k biped \
  -o ./output

# Image only
npm run dev -- image-gen -p "pixel art robot" -s pixel

# Animate existing sprite
npm run dev -- animate -i ./sprite.png -t idle,walk,run

# Convert to 3D
npm run dev -- rig-3d -i ./sprite.png -k biped

# JSON output
npm run dev -- --json generate -p "low poly warrior"
```

## Art Styles

| Style | Description |
|-------|-------------|
| `pixel` | 8-bit/16-bit pixel art sprites |
| `anime` | Chibi/anime style characters |
| `lowpoly` | Low polygon, flat shaded |
| `painterly` | Hand-painted concept art |
| `voxel` | Minecraft-like 3D cubes |

## Animation Types

| Animation | Duration | Description |
|-----------|----------|-------------|
| `idle` | 4s | Standing/breathing loop |
| `walk` | 4s | 8-frame walk cycle |
| `run` | 3s | Running animation |
| `attack` | 2s | Attack sequence |
| `jump` | 2s | Jump arc |
| `death` | 3s | Death animation |
| `hurt` | 1s | Damage reaction |

## Skeleton Types

| Type | Bones | Use Case |
|------|-------|----------|
| `biped` | 25 | Humanoid characters |
| `quadruped` | 32 | Four-legged creatures |
| `custom` | 20 | Non-standard characters |

## API Keys

Set in `.env` file:

```env
OPENAI_API_KEY=sk-...        # DALL-E image generation
GOOGLE_API_KEY=...           # Veo video animation
TRIPO_API_KEY=...            # 3D rigging
```

| Service | Purpose | Get Key |
|---------|---------|---------|
| OpenAI | DALL-E image generation | [platform.openai.com](https://platform.openai.com/api-keys) |
| Google | Veo video generation | [ai.google.dev](https://ai.google.dev/) |
| Tripo AI | 3D rigging | [tripo3d.ai](https://tripo3d.ai) |

## Output Structure

```
output/
├── {character_name}/
│   ├── sprite.png           # Base sprite
│   ├── animations/
│   │   ├── idle.mp4
│   │   ├── walk.mp4
│   │   └── ...
│   ├── model/
│   │   ├── base.glb         # Unrigged model
│   │   └── rigged.glb       # Rigged model
│   ├── preview.html         # Interactive 3D preview
│   ├── integration.js       # Three.js code
│   ├── CharacterViewer.tsx  # React component
│   └── metadata.json        # Generation metadata
```

## Integration

### Three.js

```javascript
import { CharacterLoader } from './integration.js';

const character = new CharacterLoader(scene);
await character.load('./model/rigged.glb');
character.playAnimation('idle');

// In animation loop
character.update(clock.getDelta());
```

### React Three Fiber

```tsx
import CharacterViewer from './CharacterViewer';

<CharacterViewer animation="walk" showControls={true} />
```

## Factory Droid Skill

This project includes a Factory Droid skill for AI-assisted generation:

```
droid> Use the ai-game-character-pipeline skill to create a cute pixel knight
```

## Development

```bash
# Install
npm install

# Build
npm run build

# Test
npm run test
npm run test:coverage

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
```

## Project Structure

```
├── src/
│   ├── cli/              # CLI implementation
│   ├── image-gen/        # Image generation
│   ├── video-gen/        # Video animation
│   ├── rigging/          # 3D rigging
│   ├── threejs-export/   # Export module
│   ├── types.ts          # Type definitions
│   └── index.ts          # Main exports
├── tests/                # Test suite (61 tests)
├── docs/                 # Documentation
└── .factory/             # Droid skill & config
```

## Documentation

- [API Reference](docs/API.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## License

MIT - see [LICENSE](LICENSE) for details.
