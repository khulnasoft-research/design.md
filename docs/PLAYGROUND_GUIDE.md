# Design.md Playground & MCP Server Implementation Guide

## Overview

This comprehensive guide documents the enhanced Design.md playground and MCP server implementation, similar to Google Stitch. The system provides a web-based IDE for editing, validating, and exporting design tokens with real-time feedback and powerful tools.

## Architecture

### Components

#### 1. Playground Application

Located in `packages/playground/`, a React + Vite web application with:

- **Editor View** (`DesignMdEditor.tsx`)
  - CodeMirror-based markdown editor with syntax highlighting
  - Real-time content synchronization via Zustand state management
  - Support for YAML frontmatter and markdown body

- **Validator Display** (`TokenValidator.tsx`)
  - Real-time linting feedback with inline error/warning/info display
  - Severity-based visual indicators
  - Line number and rule references

- **Token Browser** (`TokenBrowser.tsx`)
  - Visual exploration of design tokens (colors, typography, spacing, rounded, components)
  - Search and category filtering
  - Live color swatches, typography samples, and structured data display

- **Design Diff View** (`DesignDiff.tsx`)
  - Compare two DESIGN.md files side-by-side
  - Token change detection (added, removed, modified)
  - Regression detection for linting issues

- **Export Panel** (`ExportPanel.tsx`)
  - Format conversion: Tailwind v3 JSON, Tailwind v4 CSS, W3C DTCG
  - Live preview and copy/download functionality

#### 2. MCP Server

Located in `packages/mcp-server/`, a Node.js JSON-RPC server exposing:

**Core Tools (Existing):**

- `lint_design_md` - Validate DESIGN.md structure and report findings
- `export_design_md` - Convert tokens to multiple formats
- `diff_design_md` - Compare design system versions
- `read_design_md` - Parse and return file content

**New Tools (Extended):**

- `write_design_md` - Write/update DESIGN.md with auto-linting
- `extract_token_reference` - Get specific token values by path (e.g., "colors.primary")
- `validate_component_tokens` - Validate component property references
- `merge_design_tokens` - Merge multiple design systems with conflict detection

### State Management

Using Zustand for efficient, centralized state:

```typescript
interface DesignMdState {
  content: string; // Current markdown content
  findings: LintFinding[]; // Validation results
  summary: SummaryStats; // Error/warning/info count
  designSystem: DesignSystem; // Parsed tokens
  selectedTab: TabType; // Current view
  fileName: string; // File name display
  isDirty: boolean; // Unsaved changes flag
}
```

## Features

### 1. Real-Time Editing

- Live markdown editor with syntax highlighting
- Instant validation feedback
- Split-panel layout with editor and validator side-by-side
- Auto-save capability

### 2. Visual Token Exploration

- Color swatches with hex/RGB values
- Typography samples with actual text rendering
- Spacing and rounded corner visualizations
- Component structure browser
- Copy-to-clipboard functionality

### 3. Design System Comparison

- Version-to-version token diffing
- Regression detection
- Change categorization (added/removed/modified)
- Impact analysis

### 4. Multiple Export Formats

- **Tailwind v3**: JSON configuration for theme config
- **Tailwind v4**: CSS custom properties format
- **DTCG**: W3C Design Tokens Community Group format

### 5. Advanced Tools

- Token reference extraction
- Component property validation
- Multi-file merging and conflict detection
- WCAG contrast analysis (future)

## UI Layout

