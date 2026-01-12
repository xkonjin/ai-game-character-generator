# GitHub Issues for AI Game Character Generator

Copy each section below to create GitHub issues for the project.

---

## Issue #1: Core Infrastructure Setup

**Title:** [Infra] Set up project infrastructure and CI/CD

**Labels:** infrastructure, setup, priority-high

**Description:**
Set up the foundational project infrastructure including:

### Tasks
- [ ] Initialize npm package with proper metadata
- [ ] Configure TypeScript with strict settings
- [ ] Set up ESLint and Prettier
- [ ] Add Vitest for testing
- [ ] Create GitHub Actions workflow for CI
- [ ] Add Dependabot configuration
- [ ] Create release workflow

### Acceptance Criteria
- `npm run build` compiles without errors
- `npm run lint` passes
- `npm run test` runs successfully
- CI runs on push/PR to main

---

## Issue #2: Image Generation Module

**Title:** [Feature] Implement multi-provider image generation

**Labels:** feature, image-gen, priority-high

**Description:**
Implement the image generation module with support for multiple AI providers.

### Tasks
- [ ] Create base image generator interface
- [ ] Implement DALL-E 3 provider
  - [ ] API client setup
  - [ ] Prompt optimization for game sprites
  - [ ] Image post-processing (transparency, sizing)
- [ ] Implement Stable Diffusion provider (optional)
  - [ ] Support for pixel art models (pixel-sprite)
- [ ] Implement PixelLab provider (optional)
  - [ ] Sprite sheet generation
  - [ ] Animation frame support
- [ ] Style-specific prompt templates
  - [ ] Pixel art (8-bit, 16-bit, 32-bit)
  - [ ] Anime/Chibi
  - [ ] Low poly
  - [ ] Painterly
  - [ ] Voxel
- [ ] Add retry logic with exponential backoff
- [ ] Unit tests for prompt optimization

### API Reference
- OpenAI: https://platform.openai.com/docs/api-reference/images
- Stable Diffusion: https://stablediffusionapi.com/docs

### Acceptance Criteria
- Can generate sprites from text prompts
- Supports at least 2 art styles
- Handles API errors gracefully
- Outputs PNG with transparency

---

## Issue #3: Video Animation with Google Veo

**Title:** [Feature] Implement Veo 3.1 video animation integration

**Labels:** feature, video-gen, priority-high

**Description:**
Integrate Google Veo 3.1 for animating static sprites into looping sequences.

### Tasks
- [ ] Set up Google Cloud authentication
- [ ] Implement Veo API client
  - [ ] Image-to-video generation
  - [ ] Prompt engineering for animation types
  - [ ] Duration and aspect ratio configuration
- [ ] Animation type templates
  - [ ] Idle loop (breathing, subtle movement)
  - [ ] Walk cycle (8-frame)
  - [ ] Run cycle
  - [ ] Attack sequence
  - [ ] Jump arc
  - [ ] Death/hurt reactions
- [ ] Video post-processing
  - [ ] Loop seamlessness check
  - [ ] Frame extraction for sprite sheets
- [ ] Fallback to frame interpolation if Veo fails
- [ ] Unit tests for animation prompts

### API Reference
- Veo 3.1: https://ai.google.dev/gemini-api/docs/video
- Vertex AI: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/overview

### Acceptance Criteria
- Can animate sprites into 4-8 second loops
- Supports at least 4 animation types
- Outputs MP4 video files
- Handles API quota limits

---

## Issue #4: Tripo AI 3D Rigging Integration

**Title:** [Feature] Implement Tripo AI 3D model generation and rigging

**Labels:** feature, rigging, priority-high

**Description:**
Integrate Tripo AI for converting 2D sprites to rigged 3D models.

### Tasks
- [ ] Implement Tripo API client
  - [ ] Authentication with API key
  - [ ] Task creation and polling
  - [ ] File upload handling
- [ ] Image-to-3D conversion
  - [ ] Support for PNG input
  - [ ] Model version selection (v2.5)
  - [ ] Face limit and texture options
- [ ] Auto-rigging workflow
  - [ ] Biped skeleton
  - [ ] Quadruped skeleton
  - [ ] Custom skeleton support
- [ ] Model download and processing
  - [ ] GLB format export
  - [ ] FBX format export (optional)
