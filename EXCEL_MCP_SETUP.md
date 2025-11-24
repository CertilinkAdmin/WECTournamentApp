# Excel MCP Setup for Google Sheets Integration

## Current Situation

You have an Excel MCP server configured in `~/.cursor/mcp.json`, but the spreadsheet is a **Google Sheets** document, not an Excel file.

## Options

### Option 1: Use Excel MCP (Current Setup)
To use the Excel MCP server with your Google Sheets:

1. **Export Google Sheets to Excel**:
   - Open the Google Sheet: https://docs.google.com/spreadsheets/d/1zhIZk5t66I0prIntx5T9c0PS0yAA3wKyfcFXqNCPT0g/edit?gid=0#gid=0
   - Go to File → Download → Microsoft Excel (.xlsx)
   - Save the file (e.g., `wec2025-data.xlsx`)

2. **Use Excel MCP to Parse**:
   - The Excel MCP server can then read the `.xlsx` file
   - Parse the data programmatically
   - Import into the database

### Option 2: Set Up Google Sheets MCP (Recommended)
For direct access to Google Sheets without exporting:

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com/
   - Create a new project
   - Enable Google Sheets API and Google Drive API

2. **Create Service Account**:
   - IAM & Admin → Service Accounts
   - Create new service account
   - Generate JSON key file

3. **Update mcp.json**:
   ```json
   {
     "mcpServers": {
       "excel": {
         "command": "cmd",
         "args": ["/c", "npx", "--yes", "@negokaz/excel-mcp-server"],
         "env": {
           "EXCEL_MCP_PAGING_CELLS_LIMIT": "4000"
         }
       },
       "google-sheets": {
         "command": "uvx",
         "args": ["google-sheets-mcp@latest"],
         "env": {
           "project_id": "YOUR_PROJECT_ID",
           "private_key_id": "YOUR_PRIVATE_KEY_ID",
           "private_key": "YOUR_PRIVATE_KEY",
           "client_email": "YOUR_CLIENT_EMAIL",
           "client_id": "YOUR_CLIENT_ID",
           "client_x509_cert_url": "YOUR_CLIENT_X509_CERT_URL"
         }
       }
     }
   }
   ```

4. **Share Google Sheet with Service Account**:
   - Open the Google Sheet
   - Click Share
   - Add the service account email (from JSON key)
   - Grant "Editor" access

## Current Script Status

The script `scripts/create-wec2025-tournament-2-fixed.ts` currently uses **hardcoded data** from the spreadsheet. 

To make it dynamic with MCP:

1. **With Excel MCP**: Export sheet → Read with MCP → Parse → Import
2. **With Google Sheets MCP**: Direct API access → Parse → Import

## Next Steps

1. Choose Option 1 (Excel) or Option 2 (Google Sheets MCP)
2. If Excel: Download the sheet and update the script to use MCP
3. If Google Sheets MCP: Set up the service account and configure MCP
4. Update the import script to use MCP for data parsing

## Benefits of Using MCP

- **Automatic Updates**: Re-run script to sync latest data
- **No Manual Copying**: Direct access to spreadsheet
- **Error Reduction**: Automated parsing reduces mistakes
- **Scalability**: Easy to add more heats/data


