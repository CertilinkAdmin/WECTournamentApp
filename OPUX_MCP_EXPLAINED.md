# MCP Servers: Installation vs Configuration Explained

## Key Point: MCP Servers Are NOT in Your Project

**MCP servers are configured in Cursor's settings, not in your project's `package.json`.**

## How MCP Servers Work

MCP servers are separate processes that Cursor runs. They can be accessed in three ways:

### Option 1: Using npx (Recommended - No Installation Needed) ✅

**No installation required!** Cursor runs the MCP server via `npx` when needed.

**Configuration in Cursor:**
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

**Location**: `~/.config/Cursor/User/globalStorage/mcp.json` (Linux)

**How it works:**
- When Cursor needs the MCP server, it runs `npx @danielsogl/lighthouse-mcp`
- npx downloads and runs it temporarily (no permanent installation)
- No need to install anything in your project or globally

### Option 2: Global Installation

**Install globally:**
```bash
npm install -g @danielsogl/lighthouse-mcp
```

**Configuration in Cursor:**
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

**How it works:**
- Installed globally on your system
- Cursor runs the global command directly
- Available to all projects, but requires global installation

### Option 3: Local Installation (Less Common)

**Install in your project:**
```bash
npm install --save-dev @danielsogl/lighthouse-mcp
```

**Configuration in Cursor:**
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

**How it works:**
- Installed in your project's `node_modules`
- Cursor runs it from your project directory
- Requires installation in each project that uses it

## What You Need to Do

### For OPUX Workflow:

1. **Configure Cursor's MCP settings** (one-time setup):
   - Create/edit: `~/.config/Cursor/User/globalStorage/mcp.json`
   - Add the Lighthouse MCP configuration
   - **No installation needed if using npx method**

2. **Restart Cursor** to load the MCP configuration

3. **That's it!** The MCP server will be available in Cursor

## What You DON'T Need

- ❌ Installing MCP servers in your project's `package.json`
- ❌ Installing MCP servers globally (unless you prefer that method)
- ❌ Any code changes in your project

## Current Setup Recommendation

**Use Option 1 (npx)** - It's the simplest:
- No installation needed
- Always uses the latest version
- Works immediately after configuration
- No project dependencies

## Summary

| Method | Installation Required? | Location | Best For |
|--------|----------------------|----------|----------|
| **npx** | ❌ No | Cursor config | Most users (recommended) |
| **Global** | ✅ Yes (`npm install -g`) | System-wide | Multiple projects |
| **Local** | ✅ Yes (`npm install --save-dev`) | Project `node_modules` | Project-specific versions |

## Your Current Setup

✅ **Lighthouse** is installed in your project (`package.json`) - This is for running Lighthouse CLI directly, not for MCP

✅ **Lighthouse MCP** - Configured to use npx (no installation needed)

✅ **Steps 2 & 3** - Don't need MCP servers, handled through code analysis

## Next Step

Just configure Cursor's MCP settings file:
```bash
mkdir -p ~/.config/Cursor/User/globalStorage
cp mcp-config.example.json ~/.config/Cursor/User/globalStorage/mcp.json
```

Then restart Cursor. No npm install needed! 🎉

