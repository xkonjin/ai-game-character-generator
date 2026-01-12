# AI Game Character Generator

An end-to-end pipeline for creating animated 3D game characters from text/image prompts using AI.

## Pipeline Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  Image Gen      │───▶│  Veo Video   │───▶│  Tripo 3D       │───▶│  Three.js Export │
│  (Pixel Art /   │    │  Animation   │    │  Rigging        │    │  (GLB/GLTF)      │
│  Cute Sprites)  │    │  Loops       │    │  Auto-skeleton  │    │  Game-ready      │
└─────────────────┘    └──────────────┘    └─────────────────┘    └──────────────────┘
```

## Features

- **Image Generation**: Create cute pixel art or stylized game characters using AI (DALL-E, Stable Diffusion, PixelLab)
- **Video Animation**: Animate characters into looping sequences using Google Veo 3.1
- **3D Rigging**: Convert 2D sprites to rigged 3D models using Tripo AI auto-rigging
- **Three.js Export**: Export as GLB/GLTF files ready for Three.js game integration

## Installation

```bash
npm install
cp .env.example .env
# Add your API keys to .env
```

## Required API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| OpenAI | DALL-E image generation | [platform.openai.com](https://platform.openai.com) |
| Google Cloud | Veo video generation | [console.cloud.google.com](https://console.cloud.google.com) |
| Tripo AI | 3D rigging & export | [tripo3d.ai](https://tripo3d.ai) |

## Usage

### CLI

```bash
# Generate a complete character pipeline
npm run generate -- --prompt "cute pixel art knight character" --style pixel --output ./output

# Individual steps
npm run image-gen -- --prompt "cute wizard sprite"
npm run animate -- --input ./sprite.png --duration 4s --loop
npm run rig-3d -- --input ./animation.mp4 --skeleton bipedal
npm run export -- --input ./model.glb --format threejs
```

### As a Factory Droid Skill

This project includes a Factory Droid skill for automated character generation:

```
droid> Use the ai-game-character-pipeline skill to create a cute pixel knight that can walk and attack
```

## Project Structure

```
├── .factory/
│   ├── skills/
│   │   └── ai-game-character-pipeline/
│   │       └── SKILL.md
│   └── droids/
│       └── game-character-creator.md
├── src/
│   ├── image-gen/         # Image generation modules
│   ├── video-gen/         # Veo video animation
│   ├── rigging/           # Tripo 3D rigging
│   ├── threejs-export/    # GLB/GLTF export
│   └── cli/               # CLI interface
├── scripts/               # Utility scripts
├── examples/              # Example outputs
├── docs/                  # Documentation
└── tests/                 # Test suite
```

## Supported Character Styles

- **Pixel Art** (8-bit, 16-bit, 32-bit)
- **Anime/Chibi**
- **Low Poly**
- **Painterly**
- **Voxel**

## Animation Types

- Idle loops
- Walk cycles (4 and 8 directional)
- Run cycles
- Attack sequences
- Jump animations
- Death/hurt animations

## License

MIT
