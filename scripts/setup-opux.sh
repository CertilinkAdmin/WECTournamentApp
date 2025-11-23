#!/bin/bash

# OPUX Setup Script
# This script helps set up the OPUX workflow by installing dependencies and configuring MCP

set -e

echo "🚀 OPUX Setup Script"
echo "===================="
echo ""

# Check Node.js and npm
echo "📦 Checking Node.js and npm..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# Check if lighthouse is installed
echo "🔍 Checking Lighthouse installation..."
if npm list lighthouse &> /dev/null; then
    echo "✅ Lighthouse is already installed"
else
    echo "📥 Installing Lighthouse..."
    npm install --save-dev lighthouse
fi
echo ""

# Check for Lighthouse MCP
echo "🔍 Checking for Lighthouse MCP..."
if npm list @danielsogl/lighthouse-mcp &> /dev/null; then
    echo "✅ @danielsogl/lighthouse-mcp is installed locally"
elif command -v npx &> /dev/null; then
    echo "✅ Lighthouse MCP can be run via npx"
else
    echo "⚠️  Lighthouse MCP will need to be installed or run via npx"
fi
echo ""

# Determine Cursor config location
echo "📁 Cursor MCP Configuration Location:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Cursor/User/globalStorage/mcp.json"
    echo "   macOS: $CONFIG_PATH"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_PATH="$HOME/.config/Cursor/User/globalStorage/mcp.json"
    echo "   Linux: $CONFIG_PATH"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    CONFIG_PATH="$APPDATA/Cursor/User/globalStorage/mcp.json"
    echo "   Windows: $CONFIG_PATH"
fi
echo ""

# Check if config exists
if [ -f "$CONFIG_PATH" ]; then
    echo "✅ MCP configuration file exists"
    echo "   Review it to ensure Lighthouse MCP is configured"
else
    echo "⚠️  MCP configuration file does not exist"
    echo "   Create it at: $CONFIG_PATH"
    echo "   Use mcp-config.example.json as a template"
fi
echo ""

# Create example config if it doesn't exist
if [ ! -f "mcp-config.example.json" ]; then
    echo "📝 Creating example MCP configuration..."
    cat > mcp-config.example.json << 'EOF'
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "@danielsogl/lighthouse-mcp"],
      "env": {}
    }
  }
}
EOF
    echo "✅ Created mcp-config.example.json"
fi
echo ""

echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Copy mcp-config.example.json to your Cursor MCP config location"
echo "2. Restart Cursor"
echo "3. Verify MCP servers are available in Cursor settings"
echo "4. Start using OPUX workflow!"
echo ""
echo "📚 Documentation:"
echo "   - OPUX_MCP_SETUP.md - Detailed setup guide"
echo "   - OPUX_QUICK_REFERENCE.md - Quick command reference"
echo "   - .cursorrules - OPUX workflow definition"
echo ""

