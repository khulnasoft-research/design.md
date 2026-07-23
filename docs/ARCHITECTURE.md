# Design.md Monorepo Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Users & Integrations                         │
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │   Web IDE    │      │   AI Agents  │      │  CLI Tools   │
    │ (Playground) │      │ (MCP Client) │      │  (Terminal)  │
    └──────────────┘      └──────────────┘      └──────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
            ┌────────────────────▼────────────────────┐
            │      Design.md Monorepo (Bun)           │
            └────────────────────────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌─────────────┐          ┌──────────────┐          ┌────────────────┐
│ @scalify/   │          │ @scalify/    │          │ @scalify/      │
│ cli          │          │ mcp-server   │          │ playground     │
│ (CLI Core)  │          │ (API)        │          │ (UI)           │
│             │          │              │          │                │
│ • Linter    │          │ • Tool API   │          │ • Editor       │
│ • Exporter  │          │ • MCP Impl   │          │ • Tokens View  │
│ • Diffing   │          │ • JSON-RPC   │          │ • Comparison   │
│ • Spec Gen  │          │              │          │ • Export UI    │
└─────────────┘          └──────────────┘          └────────────────┘
    │                            │                         │
    └────────────────────────────┼─────────────────────────┘
                                 │
                     ┌────────────────────────┐
                     │  @scalify/design-core  │
                     │  (Shared)              │
                     │                        │
                     │ • Types                │
                     │ • Parsers              │
                     │ • Validators           │
                     │ • Formatters           │
                     └────────────────────────┘
                                 │
                    ┌────────────▼──────────┐
                    │   File System &       │
                    │   External APIs       │
                    │                       │
                    │ • FS (read/write)     │
                    │ • Remark (parsing)    │
                    │ • Tailwind (export)   │
                    └───────────────────────┘
```

## Package Dependency Graph

### Current (Pre-Refactoring)

```
CLI (@scalify/cli)
  ├── remark, yaml, zod
  └── (no shared types with others)

MCP Server (@scalify/mcp-server)
  ├── @scalify/cli ──┐
  └── @modelcontextprotocol/sdk

