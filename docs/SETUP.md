# Local Development Setup

## Prerequisites

- **Bun** 1.0+: [https://bun.sh](https://bun.sh)
- **Node.js** 18+ (for compatibility)
- **Git** 2.38+
- **Visual Studio Code** (recommended)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/khulnasoft-bot/design.md.git
cd design.md
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
bun install

# Or use the package manager specified in package.json
npm install  # if using npm
yarn install # if using yarn
```

### 3. Setup Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your configuration
nano .env.local
```

### 4. Verify Installation

```bash
# Run type checks
bun run type-check

# Run linter
bun run lint

# Run tests
bun run test

# Build all packages
bun run build
```

## Development Workflow

### Starting Development Servers

```bash
# Start all development servers (playground + MCP server)
bun run dev

# Or start individual packages
cd packages/playground && bun run dev
cd packages/mcp-server && bun run dev
cd packages/cli && bun run dev
```

### Available Commands

From the root directory:

```bash
# Building
bun run build              # Build all packages
bun run build:watch       # Build with watch mode
bun run build:analyze     # Build and analyze bundle size

# Development
bun run dev               # Start all dev servers
bun run dev:playground    # Start playground only
bun run dev:mcp          # Start MCP server only

# Testing
bun run test             # Run all tests
bun run test:watch      # Run tests in watch mode
bun run test:coverage   # Generate coverage reports

# Code Quality
bun run lint            # Run ESLint
bun run lint:fix        # Fix linting issues
bun run format          # Format with Prettier
bun run type-check      # TypeScript type checking

# Utilities
bun run clean           # Clean all dist and build folders
bun run graph           # Show dependency graph
```

### Package-Specific Commands

#### Playground (packages/playground)

```bash
cd packages/playground

bun run dev            # Start Vite dev server
bun run build          # Build for production
bun run preview        # Preview production build
bun run build:analyze  # Analyze bundle
```

#### CLI (packages/cli)

```bash
cd packages/cli

bun run dev            # Run CLI in dev mode
bun run build          # Build CLI
bun run test           # Run CLI tests
bun cli lint           # Test lint command
bun cli export         # Test export command
```

#### MCP Server (packages/mcp-server)

```bash
cd packages/mcp-server

bun run dev            # Start MCP server
bun run build          # Build server
bun run test           # Run server tests
```

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Playground",
      "program": "${workspaceFolder}/packages/playground/src/main.tsx",
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Launch MCP Server",
      "program": "${workspaceFolder}/packages/mcp-server/src/index.ts",
      "console": "integratedTerminal"
    }
  ]
}
```

### Browser DevTools

The playground includes:

- React DevTools extension support
- Chrome DevTools for performance profiling
- Network tab for MCP API calls

### Logging

Enable debug output:

```bash
DEBUG=design:* bun run dev
```

## IDE Setup

### VS Code Extensions

Recommended extensions for optimal development:

- **TypeScript**: Pylance or TypeScript Vue Plugin
- **ESLint**: dbaeumer.vscode-eslint
- **Prettier**: esbenp.prettier-vscode
- **React**: dsznajder.es7-react-js-snippets
- **Tailwind**: bradlc.vscode-tailwindcss

### Configuration

`.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.enable": true,
  "eslint.format.enable": true
}
```

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run specific package tests
bun run test packages/cli

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

### Writing Tests

Tests use the Bun test runner. Example:

```typescript
import { describe, it, expect } from 'bun:test';

describe('MyModule', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## Git Workflow

### Branch Naming

- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`
- Chore: `chore/description`

### Commit Messages

Follow Conventional Commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add tests
chore: Update dependencies
```

### Pre-commit Hooks

Install Husky for pre-commit checks:

```bash
bun run prepare:husky
```

This will:

- Run type checking
- Run linter
- Run tests (if configured)

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173 (Vite)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3000 (MCP)
lsof -ti:3000 | xargs kill -9
```

### Dependency Issues

```bash
# Clear Bun cache
rm -rf node_modules
rm -rf ~/.bun

# Reinstall
bun install
```

### Build Failures

```bash
# Clean build
bun run clean
bun install
bun run build
```

### Type Errors

```bash
# Generate fresh types
bun run type-check --noEmit

# View full error output
bun run type-check
```

## Performance Tips

1. Use Turbo for faster builds: `turbo build`
2. Enable caching: `turbo build --cache-dir=.turbo`
3. Use `bun run dev` for faster hot reload
4. Profile with Chrome DevTools

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [MCP Specification](https://modelcontextprotocol.io)

## Getting Help

- Check existing issues: https://github.com/khulnasoft-bot/design.md/issues
- Start a discussion: https://github.com/khulnasoft-bot/design.md/discussions
- Review documentation: https://design-md.dev/docs