```
┌─────────────────────────────────────────────┐
│          Top Bar (File Controls)            │
├──────────┬──────────────────────────────────┤
│          │  Tabs (Editor|Tokens|Compare|)  │
│ Sidebar  ├──────────────────────────────────┤
│          │                                  │
│          │    Content Area                 │
│          │  (Editor Split Panel or Views)  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### Responsive Breakpoints

- **Desktop**: Full layout with sidebar + content
- **Tablet**: Collapsed sidebar, single-column editor
- **Mobile**: Full-width editor with collapsible panels

## Usage

### Loading a Design System

1. Enter the path to your DESIGN.md file in the path input
2. Click "Load" to read and validate the file
3. Tokens are extracted and displayed in the Token Browser
4. Linting results appear in the Validator panel

### Editing

1. Make changes in the markdown editor
2. Changes are tracked and marked with a dirty indicator (●)
3. Click "Save" to write changes and re-validate

### Exporting

1. Open the Export tab
2. Select desired format (Tailwind v3/v4 or DTCG)
3. Click "Export"
4. Copy output or download as file

### Comparing Versions

1. Open the Compare tab
2. Enter paths to "before" and "after" DESIGN.md files
3. Click "Compare"
4. Review token changes and regression warnings

## API Reference

### MCP Tool Calls

All tools are called via JSON-RPC with standardized request/response format:

```typescript
// Request
{
  id: "uuid",
  method: "tools/call",
  params: {
    name: "tool_name",
    arguments: { /* tool-specific args */ }
  }
}

// Response
{
  id: "uuid",
  result: { /* tool-specific output */ }
}
```

### Calling Tools from Playground

```typescript
import { callTool } from './api';

// Example: Validate a design system
const result = await callTool('lint_design_md', {
  path: '/path/to/DESIGN.md',
});

// Extract a token value
const token = await callTool('extract_token_reference', {
  path: '/path/to/DESIGN.md',
  tokenPath: 'colors.primary',
});

// Export to Tailwind v4 CSS
const exported = await callTool('export_design_md', {
  path: '/path/to/DESIGN.md',
  format: 'css-tailwind',
});
```

## File Structure

```
packages/
├── playground/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── DesignMdEditor.tsx
│   │   │   │   ├── TokenValidator.tsx
│   │   │   │   └── FrontmatterEditor.tsx
│   │   │   ├── Tokens/
│   │   │   │   ├── TokenBrowser.tsx
│   │   │   │   ├── ColorGrid.tsx
│   │   │   │   └── TypographyShowcase.tsx
│   │   │   ├── Comparison/
│   │   │   │   └── DesignDiff.tsx
│   │   │   └── Export/
│   │   │       └── ExportPanel.tsx
│   │   ├── hooks/
│   │   │   └── useDesignMdState.ts
│   │   ├── utils/
│   │   │   └── tokenParsing.ts
│   │   ├── styles/
│   │   │   └── editor.css
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   └── main.tsx
│   ├── server/
│   │   └── index.ts
│   └── package.json
└── mcp-server/
    ├── src/
    │   └── index.ts
    └── package.json
```

## Development

### Running Locally

**Playground:**

```bash
cd packages/playground
bun run dev          # Start dev server on http://localhost:5173
bun run build        # Production build
```

**MCP Server:**

```bash
cd packages/mcp-server
bun run dev          # Run via stdin (for testing with tools)
```

### Adding New Components

1. Create component in appropriate directory
2. Import state hooks from `useDesignMdState`
3. Add component styles to `styles/editor.css`
4. Import and use in `App.tsx`

### Adding New MCP Tools

1. Define tool in `ToolDefinition[]` array with schema
2. Implement handler in `handleToolCall` switch statement
3. Add API function wrapper in `packages/playground/src/api.ts`
4. Use in components via `callTool()`

## Performance Considerations

- CodeMirror editor lazy-loads syntax plugins
- Token display uses virtualization for large datasets
- State updates batched via Zustand
- MCP server handles concurrent tool calls efficiently

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (v15+)
- Mobile browsers: Responsive layout with touch optimization

## Future Enhancements

- Real-time collaborative editing
- Git integration for version control
- Component preview rendering
- Accessibility audit tooling
- WCAG contrast ratio warnings
- Token naming conventions validator
- Design system analytics dashboard
- CLI integration for CI/CD pipelines

## Troubleshooting

### File Not Found

- Verify the path is absolute and accessible
- Check file permissions
- Ensure DESIGN.md exists in specified location

### Validation Errors

- Review linting rules in documentation
- Check YAML frontmatter syntax
- Validate token property references

### Export Issues

- Confirm design system is loaded
- Select appropriate format for your use case
- Check for reserved keywords in token names

## Contributing

When extending functionality:

1. Follow existing component patterns
2. Use TypeScript for type safety
3. Add comprehensive error handling
4. Include loading and error states
5. Test across browser/device sizes
