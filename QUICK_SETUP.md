# Quick Setup: Add MCP Config to Cursor

## Step-by-Step Instructions

### Step 1: Find Your Cursor Config Directory

**Linux:**
```bash
~/.config/Cursor/User/globalStorage/mcp.json
```

**macOS:**
```bash
~/Library/Application Support/Cursor/User/globalStorage/mcp.json
```

**Windows:**
```bash
%APPDATA%\Cursor\User\globalStorage\mcp.json
```

### Step 2: Create the Directory (if it doesn't exist)

**Linux/macOS:**
```bash
mkdir -p ~/.config/Cursor/User/globalStorage
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Cursor\User\globalStorage"
```

### Step 3: Create or Edit the MCP Config File

**Option A: Copy the example file (Linux/macOS):**
```bash
cp /home/runner/workspace/mcp-config.example.json ~/.config/Cursor/User/globalStorage/mcp.json
```

**Option B: Create it manually**

Create/edit the file at the location above with this content:

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

### Step 4: Restart Cursor

Close and reopen Cursor to load the MCP configuration.

### Step 5: Verify It Works

1. Open Cursor Settings
2. Look for "MCP" or "Model Context Protocol" settings
3. You should see "lighthouse" listed as an MCP server
4. Test it: Ask Cursor "Run OPUX Step 1: Lighthouse audit on http://localhost:3000"

## Quick Copy-Paste Commands

**Linux:**
```bash
mkdir -p ~/.config/Cursor/User/globalStorage
cp /home/runner/workspace/mcp-config.example.json ~/.config/Cursor/User/globalStorage/mcp.json
```

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Cursor/User/globalStorage
cp /home/runner/workspace/mcp-config.example.json ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Cursor\User\globalStorage"
Copy-Item "C:\path\to\workspace\mcp-config.example.json" "$env:APPDATA\Cursor\User\globalStorage\mcp.json"
```

## What This Does

This configuration tells Cursor:
- "When I need Lighthouse MCP, run `npx @danielsogl/lighthouse-mcp`"
- The `-y` flag automatically accepts the npx prompt
- No installation needed - npx downloads and runs it on demand

## Troubleshooting

**If the file doesn't exist after creating it:**
- Make sure you're using the correct path for your OS
- Check that Cursor has permission to read the directory
- Try creating it manually in Cursor's settings UI (if available)

**If MCP doesn't work after restart:**
- Verify the JSON syntax is valid (no trailing commas, proper quotes)
- Check Cursor's logs for MCP errors
- Try testing manually: `npx @danielsogl/lighthouse-mcp`