Playground (@scalify/playground)
  ├── react, vite, codemirror
  ├── zustand
  └── (NO connection to CLI or MCP's internal types)
```

**Problem**: Playground reimplements parsing/validation logic instead of reusing CLI's work.

### Refactored (Post-Phase 1)

```
Core (@scalify/design-core)
  ├── remark, yaml, zod
  └── Shared: types, parsers, validators, formatters

CLI (@scalify/cli)
  ├── core ──┐
  ├── citty  │
  └── remark │

MCP Server (@scalify/mcp-server)
  ├── core ──────────┐
  ├── @scalify/cli (for advanced linting)
  └── @modelcontextprotocol/sdk

Playground (@scalify/playground)
  ├── core ─────────────────────┐
  ├── react, vite, codemirror   │
  ├── zustand                   │
  └── (uses core types/formatters)
```

**Benefit**: All packages share the same type definitions and core utilities.

## Layer Architecture

### Presentation Layer (Playground)

```
┌─────────────────────────────────────────────────┐
│                   Components                     │
│  ┌──────────────────────────────────────────┐  │
│  │ Editor │ Tokens │ Diff │ Export │ Tools  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│                   Hooks/Stores                   │
│  ┌──────────────────────────────────────────┐  │
│  │ useDesignMdState │ useLinting │ useMcp   │  │
│  │ useFileOps │ useKeyboardShortcuts       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Services Layer (Playground & MCP)

```
┌─────────────────────────────────────────────────┐
│               Business Logic                     │
│  ┌──────────────────────────────────────────┐  │
│  │ MCPClient    │ FileService │ DSService  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│             Core Utilities Layer                 │
│  ┌──────────────────────────────────────────┐  │
│  │ parsers │ validators │ formatters │ types│  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### API Layer (MCP Server)

```
┌──────────────────────────────────────────────────┐
│           MCP Tool Handlers                      │
│  ┌────────────────────────────────────────────┐ │
│  │ lint │ read │ write │ export │ diff        │ │
│  │ extract │ validate │ merge                 │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
           │                            │
    ┌──────▼──────┐            ┌───────▼──────┐
    │  Tool Input │            │ Tool Output  │
    │  Validation │            │   Structure  │
    └─────────────┘            └──────────────┘
           │                            │
┌──────────▼────────────────────────────▼──────────┐
│         MCP Server / JSON-RPC Transport          │
│    (handles protocol, routing, error handling)   │
└─────────────────────────────────────────────────┘
```

### CLI Layer

```
┌──────────────────────────────────────────────────┐
│           CLI Commands                           │
│  ┌────────────────────────────────────────────┐ │
│  │ lint │ export │ diff │ spec │ help         │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────┐
│       Command Implementation & Logic             │
│  ┌────────────────────────────────────────────┐ │
│  │ Exporters │ Transformers │ Spec Generator │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────┐
│    Shared Core Utilities & Types                │
└──────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: User Edits Design System in Playground

```
User Input (Editor)
        │
        ▼
ComponentDidUpdate
        │
        ▼
setContent (Zustand State)
        │
        ▼
useLinting Hook
        │
        ▼
MCP Tool: lint_design_md
        │
        ▼
MCPClient.callTool()
        │
        ▼
Server /api/mcp/lint
        │
        ▼
MCP Tool Handler
        │
        ▼
Core: parseDesignMd() + validate()
        │
        ▼
Return Findings
        │
        ▼
Update TokenValidator Component
        │
        ▼
UI Re-renders with Errors/Warnings
```

### Example 2: User Exports Design System

```
User Clicks Export
        │
        ▼
ExportPanel Component
        │
        ▼
Select Format (Tailwind/DTCG)
        │
        ▼
MCP Tool: export_design_md
        │
        ▼
MCPClient.callTool()
        │
        ▼
Server /api/mcp/export
        │
        ▼
MCP Tool Handler
        │
        ▼
Core: parseDesignMd()
        │
        ▼
CLI: formatters/tailwind.ts or formatters/dtcg.ts
        │
        ▼
Return Formatted Code
        │
        ▼
Display in PreviewCode Component
        │
        ▼
User Downloads or Copies
```

### Example 3: CLI User Runs Lint Command

```
User: design.md lint DESIGN.md
        │
        ▼
CLI Parser (citty)
        │
        ▼
commands/lint.ts Handler
        │
        ▼
FileService: readFile()
        │
        ▼
Core: parseDesignMd()
        │
        ▼
CLI Linter: linter/index.ts
        │
        ▼
Apply Linting Rules
        │
        ▼
Return Findings
        │
        ▼
Format Output (table, JSON, etc.)
        │
        ▼
Print to Console
```

## Type Safety & Consistency

### Shared Type Hierarchy

```
DesignSystem (root type)
├── Token (abstract base)
│   ├── ColorToken
│   ├── TypographyToken
│   ├── SpacingToken
│   ├── RoundedToken
│   └── ComponentToken
├── LintResult
│   ├── LintFinding
│   └── LintSummary
├── ExportOptions
│   ├── TailwindOptions
│   ├── DTCGOptions
│   └── CSSOptions
└── DiffResult
    ├── TokenChange
    └── RegressionWarning
```

All three packages (CLI, MCP, Playground) use these same types, ensuring consistency.

## Build & Deployment Flow

```
Developer Commits
        │
        ▼
GitHub Actions Trigger
        │
    ┌───┴────────────────┐
    ▼                    ▼
  Lint             TypeScript Check
    │                    │
    └───┬────────────────┘
        ▼
    Run Tests
        │
    ┌───┴──────────────────────┐
    ▼                          ▼
Unit Tests            Integration Tests
    │                          │
    └───┬──────────────────────┘
        ▼
    Build Packages
    ├── core
    ├── cli
    ├── mcp-server
    └── playground
        │
        ▼
    All Green ✓
        │
        ▼
    Merge to Main
        │
        ▼
    Tag Release
        │
    ┌───┴─────────────────────────────┐
    ▼                 ▼               ▼
 npm Package    npm Package    Deploy Web
 (@scalify/     (@scalify/     (Vercel/
  cli)          mcp-server)    Firebase)
```

## Performance Considerations

### Turbo Cache Optimization

```
packages/
├── core/          ← Rarely changes → High cache hit
├── cli/           ← Medium changes → Medium cache hit
├── mcp-server/    ← Medium changes → Medium cache hit
└── playground/    ← Frequent changes → Lower cache hit

Result: Incremental builds ~5-10s vs full builds ~30s
```

### Bundle Size Targets

```
CLI (@scalify/cli)
  ├── ESM: 150 KB
  ├── CJS: 180 KB
  └── Minified: 50 KB

MCP Server (@scalify/mcp-server)
  ├── ESM: 120 KB
  ├── Node bundle: 200 KB
  └── Minified: 60 KB

Playground (@scalify/playground)
  ├── Main bundle: 450 KB
  ├── Styles: 50 KB
  ├── Vendor split: 200 KB
  └── Gzipped total: 180 KB
```

### Token Parsing Performance

```
Small file (< 50 tokens):      < 5ms
Medium file (50-500 tokens):   5-50ms
Large file (500-5000 tokens):  50-500ms
Very large file (> 5000):      > 500ms (async)
```

## Security Considerations

### Input Validation

```
User File Upload → Size Check (< 10MB)
                → File Type Check (.md only)
                → Scan for Path Traversal
                → Parse & Validate Structure
```

### API Rate Limiting

```
MCP Requests: 100/min per session
File Operations: 10/min per session
Export Operations: 20/min per session
```

### Data Privacy

```
• No data sent to external servers (unless explicitly configured)
• Design systems stored locally (browser or server)
• Optional telemetry (opt-in)
• GDPR compliant
```

## Scalability Plan

### Phase 1 (Current: ~10K tokens)

- Single file, single process
- In-memory parsing
- Direct file system access

### Phase 2 (10K-100K tokens)

- Multiple files, worker threads
- Incremental parsing
- Caching layer

### Phase 3 (100K-1M tokens)

- Database backend
- GraphQL API
- Real-time collaboration
- Design token versioning system