- [ ] Task status monitoring with progress
- [ ] Error handling for failed tasks
- [ ] Unit tests for API interactions

### API Reference
- Tripo API: https://www.tripo3d.ai/api
- Documentation: https://tripo3d.ai/blog/tripo-studio-tutorial-english

### Acceptance Criteria
- Can convert 2D sprite to 3D model
- Auto-rigging produces usable skeleton
- Downloads GLB file successfully
- Handles task failures gracefully

---

## Issue #5: Three.js Export and Preview

**Title:** [Feature] Implement Three.js export and preview generation

**Labels:** feature, export, priority-medium

**Description:**
Create export functionality for Three.js integration including preview generation.

### Tasks
- [ ] GLB optimization
  - [ ] File size checking
  - [ ] Texture compression (optional)
  - [ ] Mesh decimation (optional)
- [ ] Preview HTML generation
  - [ ] Three.js scene setup
  - [ ] OrbitControls for interaction
  - [ ] Animation playback UI
  - [ ] Lighting and grid
- [ ] Code snippet generation
  - [ ] GLTFLoader setup
  - [ ] AnimationMixer setup
  - [ ] Scene integration examples
- [ ] Unity export format (optional)
- [ ] Unreal export format (optional)
- [ ] Unit tests for HTML generation

### Acceptance Criteria
- Generates working preview.html
- GLB loads correctly in preview
- Animation controls work
- Code snippets are correct

---

## Issue #6: CLI Implementation

**Title:** [Feature] Implement full CLI with Commander.js

**Labels:** feature, cli, priority-high

**Description:**
Create a comprehensive CLI for running the character generation pipeline.

### Tasks
- [ ] Main `generate` command
  - [ ] All pipeline options
  - [ ] Progress indicators with ora
  - [ ] Summary output
- [ ] Individual step commands
  - [ ] `image-gen` - Generate sprite only
  - [ ] `animate` - Animate existing sprite
  - [ ] `rig-3d` - Convert to 3D and rig
  - [ ] `export` - Export for Three.js
- [ ] Configuration
  - [ ] .env file support
  - [ ] Config file support (optional)
  - [ ] Default values
- [ ] Output formatting
  - [ ] JSON output option
  - [ ] Quiet mode
  - [ ] Verbose mode
- [ ] Help documentation
- [ ] Error messages and recovery suggestions
- [ ] Integration tests for CLI

### Acceptance Criteria
- All commands work as documented
- Progress is shown during long operations
- Errors are clear and actionable
- Help text is comprehensive

---

## Issue #7: Factory Droid Skill

**Title:** [Feature] Create Factory Droid skill for character generation

**Labels:** feature, skill, priority-medium

**Description:**
Create a Factory Droid skill that enables AI-assisted character generation.

### Tasks
- [ ] Skill definition (SKILL.md)
  - [ ] Clear description and triggers
  - [ ] Pipeline stage documentation
  - [ ] Input parameters
  - [ ] Output artifacts
- [ ] Custom droid configuration
  - [ ] Model selection
  - [ ] Tool permissions
  - [ ] System prompt
- [ ] Integration examples
  - [ ] Basic usage
  - [ ] Batch generation
  - [ ] Custom styling

### Acceptance Criteria
- Skill is discovered by Factory CLI
- Can be invoked from chat
- Produces expected outputs
- Documentation is complete

---

## Issue #8: Testing Suite

**Title:** [Testing] Comprehensive test coverage

**Labels:** testing, priority-medium

**Description:**
Implement comprehensive testing for all modules.

### Tasks
- [ ] Unit tests
  - [ ] Prompt optimization
  - [ ] API client mocking
  - [ ] File operations
  - [ ] Type validation
- [ ] Integration tests
  - [ ] Full pipeline (with mocks)
  - [ ] CLI commands
  - [ ] Error scenarios
- [ ] E2E tests (optional)
  - [ ] Real API calls (rate-limited)
  - [ ] Output validation
- [ ] Test utilities
  - [ ] Mock API responses
  - [ ] Test fixtures
  - [ ] Snapshot testing

### Acceptance Criteria
- >80% code coverage
- All critical paths tested
- CI runs tests on every PR
- Tests are fast (<30s)

---

## Issue #9: Documentation

**Title:** [Docs] Complete project documentation

