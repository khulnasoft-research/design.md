# Design.md Playground - Quick Start Guide

## Installation

```bash
# Install dependencies
cd packages/playground
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run MCP server
cd packages/mcp-server
bun run dev
```

## First Steps

### 1. Start the Playground

```bash
cd packages/playground
bun run dev
```

The playground will be available at `http://localhost:5173`

### 2. Start the MCP Server

In a separate terminal:

```bash
cd packages/mcp-server
bun run dev
```

### 3. Load Your First Design System

1. In the playground, enter the path to your DESIGN.md file:

   ```
   /path/to/your/DESIGN.md
   ```

2. Click the **Load** button

3. The system will:
   - Parse the markdown and frontmatter
   - Run validation checks
   - Extract all tokens
   - Display results in different tabs

### 4. Explore the Tabs

**Editor Tab**

- Markdown editor on the left
- Live validation results on the right
- Make changes and watch validation update in real-time

**Tokens Tab**

- Browse all extracted tokens by category
- Search tokens by name
- View color swatches, typography samples, and component properties
- Copy token values to clipboard

**Compare Tab**

- Compare two versions of your design system
- Identify token changes and regressions
- See what was added, removed, or modified

**Export Tab**

- Convert tokens to different formats
- Choose between Tailwind v3 JSON, Tailwind v4 CSS, or W3C DTCG
- Copy or download the exported tokens

**Tools Tab**

- View all available MCP tools
- See tool descriptions and capabilities

## Common Tasks

### Edit Your Design System

1. Go to the **Editor** tab
2. Make changes to the markdown
3. The validator shows issues instantly
4. Click **Save** when ready

### Export Tokens to Tailwind

1. Go to the **Export** tab
2. Enter your DESIGN.md path
3. Select **Tailwind v4 (CSS)** or **Tailwind v3 (JSON)**
4. Click **Export**
5. Copy the output or click **Download**

### Compare Design System Versions

1. Go to the **Compare** tab
2. Enter the old version path in "Before DESIGN.md"
3. Enter the new version path in "After DESIGN.md"
4. Click **Compare**
5. Review token changes and regression warnings

### Find a Specific Token

1. Go to the **Tokens** tab
2. Use the search box to find by name
3. Click category tabs to filter by type
4. Click the copy icon next to any token

## Example DESIGN.md

```yaml
---
name: 'My Design System'
version: '1.0.0'
---
# Colors

## Primary

primary: '#0066FF'
primary-light: '#3399FF'
primary-dark: '#0052CC'

## Neutral

neutral-100: '#FFFFFF'
neutral-200: '#F5F5F5'
neutral-800: '#1A1A1A'
neutral-900: '#000000'

# Typography

## Heading Large

font-family: 'Inter'
font-size: '32px'
font-weight: '600'
line-height: '1.25'

## Body

font-family: 'Inter'
font-size: '14px'
font-weight: '400'
line-height: '1.5'

# Spacing

xs: '4px'
sm: '8px'
md: '16px'
lg: '24px'
xl: '32px'

# Rounded

sm: '4px'
md: '8px'
lg: '12px'
full: '9999px'

# Components

Button:
  padding: '{md}'
  border-radius: '{md}'
  font-size: '14px'
  font-weight: '600'

Card:
  padding: '{lg}'
  border-radius: '{lg}'
  box-shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
```

## Keyboard Shortcuts

| Action        | Shortcut     |
| ------------- | ------------ |
| Save File     | Cmd/Ctrl + S |
| Search Tokens | Cmd/Ctrl + F |
| Copy Token    | Click Icon   |
| Load File     | Enter Key    |

## Tips & Tricks

- **Auto-save**: Configure in Settings for automatic saving
- **Validation**: All validation runs in real-time - fix issues as you type
- **Export Preview**: Always preview exported tokens before downloading
- **Comparison**: Use the Compare tab regularly to track design system evolution
- **Token Search**: Use search to quickly find tokens across large design systems

## Troubleshooting

### "File Not Found"

- Verify the path is correct and absolute
- Check file permissions
- Ensure DESIGN.md exists

### "Validation Errors"

- Check YAML syntax in frontmatter
- Verify all token references are valid
- Review linting rules in documentation

### "Export Not Working"

- Confirm design system is loaded
- Select appropriate export format
- Check for special characters in token names

## Getting Help

- Read `PLAYGROUND_GUIDE.md` for comprehensive documentation
- See `PROJECT_SUMMARY.md` for project overview
- Check the Tools tab for available MCP functions
- Inspect browser console for error messages

## Next Steps

- Create your first design system
- Export tokens to your project
- Compare versions to track changes
- Extend with custom tools via MCP

Happy designing!
