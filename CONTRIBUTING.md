# Contributing to AI Game Character Generator

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-game-character-generator.git
   cd ai-game-character-generator
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

## Development Workflow

### Running the Project

```bash
# Development mode
npm run dev -- generate -p "test character" -s pixel

# Build
npm run build

# Run tests
npm run test
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Project Structure

```
src/
├── cli/              # CLI implementation
├── image-gen/        # Image generation module
├── video-gen/        # Video animation module
├── rigging/          # 3D rigging module
├── threejs-export/   # Export module
├── types.ts          # TypeScript types
└── index.ts          # Main exports

tests/
├── image-gen.test.ts
├── video-gen.test.ts
├── rigging.test.ts
├── threejs-export.test.ts
├── cli.test.ts
└── integration.test.ts
```

## Making Changes

### Creating a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Code Style

- **TypeScript**: Use strict mode
- **ESLint**: Follow the configured rules
- **Prettier**: Format code before committing
- **Comments**: Only add necessary comments

### Commit Messages

Follow conventional commits:

```
type(scope): description

feat(image-gen): add support for PixelLab provider
fix(cli): handle missing API key gracefully
docs(readme): update installation instructions
test(rigging): add skeleton configuration tests
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

### Testing

- Add tests for new features
- Ensure all tests pass before submitting
- Run `npm run test` locally

### Pull Requests

1. Update documentation if needed
2. Run all checks:
   ```bash
   npm run lint && npm run test && npm run build
   ```
3. Push your branch and create a PR
4. Fill out the PR template
5. Wait for review

## Adding New Providers

### Image Generation Provider

1. Add provider to `src/image-gen/index.ts`:
   ```typescript
   async function generateWithNewProvider(
     prompt: string,
     outputDir: string,
     resolution: number
   ): Promise<ImageGenResult> {
     // Implementation
   }
   ```

2. Update `ImageProvider` type
3. Add to switch statement in `generateImage()`
4. Add tests in `tests/image-gen.test.ts`

### Video Animation Provider

1. Add provider to `src/video-gen/index.ts`
2. Update `VideoProvider` type
3. Add to switch statement in `animateSprite()`
4. Add tests

### Rigging Provider

1. Add provider to `src/rigging/index.ts`
2. Update `RiggingProvider` type
3. Add to switch statement in `generateAndRig3DModel()`
4. Add tests

## API Keys for Testing

For testing with real APIs, you'll need:

| API | Get Key At |
|-----|-----------|
| OpenAI | https://platform.openai.com/api-keys |
| Google | https://console.cloud.google.com |
| Tripo | https://tripo3d.ai |

Use `placeholder` providers for tests that don't require API calls.

## Issues and Feature Requests

- Check existing issues before creating new ones
- Use issue templates when available
- Provide clear reproduction steps for bugs
- Include examples for feature requests

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Questions?

Open an issue with the `question` label or reach out to maintainers.