**Labels:** documentation, priority-low

**Description:**
Create comprehensive documentation for users and contributors.

### Tasks
- [ ] README.md
  - [ ] Quick start guide
  - [ ] Installation instructions
  - [ ] Usage examples
  - [ ] API key setup
- [ ] API documentation
  - [ ] Module exports
  - [ ] Type definitions
  - [ ] Example code
- [ ] Contributing guide
- [ ] Changelog
- [ ] Examples directory
  - [ ] Basic character
  - [ ] Animated sprite
  - [ ] 3D model with rigging
  - [ ] Three.js integration

### Acceptance Criteria
- README covers all basics
- API is documented
- Examples are runnable
- Contributing guide exists

---

## Issue #10: Alternative Image Providers

**Title:** [Enhancement] Add Stable Diffusion and PixelLab providers

**Labels:** enhancement, priority-low

**Description:**
Add support for alternative image generation providers optimized for pixel art.

### Tasks
- [ ] Stable Diffusion API integration
  - [ ] pixel-sprite model support
  - [ ] Custom checkpoint loading
- [ ] PixelLab integration
  - [ ] Sprite sheet generation
  - [ ] Multi-direction views
  - [ ] Animation frame export
- [ ] Provider selection logic
  - [ ] Auto-select based on style
  - [ ] Manual override
- [ ] Comparison documentation

### API Reference
- Stable Diffusion: https://stablediffusionapi.com/models/pixel-sprite
- PixelLab: https://www.pixellab.ai/

---

## Issue #11: Animation Sprite Sheet Export

**Title:** [Enhancement] Export animations as sprite sheets

**Labels:** enhancement, priority-medium

**Description:**
Add ability to export Veo animations as traditional sprite sheets.

### Tasks
- [ ] Video frame extraction
  - [ ] FFmpeg integration
  - [ ] Frame rate selection
- [ ] Sprite sheet generation
  - [ ] Grid layout
  - [ ] Individual frames
  - [ ] Atlas JSON metadata
- [ ] Format options
  - [ ] PNG sprite sheet
  - [ ] GIF animation
  - [ ] WebP animation

### Acceptance Criteria
- Can extract frames from video
- Generates proper sprite sheet
- Includes metadata for engines

---

## Issue #12: Batch Processing

**Title:** [Enhancement] Batch character generation

**Labels:** enhancement, priority-low

**Description:**
Add support for generating multiple characters in batch.

### Tasks
- [ ] Batch input format (JSON/YAML)
- [ ] Parallel processing with rate limiting
- [ ] Progress tracking for batch
- [ ] Error recovery (continue on failure)
- [ ] Batch summary report

### Example Input
```json
{
  "characters": [
    { "name": "knight", "prompt": "pixel art knight", "style": "pixel" },
    { "name": "wizard", "prompt": "anime wizard", "style": "anime" }
  ]
}
```

---

## Issue #13: Web UI

**Title:** [Enhancement] Web-based UI for character generation

**Labels:** enhancement, priority-low

**Description:**
Create a simple web interface for non-technical users.

### Tasks
- [ ] React/Next.js frontend
- [ ] Character preview canvas
- [ ] Style selector
- [ ] Animation preview
- [ ] Download options
- [ ] Gallery of generated characters

---

## Issue #14: Model Optimization

**Title:** [Enhancement] 3D model optimization for web

**Labels:** enhancement, priority-medium

**Description:**
Add model optimization to reduce file size for web deployment.

### Tasks
- [ ] Mesh decimation
- [ ] Texture compression (KTX2/Draco)
- [ ] Animation optimization
- [ ] LOD generation
- [ ] gltf-transform integration

### Acceptance Criteria
- Can reduce model size by 50%+
- Quality loss is minimal
- Supports Draco compression

---

## Issue #15: Rate Limiting and Cost Management

**Title:** [Feature] Add rate limiting and cost estimation

**Labels:** feature, priority-medium

**Description:**
Add rate limiting to prevent API abuse and cost tracking.

### Tasks
- [ ] Rate limiter for each provider
- [ ] Cost estimation before generation
- [ ] Usage tracking and reporting
- [ ] Budget limits (optional)
- [ ] Caching for repeated requests

### Acceptance Criteria
- Respects API rate limits
- Shows estimated cost
- Tracks usage over time
