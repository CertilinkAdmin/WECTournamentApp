# OPUX MCP Setup Guide

This guide explains how to install and configure the MCP servers required for the OPUX workflow.

## Required MCP Servers

1. **Lighthouse MCP** - For performance audits ✅ Available
2. **Responsive Refactor MCP** - For layout optimization ⚠️ Custom implementation needed
3. **Tailwind Optimizer MCP** - For CSS normalization ⚠️ Custom implementation needed

## Important: MCP Servers Are Configured in Cursor, Not Your Project

**MCP servers are configured in Cursor's settings file, not in your project's `package.json`.**

The configuration tells Cursor how to run the MCP server. You have three options:

### Method 1: Using npx (Recommended - No Installation Needed) ✅

**No installation required!** Cursor runs the MCP server via `npx` when needed.

**Configuration only** (no npm install):
```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "@danielsogl/lighthouse-mcp"],
      "env": {}
    }
  }
}
```

**Benefits:**
- ✅ No installation needed
- ✅ Always uses latest version
- ✅ Works immediately after configuration
- ✅ No project dependencies

### Method 2: Global Installation

**Install globally** (optional):
```bash
npm install -g @danielsogl/lighthouse-mcp
```

**Then configure** in Cursor:
```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "@danielsogl/lighthouse-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

### Method 3: Local Installation (Not Recommended)

**Install in your project** (optional):
```bash
npm install --save-dev @danielsogl/lighthouse-mcp
```

**Then configure** in Cursor with full path (see "Using Local Installation" section below).

**Note**: Responsive Refactor and Tailwind Optimizer MCPs don't exist as standalone packages. These steps will be handled through code analysis and refactoring tools (see Custom Implementation section below).

## Cursor Configuration

To configure MCP servers in Cursor, you need to add them to your MCP settings. The configuration file location depends on your Cursor setup.

### Configuration File Location

**macOS**: `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
**Windows**: `%APPDATA%\Cursor\User\globalStorage\mcp.json`
**Linux**: `~/.config/Cursor/User/globalStorage/mcp.json`

### Example Configuration

Create or edit the MCP configuration file at the location above:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "@danielsogl/lighthouse-mcp"],
      "env": {}
    }
  }
}
```

**Note**: The `-y` flag automatically accepts the npx prompt.

### Alternative: Using Installed Packages

If you installed globally:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "@danielsogl/lighthouse-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

### Using Local Installation

If installed locally in your project:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "node",
      "args": ["node_modules/@danielsogl/lighthouse-mcp/dist/index.js"],
      "env": {},
      "cwd": "/home/runner/workspace"
    }
  }
}
```

**Important**: Steps 2 (Responsive Refactor) and 3 (Tailwind Optimizer) don't require separate MCP servers. These will be handled through:
- Code analysis and refactoring using Cursor's built-in capabilities
- Lighthouse audit results to guide the fixes
- Tailwind CSS tools already in your project

## Verifying Installation

After configuration, restart Cursor and verify the MCPs are available:

1. Open Cursor
2. Check MCP server status in settings
3. Try using the MCP commands in chat

## Troubleshooting

### MCP Not Found

If you get "MCP not found" errors:

1. Ensure Node.js and npm are installed
2. Try using `npx` method instead of global install
3. Check that the MCP package names are correct
4. Verify the configuration file syntax is valid JSON

### Permission Issues

If you encounter permission issues:

```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Or use npx which doesn't require global install
```

### Alternative MCP Sources

Some MCPs might be available from different sources:

- **NPM Registry**: Search for `*-mcp` packages
- **GitHub**: Look for MCP server repositories
- **Custom**: You may need to create custom MCP wrappers

## Custom Implementation for Steps 2 & 3

Since Responsive Refactor and Tailwind Optimizer MCPs don't exist as standalone packages, OPUX Steps 2 and 3 are handled through:

### Step 2: Responsive Refactor

**Implementation**: Code analysis and refactoring using:
- Lighthouse audit results (from Step 1) to identify issues
- Cursor's code analysis capabilities
- Manual/assisted refactoring based on findings

**Tools Available**:
- Lighthouse already installed (`lighthouse` in devDependencies)
- Tailwind CSS responsive utilities
- PostCSS for CSS processing

### Step 3: Tailwind Optimizer

**Implementation**: Use existing Tailwind tools and patterns:

```bash
# Install Tailwind optimization tools (optional)
npm install --save-dev prettier-plugin-tailwindcss
npm install --save-dev tailwindcss-class-sorter
```

**Tools Available**:
- `tailwind.config.ts` - Already configured
- Tailwind CSS IntelliSense (via VS Code/Cursor extensions)
- Manual class normalization based on design system

**Note**: The OPUX workflow guides the AI assistant to perform these optimizations directly on your codebase, using the Lighthouse findings and Tailwind best practices.

## Next Steps

1. Install the MCP servers using one of the methods above
2. Configure Cursor to recognize them
3. Test the OPUX workflow
4. Integrate into your development process

## References

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Setup](https://cursor.sh/docs/mcp)

