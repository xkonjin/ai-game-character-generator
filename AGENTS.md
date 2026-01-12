# AGENTS.md - AI Game Character Generator

## Project Overview
This project creates an end-to-end pipeline for generating animated 3D game characters from text prompts using:
1. AI image generation (DALL-E, Stable Diffusion, PixelLab)
2. Video animation (Google Veo 3.1)
3. 3D rigging (Tripo AI)
4. Three.js export (GLB/GLTF)

## Core Commands

```bash
# Install dependencies
npm install

# Run full pipeline
npm run generate -- --prompt "cute pixel knight" --style pixel --animations idle,walk

# Individual steps
npm run image-gen -- --prompt "..." --style pixel
npm run animate -- --input sprite.png --types idle,walk
npm run rig-3d -- --input sprite.png --skeleton biped
npm run export -- --input model.glb

# Development
npm run dev           # Run CLI in dev mode
npm run build         # Compile TypeScript
npm run test          # Run tests
npm run lint          # Lint code
```

## Project Structure

```
src/
├── image-gen/       # DALL-E, Stable Diffusion integration
├── video-gen/       # Google Veo 3.1 integration
├── rigging/         # Tripo AI 3D rigging
├── threejs-export/  # GLB export and preview generation
├── cli/             # Commander.js CLI
├── types.ts         # TypeScript type definitions
└── index.ts         # Main exports

.factory/
├── skills/          # Factory Droid skills
└── droids/          # Custom droid definitions
```

## API Keys Required

All keys should be in `.env`:
- `OPENAI_API_KEY` - DALL-E image generation
- `GOOGLE_CLOUD_PROJECT` - Veo video generation
- `GOOGLE_API_KEY` - Gemini/Veo API
- `TRIPO_API_KEY` - Tripo 3D rigging

## Coding Conventions

- **TypeScript**: Strict mode, ES modules
- **Async/Await**: All API calls use async/await
- **Error Handling**: Wrap API calls in try/catch with descriptive errors
- **Logging**: Use `[ModuleName]` prefix for console logs
- **Types**: Export interfaces from `types.ts`

## Testing

```bash
npm run test              # Run all tests
npm run test -- --watch   # Watch mode
```

Tests should cover:
- Prompt optimization for each style
- API error handling
- File I/O operations
- Pipeline orchestration

## Git Workflow

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Run `npm run lint && npm run test` before committing
4. Create PR with description of changes

## Key Dependencies

- `openai` - DALL-E API client
- `@google-cloud/aiplatform` - Veo API
- `commander` - CLI framework
- `ora` - Terminal spinners
- `three` - Three.js types
- `zod` - Runtime validation
