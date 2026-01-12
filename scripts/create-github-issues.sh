#!/bin/bash

# Script to create GitHub issues for the AI Game Character Generator project
# Usage: ./scripts/create-github-issues.sh

set -e

REPO_NAME="ai-game-character-generator"

echo "Creating GitHub issues for $REPO_NAME..."
echo "Make sure you're authenticated with 'gh auth login' first."
echo ""

# Issue 1: Infrastructure
gh issue create \
  --title "[Infra] Set up project infrastructure and CI/CD" \
  --label "infrastructure,setup,priority-high" \
  --body "## Description
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
- \`npm run build\` compiles without errors
- \`npm run lint\` passes
- \`npm run test\` runs successfully
- CI runs on push/PR to main"

# Issue 2: Image Generation
gh issue create \
  --title "[Feature] Implement multi-provider image generation" \
  --label "feature,image-gen,priority-high" \
  --body "## Description
Implement the image generation module with support for multiple AI providers.

### Tasks
- [ ] Create base image generator interface
- [ ] Implement DALL-E 3 provider
- [ ] Implement Stable Diffusion provider (optional)
- [ ] Implement PixelLab provider (optional)
- [ ] Style-specific prompt templates (pixel, anime, lowpoly, painterly, voxel)
- [ ] Add retry logic with exponential backoff
- [ ] Unit tests for prompt optimization

### API Reference
- OpenAI: https://platform.openai.com/docs/api-reference/images

### Acceptance Criteria
- Can generate sprites from text prompts
- Supports at least 2 art styles
- Handles API errors gracefully
- Outputs PNG with transparency"

# Issue 3: Video Animation
gh issue create \
  --title "[Feature] Implement Veo 3.1 video animation integration" \
  --label "feature,video-gen,priority-high" \
  --body "## Description
Integrate Google Veo 3.1 for animating static sprites into looping sequences.

### Tasks
- [ ] Set up Google Cloud authentication
- [ ] Implement Veo API client
- [ ] Animation type templates (idle, walk, run, attack, jump, death)
- [ ] Video post-processing and loop check
- [ ] Fallback to frame interpolation if Veo fails
- [ ] Unit tests for animation prompts

### API Reference
- Veo 3.1: https://ai.google.dev/gemini-api/docs/video

### Acceptance Criteria
- Can animate sprites into 4-8 second loops
- Supports at least 4 animation types
- Outputs MP4 video files
- Handles API quota limits"

# Issue 4: Tripo 3D Rigging
gh issue create \
  --title "[Feature] Implement Tripo AI 3D model generation and rigging" \
  --label "feature,rigging,priority-high" \
  --body "## Description
Integrate Tripo AI for converting 2D sprites to rigged 3D models.

### Tasks
- [ ] Implement Tripo API client
- [ ] Image-to-3D conversion with PNG input
- [ ] Auto-rigging workflow (biped, quadruped, custom)
- [ ] Model download (GLB, FBX)
- [ ] Task status monitoring with progress
- [ ] Error handling for failed tasks
- [ ] Unit tests for API interactions

### API Reference
- Tripo API: https://www.tripo3d.ai/api

### Acceptance Criteria
- Can convert 2D sprite to 3D model
- Auto-rigging produces usable skeleton
- Downloads GLB file successfully
- Handles task failures gracefully"

# Issue 5: Three.js Export
gh issue create \
  --title "[Feature] Implement Three.js export and preview generation" \
  --label "feature,export,priority-medium" \
  --body "## Description
Create export functionality for Three.js integration including preview generation.

### Tasks
- [ ] GLB optimization
- [ ] Preview HTML generation with Three.js
- [ ] Code snippet generation
- [ ] Unit tests for HTML generation

### Acceptance Criteria
- Generates working preview.html
- GLB loads correctly in preview
- Animation controls work
- Code snippets are correct"

# Issue 6: CLI
gh issue create \
  --title "[Feature] Implement full CLI with Commander.js" \
  --label "feature,cli,priority-high" \
  --body "## Description
Create a comprehensive CLI for running the character generation pipeline.

### Tasks
- [ ] Main \`generate\` command with all options
- [ ] Individual step commands (image-gen, animate, rig-3d, export)
- [ ] Configuration (.env, config file)
- [ ] Output formatting (JSON, quiet, verbose)
- [ ] Help documentation
- [ ] Integration tests for CLI

### Acceptance Criteria
- All commands work as documented
- Progress is shown during long operations
- Errors are clear and actionable
- Help text is comprehensive"

# Issue 7: Factory Skill
gh issue create \
  --title "[Feature] Create Factory Droid skill for character generation" \
  --label "feature,skill,priority-medium" \
  --body "## Description
Create a Factory Droid skill that enables AI-assisted character generation.

### Tasks
- [ ] Skill definition (SKILL.md)
- [ ] Custom droid configuration
- [ ] Integration examples

### Acceptance Criteria
- Skill is discovered by Factory CLI
- Can be invoked from chat
- Produces expected outputs
- Documentation is complete"

# Issue 8: Testing
gh issue create \
  --title "[Testing] Comprehensive test coverage" \
  --label "testing,priority-medium" \
  --body "## Description
Implement comprehensive testing for all modules.

### Tasks
- [ ] Unit tests (prompt optimization, API mocking, file ops)
- [ ] Integration tests (full pipeline, CLI commands)
- [ ] Test utilities (mock responses, fixtures)

### Acceptance Criteria
- >80% code coverage
- All critical paths tested
- CI runs tests on every PR
- Tests are fast (<30s)"

# Issue 9: Documentation
gh issue create \
  --title "[Docs] Complete project documentation" \
  --label "documentation,priority-low" \
  --body "## Description
Create comprehensive documentation for users and contributors.

### Tasks
- [ ] README.md with quick start
- [ ] API documentation
- [ ] Contributing guide
- [ ] Changelog
- [ ] Examples directory

### Acceptance Criteria
- README covers all basics
- API is documented
- Examples are runnable
- Contributing guide exists"

# Issue 10: Sprite Sheet Export
gh issue create \
  --title "[Enhancement] Export animations as sprite sheets" \
  --label "enhancement,priority-medium" \
  --body "## Description
Add ability to export Veo animations as traditional sprite sheets.

### Tasks
- [ ] Video frame extraction (FFmpeg)
- [ ] Sprite sheet generation (grid layout)
- [ ] Format options (PNG, GIF, WebP)

### Acceptance Criteria
- Can extract frames from video
- Generates proper sprite sheet
- Includes metadata for engines"

echo ""
echo "✅ All issues created successfully!"
echo "View them at: https://github.com/YOUR_USERNAME/$REPO_NAME/issues"
