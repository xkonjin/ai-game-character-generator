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
- Export game-ready assets for Three.js/WebGL projects

## Pipeline Stages

### Stage 1: Image Generation
Generate the base character sprite using AI image generation.

**Supported Providers:**
- **DALL-E 3** (OpenAI) - Best for stylized/artistic characters
- **Stable Diffusion** - Best for pixel art with specialized models
- **PixelLab** - Best for true pixel art with animation support

**Prompt Engineering:**
```
Style prefix: "pixel art sprite sheet, game asset, transparent background, "
Character: "{user description}"
Style suffix: ", 8-bit style, clean edges, game-ready"
```

### Stage 2: Video Animation (Google Veo 3.1)
Animate the static sprite into looping sequences.

**API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1`

**Animation Types:**
- `idle` - Subtle breathing/movement loop (2-4 seconds)
- `walk` - Walk cycle (4 seconds, 8 frames)
- `run` - Running animation (3 seconds)
- `attack` - Attack sequence (2 seconds)
- `jump` - Jump arc (2 seconds)

**Veo Request Format:**
```json
{
  "model": "veo-3.1",
  "prompt": "Animate this character in a smooth {animation_type} loop, maintain character consistency, seamless loop",
  "image": "{base64_sprite}",
  "duration": "4s",
  "aspect_ratio": "1:1"
}
```

### Stage 3: 3D Rigging (Tripo AI)
Convert 2D animation to rigged 3D model.

**API Endpoint:** `https://api.tripo3d.ai/v2/openapi/task`

**Workflow:**
1. Submit image-to-3D task
2. Poll for completion
3. Apply auto-rigging with skeleton type
4. Download GLB output

**Tripo Request:**
```json
{
  "type": "image_to_model",
  "file": "{image_or_video}",
  "model_version": "v2.5-20250117",
  "face_limit": 10000,
  "texture": true,
  "pbr": true
}
```

**Rigging Request:**
```json
{
  "type": "rig",
  "original_model_task_id": "{model_task_id}",
  "rig_type": "biped"  // or "quadruped", "custom"
}
```

### Stage 4: Three.js Export
Prepare the rigged model for Three.js integration.

**Export Format:** GLB (binary GLTF)

**Three.js Loading:**
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('character.glb', (gltf) => {
  const model = gltf.scene;
  const animations = gltf.animations;
  scene.add(model);
  
  const mixer = new THREE.AnimationMixer(model);
  animations.forEach((clip) => {
    mixer.clipAction(clip).play();
  });
});
```

## Required Configuration

Ensure these environment variables are set:
- `OPENAI_API_KEY` - For DALL-E image generation
- `GOOGLE_CLOUD_PROJECT` - For Veo API access
- `TRIPO_API_KEY` - For 3D rigging

## Execution Steps

1. **Parse user request** - Extract character description, style, and animation types
2. **Generate base sprite** - Call image generation API with optimized prompt
3. **Create animation** - Use Veo to animate the sprite into loops
4. **Generate 3D model** - Submit to Tripo for image-to-3D conversion
5. **Apply rigging** - Auto-rig the model with appropriate skeleton
6. **Export GLB** - Download and save the final asset
7. **Generate preview** - Create a simple Three.js preview HTML file

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Character description |
| `style` | enum | "pixel" | pixel, anime, lowpoly, painterly, voxel |
| `animations` | array | ["idle"] | Animation types to generate |
| `resolution` | number | 512 | Output resolution |
| `skeleton` | enum | "biped" | biped, quadruped, custom |
| `output_dir` | string | "./output" | Output directory |

## Output Artifacts

```
output/
├── {character_name}/
│   ├── sprite.png           # Base sprite image
│   ├── sprite_sheet.png     # Animation sprite sheet
│   ├── animations/
│   │   ├── idle.mp4         # Veo animation video
│   │   ├── walk.mp4
│   │   └── ...
│   ├── model/
│   │   ├── base.glb         # Unrigged 3D model
│   │   └── rigged.glb       # Rigged 3D model
│   ├── preview.html         # Three.js preview
│   └── metadata.json        # Generation metadata
```

## Error Handling

- **Image generation fails**: Retry with simplified prompt, reduce detail
- **Veo animation fails**: Fall back to frame interpolation
- **Tripo rigging fails**: Export unrigged model, flag for manual rigging
- **API rate limits**: Implement exponential backoff

## Verification

After completion, verify:
1. [ ] Base sprite matches description
2. [ ] Animation loops smoothly
3. [ ] 3D model has correct proportions
4. [ ] Rigging allows natural movement
5. [ ] GLB loads correctly in Three.js
6. [ ] File sizes are optimized for web

## Example Usage

**User request:** "Create a cute pixel art knight with idle and walk animations"

**Execution:**
1. Generate knight sprite with DALL-E: "pixel art sprite, cute knight character, silver armor, sword, 8-bit style, game asset"
2. Animate with Veo: idle breathing loop, 8-frame walk cycle
3. Convert to 3D with Tripo: image-to-model, biped rigging
4. Export GLB with embedded animations
5. Create preview.html with Three.js viewer

**Output:** `./output/cute_knight/rigged.glb` + preview
