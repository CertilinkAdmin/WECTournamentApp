#!/bin/bash

# OPUX MCP Setup Script
# This script helps set up the MCP configuration for Cursor

set -e

echo "🔧 OPUX MCP Setup Script"
echo "========================"
echo ""

# Detect OS and set config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    MCP_CONFIG_PATH="$HOME/Library/Application Support/Cursor/User/globalStorage/mcp.json"
    OS_NAME="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MCP_CONFIG_PATH="$HOME/.config/Cursor/User/globalStorage/mcp.json"
    OS_NAME="Linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    MCP_CONFIG_PATH="$APPDATA/Cursor/User/globalStorage/mcp.json"
    OS_NAME="Windows"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo "📍 Detected OS: $OS_NAME"
echo "📍 MCP Config Path: $MCP_CONFIG_PATH"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Create directory if it doesn't exist
MCP_CONFIG_DIR=$(dirname "$MCP_CONFIG_PATH")
if [ ! -d "$MCP_CONFIG_DIR" ]; then
    echo "📁 Creating directory: $MCP_CONFIG_DIR"
    mkdir -p "$MCP_CONFIG_DIR"
fi

# Check if config file already exists
if [ -f "$MCP_CONFIG_PATH" ]; then
    echo "⚠️  MCP config file already exists at: $MCP_CONFIG_PATH"
    echo ""
    echo "Current contents:"
    cat "$MCP_CONFIG_PATH"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 0
    fi
    
    # Backup existing config
    BACKUP_PATH="${MCP_CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Backing up existing config to: $BACKUP_PATH"
    cp "$MCP_CONFIG_PATH" "$BACKUP_PATH"
fi

# Create MCP configuration
echo "📝 Creating MCP configuration..."
cat > "$MCP_CONFIG_PATH" << 'EOF'
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

echo "✅ MCP configuration created successfully!"
echo ""
echo "📋 Configuration:"
cat "$MCP_CONFIG_PATH"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📌 Next steps:"
echo "1. Restart Cursor to load the MCP configuration"
echo "2. Verify MCP is connected in Cursor Settings > MCP"
echo "3. Test by running: 'Run OPUX Step 1: Lighthouse audit'"
echo ""
echo "💡 Note: The Lighthouse MCP will be downloaded automatically via npx when first used."
echo ""

