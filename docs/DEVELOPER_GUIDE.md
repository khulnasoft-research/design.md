# Developer Guide - Design.md Monorepo

## Quick Start

### Prerequisites

- **Node.js**: 20+ (or use Bun)
- **Bun**: 1.3.9+ (package manager & runtime)
- **Git**: Latest version
- **VS Code**: Recommended IDE

### Setup

```bash
# Clone repository
git clone https://github.com/google-labs/design.md.git
cd design-monorepo

# Install dependencies (Bun workspace)
bun install

# Verify setup
bun run build
bun run lint
bun run test
```

### First Steps

1. Read `ARCHITECTURE.md` to understand the structure
2. Explore the CLI: `bun run cli lint --help`
3. Start playground dev server: `cd packages/playground && bun run dev`
4. Run CLI tests: `cd packages/cli && bun test`

## Development Workflow

### Building

```bash
# Build all packages
bun run build

# Build specific package
bun run build:cli
bun run build:mcp
bun run build:playground
bun run build:core

# Watch mode (Turbo)
bun run build -- --watch
```

### Development

```bash
# Start all dev servers
bun run dev

# Start specific package
cd packages/playground && bun run dev
cd packages/cli && bun run dev
cd packages/mcp-server && bun run dev
```

### Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# UI mode
bun run test:ui

# Specific package
cd packages/core && bun test
```

### Linting & Formatting

```bash
# Lint all code
bun run lint

# Fix ESLint issues
bunx eslint packages --fix

# Format code
bun run format

# Check formatting
bun run format:check
```

### Type Checking

```bash
# Check all types
bun run type-check

# Watch mode
bun tsc --watch --noEmit
```

## Package Development Guide

### Core Package (`packages/core`)

**Purpose**: Shared types and utilities used by all packages

**Key Files**:

- `src/types/design-system.ts` - Type definitions
- `src/utils/parser.ts` - DESIGN.md parsing
- `src/utils/validator.ts` - Validation logic
- `src/utils/formatter.ts` - Token formatting
- `src/index.ts` - Barrel exports

**Development**:

```bash
cd packages/core

# Build
bun run build

# Test
bun test

# Add new export
# 1. Create utility/type in appropriate file
# 2. Export from src/index.ts
# 3. Import in other packages

# Example: src/utils/transformer.ts
export function transformDesignSystem(input: DesignSystem): DesignSystem {
  // Implement
}

# src/index.ts
export { transformDesignSystem } from './utils/transformer'
```

### CLI Package (`packages/cli`)

**Purpose**: Command-line interface for design.md operations

**Key Files**:

- `src/index.ts` - CLI entry point
- `src/commands/` - Command implementations
- `src/linter/` - Linting rules and logic
- `src/exporters/` - Export format implementations

**Development**:

```bash
cd packages/cli

# Build
bun run build

# Run CLI
bun run dev [command] [args]

# Examples
bun run dev lint --help
bun run dev export DESIGN.md --format tailwind
bun run dev diff design1.md design2.md
```

**Adding a New Command**:

```typescript
// src/commands/mycommand.ts
export const mycommand = defineCommand({
  meta: {
    name: 'mycommand',
    description: 'My new command',
  },
  args: {
    file: {
      type: 'string',
      description: 'File path',
    },
  },
  async run({ args }) {
    // Implementation
    return result;
  },
});

// src/index.ts - import and add to commands object
```

### MCP Server Package (`packages/mcp-server`)

**Purpose**: Model Context Protocol server exposing DESIGN.md tools to AI agents

**Key Files**:

- `src/index.ts` - Server setup and main entry
- `src/tools/` - Tool implementations
- `src/server.ts` - MCP transport layer

**Development**:

```bash
cd packages/mcp-server

# Build
bun run build

# Run server
bun run dev

# Test with manual JSON-RPC call
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/lint","params":{"path":"design.md"},"id":1}'
```

**Adding a New Tool**:

```typescript
// src/tools/mytool.ts
export function registerMyTool(tools: ToolDefinition[]) {
  tools.push({
    name: 'my_tool',
    description: 'Does something useful',
    inputSchema: {
      type: 'object',
      properties: {
        param: { type: 'string' },
      },
      required: ['param'],
    },
  });
}

export async function handleMyTool(args: Record<string, unknown>): Promise<unknown> {
  const { param } = args as { param: string };
  // Implementation
  return result;
}

// src/index.ts - register tool
```

### Playground Package (`packages/playground`)

**Purpose**: Web IDE for editing and visualizing DESIGN.md files

**Key Files**:

- `src/App.tsx` - Main component and routing
- `src/components/` - UI components
- `src/hooks/` - Custom hooks for state management
- `src/services/` - API and business logic
- `src/utils/` - Utility functions

**Development**:

```bash
cd packages/playground

# Install dependencies (Vite + React)
bun install

# Dev server (with hot reload)
bun run dev:client

# Separate: dev server for backend
bun run dev:server

# Or both in parallel
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

**Key Hooks**:

```typescript
// useDesignMdState - Zustand store
import { useDesignMdState } from '../hooks/useDesignMdState';

export function MyComponent() {
  const { content, setContent, findings } = useDesignMdState();
  // Use state and setters
}

// useLinting - Real-time linting
import { useLinting } from '../hooks/useLinting';

export function EditorComponent() {
  const { lint, findings, isLinting } = useLinting();
  useEffect(() => {
    lint(content);
  }, [content]);
}

// useMcpTools - Call MCP tools
import { useMcpTools } from '../hooks/useMcpTools';

export function ExportComponent() {
  const { callTool, loading, result } = useMcpTools();

  async function handleExport(format: string) {
    await callTool('export_design_md', { path, format });
  }
}
```

**Adding a New Component**:

```typescript
// src/components/MyFeature/MyComponent.tsx
import { FC } from 'react'
import { useDesignMdState } from '../../hooks/useDesignMdState'

interface MyComponentProps {
  // Props
}

export const MyComponent: FC<MyComponentProps> = (props) => {
  const { content } = useDesignMdState()

  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  )
}
```

## Common Tasks

### Adding a New Dependency

```bash
# To a specific package
cd packages/my-package
bun add dependency

# To root (dev dependency)
cd /vercel/share/v0-project
bun add -D dependency --workspace-root
```

**Note**: Workspace packages are already available to each other via `workspace:*` in package.json.

### Debugging

```bash
# Node debugging (MCP or CLI)
NODE_OPTIONS=--inspect bun run dev

# Browser DevTools (Playground)
# Automatically opens when you run `bun run dev`
# Or manually: chrome://inspect

# VS Code debugging
# Create .vscode/launch.json with Node debugger config
```

### Performance Profiling

```bash
# Turbo tasks performance
bun run build -- --graph=performance.html

# Node profiling
node --prof packages/cli/dist/index.js
node --prof-process isolate-*.log > results.txt
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/my-feature

# Make changes
# ... edit files ...

# Run checks before commit
bun run lint
bun run test
bun run type-check

# Commit with conventional messages
git commit -m "feat: add new feature description"
git commit -m "fix: resolve bug in component"

# Push and create PR
git push origin feat/my-feature
# Create PR on GitHub

# After review, merge to main
```

### Creating a Test

```typescript
// packages/core/__tests__/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseDesignMd } from '../src/utils/parser';

describe('parseDesignMd', () => {
  it('should parse valid DESIGN.md', () => {
    const input = `---
colors:
  primary: "#000"
---

# Design System`;

    const result = parseDesignMd(input);
    expect(result.colors.primary).toBe('#000');
  });

  it('should throw on invalid frontmatter', () => {
    const input = `---
colors: [unclosed`;

    expect(() => parseDesignMd(input)).toThrow();
  });
});
```

Run with: `bun test`

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
bun run clean
bun install
bun run build

# Check Turbo cache
rm -rf .turbo

# Check for circular dependencies
# Use madge: bunx madge packages --circular
```

### Type Errors

```bash
# Full type check
bun run type-check

# In specific package
cd packages/my-package
bun tsc --noEmit

# Check tsconfig.json for correct paths and includes
```

### Tests Fail

```bash
# Run with verbose output
bun test --reporter=verbose

# Debug single test
bun test parser.test.ts --inspect-wait

# Update snapshots if intended
bun test -u
```

### Import Errors

```bash
# Issue: "Cannot find module @scalify/design-core"
# Solution: Rebuild design-core package

cd packages/design-core
bun run build
```

### Performance Issues

```bash
# Profile build time
bun run build -- --profile

# Check file sizes
ls -lh packages/*/dist/

# Profile runtime
node --prof packages/mcp-server/dist/index.js
```

## Code Style Guide

### TypeScript

```typescript
// Use strict types
interface Props {
  name: string;
  count?: number;
}

// Avoid any
// ❌ function process(data: any) { }
// ✅ function process(data: DesignSystem) { }

// Use const where possible
const x = 5; // Good
let y = 5; // Only when reassignment needed
```

### React Components

```typescript
// Use functional components with TS
interface ButtonProps {
  onClick: () => void
  label: string
}

export const Button: FC<ButtonProps> = ({ onClick, label }) => {
  return <button onClick={onClick}>{label}</button>
}

// Use hooks for state/effects
export const Editor: FC = () => {
  const [content, setContent] = useState('')

  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    }
  }, [])
}
```

### File Organization

```
packages/my-package/
├── src/
│   ├── utils/
│   │   ├── myutil.ts      (single concern)
│   │   ├── myutil.test.ts (test colocated)
│   │   └── index.ts       (barrel exports)
│   ├── types/
│   │   └── mytypes.ts
│   ├── __tests__/         (or jest/vitest folders)
│   │   └── integration.test.ts
│   └── index.ts           (main entry)
├── package.json
└── tsconfig.json
```

## Resources

- **DESIGN.md Format**: See `.stitch/DESIGN.md` for examples
- **Remark Docs**: https://github.com/unifiedjs/unified
- **MCP Protocol**: https://spec.modelcontextprotocol.io
- **Turbo Docs**: https://turbo.build/repo/docs
- **Bun Docs**: https://bun.sh/docs

## Getting Help

1. Check existing issues and discussions on GitHub
2. Review test files for usage examples
3. Ask in team Slack/Discord
4. Create an issue with detailed reproduction steps
