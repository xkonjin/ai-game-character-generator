# API Documentation

## Image Generation Module

### `generateImage(prompt, style, outputDir, options?)`

Generate a character sprite from a text prompt.

```typescript
import { generateImage } from 'ai-game-character-generator';

const result = await generateImage(
  'cute pixel knight with sword',
  'pixel',
  './output',
  {
    resolution: 512,
    provider: 'openai',
    maxRetries: 3,
    retryDelay: 1000,
  }
);
```

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prompt | string | Yes | - | Character description |
| style | CharacterStyle | Yes | - | Art style |
| outputDir | string | Yes | - | Output directory |
| options.resolution | number | No | 512 | Image resolution |
| options.provider | ImageProvider | No | 'openai' | Generation provider |
| options.maxRetries | number | No | 3 | Max retry attempts |
| options.retryDelay | number | No | 1000 | Delay between retries (ms) |

**Returns:** `Promise<ImageGenResult>`

### `optimizePrompt(userPrompt, style)`

Optimize a user prompt for a specific art style.

```typescript
import { optimizePrompt } from 'ai-game-character-generator';

const fullPrompt = optimizePrompt('knight with sword', 'pixel');
// "pixel art sprite sheet, game asset, transparent background, knight with sword, 8-bit style, clean edges, no anti-aliasing, game-ready"
```

### `getSupportedProviders()`

Get list of supported image providers.

```typescript
const providers = getSupportedProviders();
// ['openai', 'stability', 'pixellab']
```

---

## Video Generation Module

### `animateSprite(spritePath, animationType, outputDir, options?)`

Animate a sprite into a looping video.

```typescript
import { animateSprite } from 'ai-game-character-generator';

const result = await animateSprite(
  './sprite.png',
  'walk',
  './output',
  {
    duration: '4s',
    provider: 'veo',
    maxRetries: 3,
  }
);
```

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| spritePath | string | Yes | - | Path to sprite image |
| animationType | AnimationType | Yes | - | Animation type |
| outputDir | string | Yes | - | Output directory |
| options.duration | string | No | varies | Animation duration |
| options.provider | VideoProvider | No | 'veo' | Video provider |
| options.maxRetries | number | No | 3 | Max retry attempts |

**Returns:** `Promise<VideoGenResult>`

### `createAnimationBatch(spritePath, animations, outputDir, options?)`

Create multiple animations from a single sprite.

```typescript
const results = await createAnimationBatch(
  './sprite.png',
  ['idle', 'walk', 'run'],
  './output'
);
```

### `getAnimationTypes()`

Get list of supported animation types.

```typescript
const types = getAnimationTypes();
// ['idle', 'walk', 'run', 'attack', 'jump', 'death', 'hurt']
```

### `getAnimationConfig(animationType)`

Get configuration for an animation type.

```typescript
const config = getAnimationConfig('walk');
// { prompt: '...', duration: '4s', fps: 24 }
```

---

## Rigging Module

### `generateAndRig3DModel(imagePath, outputDir, options?)`

Convert a 2D sprite to a rigged 3D model.

```typescript
import { generateAndRig3DModel } from 'ai-game-character-generator';

const result = await generateAndRig3DModel(
  './sprite.png',
  './output',
  {
    skeletonType: 'biped',
    provider: 'tripo',
    faceLimit: 10000,
    enableTexture: true,
    enablePBR: true,
  }
);
```

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| imagePath | string | Yes | - | Path to sprite image |
| outputDir | string | Yes | - | Output directory |
| options.skeletonType | SkeletonType | No | 'biped' | Skeleton type |
| options.provider | RiggingProvider | No | 'tripo' | Rigging provider |
| options.faceLimit | number | No | 10000 | Max faces in model |
| options.enableTexture | boolean | No | true | Include textures |
| options.enablePBR | boolean | No | true | Enable PBR materials |

**Returns:** `Promise<RiggingResult>`

### `getSkeletonTypes()`

Get list of supported skeleton types.

```typescript
const types = getSkeletonTypes();
// ['biped', 'quadruped', 'custom']
```

### `getSkeletonConfig(skeletonType)`

Get configuration for a skeleton type.

```typescript
const config = getSkeletonConfig('biped');
// { boneCount: 25, description: 'Humanoid skeleton...' }
```

### `checkTripoApiKey()`

Verify Tripo API key is valid.

```typescript
const isValid = await checkTripoApiKey();
```

---

## Three.js Export Module

### `exportForThreeJS(riggedModelPath, outputDir, options?)`

Export a rigged model for Three.js use.

```typescript
import { exportForThreeJS } from 'ai-game-character-generator';

const result = await exportForThreeJS(
  './model/rigged.glb',
  './output',
  {
    optimize: true,
    animations: ['idle', 'walk'],
    format: 'glb',
  }
);
```

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| riggedModelPath | string | Yes | - | Path to rigged model |
| outputDir | string | Yes | - | Output directory |
| options.optimize | boolean | No | true | Optimize for web |
| options.animations | string[] | No | [] | Animation names |
| options.format | ExportFormat | No | 'glb' | Output format |

**Returns:** `Promise<ExportResult>`

### `generateThreeJSCode(modelPath)`

Generate Three.js integration code.

```typescript
const code = generateThreeJSCode('character.glb');
```

### `validateGLBFile(filePath)`

Validate a GLB file.

```typescript
const { valid, error } = await validateGLBFile('./model.glb');
```

---

## Types

### CharacterStyle
```typescript
type CharacterStyle = 'pixel' | 'anime' | 'lowpoly' | 'painterly' | 'voxel';
```

### AnimationType
```typescript
type AnimationType = 'idle' | 'walk' | 'run' | 'attack' | 'jump' | 'death' | 'hurt';
```

### SkeletonType
```typescript
type SkeletonType = 'biped' | 'quadruped' | 'custom';
```

### ImageProvider
```typescript
type ImageProvider = 'openai' | 'stability' | 'pixellab';
```

### VideoProvider
```typescript
type VideoProvider = 'veo' | 'runway' | 'placeholder';
```

### RiggingProvider
```typescript
type RiggingProvider = 'tripo' | 'placeholder';
```

### ImageGenResult
```typescript
interface ImageGenResult {
  imagePath: string;
  prompt: string;
  provider: ImageProvider;
  metadata: Record<string, unknown>;
}
```

### VideoGenResult
```typescript
interface VideoGenResult {
  videoPath: string;
  animationType: AnimationType;
  duration: number;
  fps: number;
}
```

### RiggingResult
```typescript
interface RiggingResult {
  modelPath: string;
  riggedModelPath: string;
  skeletonType: SkeletonType;
  boneCount: number;
}
```

### ExportResult
```typescript
interface ExportResult {
  glbPath: string;
  previewPath: string;
  fileSize: number;
  animations: string[];
}
```
