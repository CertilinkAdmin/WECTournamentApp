# OPUX MCP Setup Instructions

## Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup-opux-mcp.sh
```

This script will:
- ✅ Detect your operating system
- ✅ Create the MCP configuration file in the correct location
- ✅ Set up Lighthouse MCP using npx (no installation needed)
- ✅ Backup existing config if present

## Manual Setup

If you prefer to set up manually, follow these steps:

### Step 1: Locate Cursor MCP Config Directory

**macOS:**
```
~/Library/Application Support/Cursor/User/globalStorage/mcp.json
```

**Linux:**
```
~/.config/Cursor/User/globalStorage/mcp.json
```

**Windows:**
```
%APPDATA%\Cursor\User\globalStorage\mcp.json
```

### Step 2: Create MCP Configuration File

Create or edit the `mcp.json` file with this content:

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

### Step 3: Restart Cursor

After creating the configuration file, restart Cursor completely to load the MCP servers.

### Step 4: Verify Setup

1. Open Cursor Settings
2. Navigate to **MCP** or **Model Context Protocol** settings
3. Verify that "lighthouse" appears in the list of MCP servers
4. Check that it shows as "Connected" or "Ready"

### Step 5: Test the Setup

Try using the OPUX workflow:

```
Run OPUX Step 1: Lighthouse audit on http://localhost:5173
```

Or ask Cursor:
```
Use Lighthouse MCP to audit the application
```

## Troubleshooting

### MCP Not Appearing in Cursor

1. **Check file location**: Ensure the `mcp.json` file is in the correct location for your OS
2. **Check JSON syntax**: Validate the JSON is correct (no trailing commas, proper quotes)
3. **Restart Cursor**: Fully quit and restart Cursor (not just reload window)
4. **Check Cursor version**: Ensure you're using a recent version of Cursor that supports MCP

### Permission Issues

If you encounter permission errors:

```bash
# Linux/macOS: Fix directory permissions
mkdir -p ~/.config/Cursor/User/globalStorage
chmod 755 ~/.config/Cursor/User/globalStorage
```

### Node.js Not Found

If you get "Node.js not found" errors:

1. Ensure Node.js is installed: `node --version`
2. Ensure npm is installed: `npm --version`
3. If using npx method, Node.js must be in your PATH

### Alternative: Use Global Installation

If npx doesn't work, you can install globally:

```bash
npm install -g @danielsogl/lighthouse-mcp
```

Then update `mcp.json`:

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

## What Gets Installed?

**Nothing!** When using the `npx` method:
- ✅ No global packages installed
- ✅ No project dependencies added
- ✅ Lighthouse MCP downloaded on-demand when first used
- ✅ Always uses the latest version

## Verification Checklist

- [ ] MCP config file created in correct location
- [ ] JSON syntax is valid
- [ ] Cursor restarted after configuration
- [ ] Lighthouse MCP appears in Cursor MCP settings
- [ ] MCP shows as "Connected" or "Ready"
- [ ] Can run Lighthouse audit via chat

## Next Steps

Once MCP is set up:

1. **Test OPUX Workflow**: Run a Lighthouse audit on your application
2. **Review Results**: Check the audit report for issues
3. **Run OPUX Steps**: Follow the 4-step OPUX workflow:
   - Step 1: Lighthouse audit
   - Step 2: Responsive refactor (code-based)
   - Step 3: Tailwind optimization (code-based)
   - Step 4: Verify with Lighthouse again

## Support

For issues with:
- **MCP Setup**: Check Cursor MCP documentation
- **Lighthouse**: Check Lighthouse MCP package documentation
- **OPUX Workflow**: See `.cursorrules` file in project root

