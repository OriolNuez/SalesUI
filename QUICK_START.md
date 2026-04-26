# Sales UI - Quick Start Guide

## Starting the Application

### 1. Start the Backend Server
```bash
cd server
npm start
```
Server will run on: `http://localhost:3001`

### 2. Start the Frontend
```bash
cd client
npm run dev
```
Frontend will run on: `http://localhost:5174`

### 3. Access the Application
Open your browser to: `http://localhost:5174`

## Features Overview

### 📊 Dashboard
- Sales metrics overview
- Quick access to key information

### 📅 Daily View
- Daily task management
- Activity tracking
- Diary entries

### 🏢 Accounts
- Customer account management
- Action items per account
- Account history

### 💼 CRM Pipeline
- Kanban board for deals
- Drag-and-drop between stages
- Account linking with autocomplete
- Product tags
- Next meeting scheduling
- Business partner tracking

### 🎯 Objectives
- Sales goal tracking
- Activity logging
- Performance metrics

### ☁️ Salesforce Integration
- Connect to Salesforce
- Browse opportunities and accounts
- Import data with one click
- Automatic stage mapping

### 📆 Calendar (Outlook)
- View your Outlook calendar
- Week and month views
- Create, edit, and delete events
- Real-time sync with Outlook

### ⚙️ Settings
- Application configuration
- User preferences

## Calendar Setup (First Time)

1. **Register Azure Application**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Create new app registration
   - Add redirect URI: `http://localhost:3001/api/calendar/callback`
   - Add permissions: `Calendars.ReadWrite`, `offline_access`
   - Create client secret

2. **Configure Environment**:
   - Edit `server/.env`
   - Add your `MS_CLIENT_ID` and `MS_CLIENT_SECRET`

3. **Connect Calendar**:
   - Navigate to Calendar page
   - Click "Connect to Outlook"
   - Sign in with Microsoft account
   - Grant permissions

See [`CALENDAR_SETUP.md`](CALENDAR_SETUP.md) for detailed instructions.

## Salesforce Setup (First Time)

1. **Register Salesforce Connected App**:
   - Go to Salesforce Setup
   - Create Connected App
   - Add callback URL: `http://localhost:3001/api/salesforce/callback`
   - Enable OAuth settings

2. **Configure Environment**:
   - Edit `server/.env`
   - Add your `SF_CLIENT_ID` and `SF_CLIENT_SECRET`

3. **Connect Salesforce**:
   - Navigate to Salesforce page
   - Click "Connect to Salesforce"
   - Authorize the application

## Common Tasks

### Creating a Deal
1. Go to CRM Pipeline
2. Click "+ New Deal"
3. Fill in details (title, value, account, etc.)
4. Add products as tags
5. Set next meeting date
6. Click "Create Deal"

### Importing from Salesforce
1. Go to Salesforce page
2. Click "Connect to Salesforce" (if not connected)
3. Browse opportunities or accounts
4. Select items to import
5. Click "Import Selected"

### Managing Calendar Events
1. Go to Calendar page
2. Click "Connect to Outlook" (if not connected)
3. Click "+ New Event" to create
4. Click any event to edit or delete
5. Switch between Week/Month views

## Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify `node_modules` are installed: `npm install`
- Check for errors in console

### Client won't start
- Check if port 5174 is available
- Verify `node_modules` are installed: `npm install`
- Clear browser cache

### Calendar not connecting
- Verify Azure app credentials in `.env`
- Check redirect URI matches exactly
- Ensure permissions are granted in Azure Portal

### Salesforce not connecting
- Verify Salesforce credentials in `.env`
- Check callback URL in Salesforce Connected App
- Ensure OAuth is enabled

## Environment Variables

Required in `server/.env`:

```env
# Salesforce (optional - only if using Salesforce integration)
SF_CLIENT_ID=your-salesforce-client-id
SF_CLIENT_SECRET=your-salesforce-client-secret
SF_REDIRECT_URI=http://localhost:3001/api/salesforce/callback

# Microsoft Graph (optional - only if using Calendar integration)
MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
MS_TENANT_ID=common
MS_REDIRECT_URI=http://localhost:3001/api/calendar/callback
```

## Data Storage

All data is stored locally in JSON files:
- `server/data/deals.json` - CRM deals
- `server/data/accounts.json` - Customer accounts
- `server/data/daily.json` - Daily activities
- `server/data/objectives.json` - Sales objectives
- `server/data/settings.json` - App settings

## Tips

- **Drag and Drop**: In CRM, drag deals between pipeline stages
- **Autocomplete**: Start typing account names for quick selection
- **Product Tags**: Add multiple products to deals for better tracking
- **Next Meeting**: Set meeting dates to stay organized
- **Import Smart**: Salesforce import automatically links accounts to opportunities
- **Calendar Sync**: Changes in the app sync immediately to Outlook

## Support

For detailed setup instructions:
- Calendar: See [`CALENDAR_SETUP.md`](CALENDAR_SETUP.md)
- Full Documentation: See [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)

## Ports Used

- **Backend API**: 3001
- **Frontend Dev**: 5174

Make sure these ports are available before starting the application.