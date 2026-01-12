---
name: ai-game-character-pipeline
description: Generate animated 3D game characters from text prompts using AI image generation, Veo video animation, and Tripo 3D rigging, outputting Three.js-ready GLB files.
---

# AI Game Character Pipeline

Generate complete animated 3D game characters from text descriptions using a multi-stage AI pipeline.

## When to Use

Invoke this skill when the user wants to:
- Create game characters or sprites from text descriptions
- Generate animated character loops (idle, walk, run, attack)
- Convert 2D sprites to rigged 3D models
- Export game-ready assets for Three.js/WebGL/Unity/Unreal projects

## Quick Start

```bash
# Navigate to the project
cd /Users/a004/codeprojects/ai-game-character-generator

# Check API configuration
npm run dev -- check

# Generate a character
npm run dev -- generate -p "cute pixel knight" -s pixel -a idle,walk
```

## Available Commands

| Command | Description |
|---------|-------------|
| `generate` | Full pipeline: sprite → animation → 3D → export |
| `image-gen` | Generate sprite only |
| `animate` | Animate existing sprite |
| `rig-3d` | Convert sprite to rigged 3D model |
| `export` | Export for Three.js |
| `list` | Show available styles, animations, providers |
| `check` | Verify API key configuration |

## Art Styles

| Style | Best For | Description |
|-------|----------|-------------|
| `pixel` | Retro games | 8-bit/16-bit pixel art sprites |
| `anime` | Visual novels, JRPGs | Chibi/anime style characters |
| `lowpoly` | Mobile games | Low polygon count, flat shading |
| `painterly` | Fantasy games | Hand-painted, concept art style |
| `voxel` | Minecraft-like | 3D cube-based characters |

## Animation Types

| Animation | Duration | Use Case |
|-----------|----------|----------|
| `idle` | 4s | Standing/breathing loop |
| `walk` | 4s | 8-direction walk cycle |
| `run` | 3s | Running animation |
| `attack` | 2s | Weapon/magic attack |
| `jump` | 2s | Jump arc |
| `death` | 3s | Death sequence |
| `hurt` | 1s | Damage reaction |

## Skeleton Types

| Type | Bones | Use Case |
|------|-------|----------|
| `biped` | 25 | Humanoid characters |
| `quadruped` | 32 | Four-legged creatures |
| `custom` | 20 | Non-standard characters |

## Pipeline Stages

### Stage 1: Image Generation
```bash
npm run dev -- image-gen -p "cute wizard" -s anime -r 512
```

**Providers:**
- `openai` - DALL-E 3 (default)
- `stability` - Stable Diffusion XL
- `pixellab` - Specialized pixel art

### Stage 2: Video Animation
```bash
npm run dev -- animate -i ./output/sprite.png -t idle,walk
```

**Providers:**
- `veo` - Google Veo 3.1 (default)
- `runway` - Runway Gen-3
- `placeholder` - Static placeholder

### Stage 3: 3D Rigging
```bash
npm run dev -- rig-3d -i ./output/sprite.png -k biped
```

**Providers:**
- `tripo` - Tripo AI (default)
- `placeholder` - Placeholder model

### Stage 4: Three.js Export
```bash
npm run dev -- export -i ./output/model/rigged.glb
```

**Formats:** GLB (default), GLTF

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

## Required API Keys

Set in `.env` file:
```
OPENAI_API_KEY=sk-...        # DALL-E image generation
GOOGLE_API_KEY=...           # Veo video animation
TRIPO_API_KEY=...            # 3D rigging
```

## Example Workflows

### Basic Character
```bash
npm run dev -- generate -p "pixel art knight" -s pixel -a idle
```

### Full Animation Set
```bash
npm run dev -- generate \
  -p "anime wizard with staff" \
  -s anime \
  -a idle,walk,attack,death \
  -k biped
```

### Quadruped Creature
```bash
npm run dev -- generate \
  -p "cute pixel dragon" \
  -s pixel \
  -k quadruped \
  -a idle,walk
```

### JSON Output
```bash
npm run dev -- --json generate -p "robot warrior"
```

## Verification Checklist

After generation, verify:
- [ ] Sprite PNG has transparent background
- [ ] Animations loop seamlessly
- [ ] 3D model proportions match sprite
- [ ] Rigging allows natural movement
- [ ] GLB loads in preview.html
- [ ] File size < 5MB for web

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API key not set | Run `npm run dev -- check` |
| Image gen fails | Try simpler prompt, check quota |
| Animation fails | Falls back to placeholder |
| Rigging fails | Check Tripo API key/credits |
| Large file size | Use `--face-limit` option |

## Integration Examples

### Three.js
```javascript
import { CharacterLoader } from './integration.js';

const character = new CharacterLoader(scene);
await character.load('./model/rigged.glb');
character.playAnimation('idle');
```

### React Three Fiber
```tsx
import CharacterViewer from './CharacterViewer';

<CharacterViewer animation="walk" />
```

## Related Files

- `/src/image-gen/` - Image generation module
- `/src/video-gen/` - Video animation module
- `/src/rigging/` - 3D rigging module
- `/src/threejs-export/` - Export module
- `/src/cli/` - CLI implementation
