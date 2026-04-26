# Sales UI Project - Complete Summary

## Project Overview
A comprehensive sales management application with CRM, Salesforce integration, and Outlook Calendar integration.

## Technology Stack
- **Frontend**: React, React Router, Tailwind CSS, Vite
- **Backend**: Express.js, lowdb (JSON database)
- **Integrations**: Salesforce (jsforce), Microsoft Graph API
- **Date Handling**: dayjs

## Features Implemented

### 1. CRM System (`/crm`)
Enhanced opportunity management with:
- **Kanban board** with drag-and-drop between pipeline stages
- **Account linking** with autocomplete search
- **Auto-account creation** when entering new account names
- **Product tags** for tracking products in deals
- **Next meeting** datetime tracking
- **Next steps** text field for action items
- **Business partner** field
- **ISC link** field for external references
- **Full edit mode** in deal detail modal
- Enhanced kanban cards showing products and next meeting

**Key Files**:
- [`server/routes/deals.js`](server/routes/deals.js) - Deal management API with account auto-creation
- [`client/src/pages/CRM.jsx`](client/src/pages/CRM.jsx) - Complete CRM UI with all enhancements

### 2. Salesforce Integration (`/salesforce`)
Full OAuth2 integration with data import:
- **OAuth2 authentication** flow with Salesforce
- **Browse opportunities** from Salesforce with filtering
- **Browse accounts** from Salesforce
- **Import data** with automatic stage mapping
- **Auto-linking** of accounts to opportunities during import
- **Connection status** indicator

**Key Files**:
- [`server/routes/salesforce.js`](server/routes/salesforce.js) - Salesforce OAuth and API integration
- [`client/src/pages/Salesforce.jsx`](client/src/pages/Salesforce.jsx) - Salesforce UI with import functionality
- [`server/.env`](server/.env) - Salesforce credentials (SF_CLIENT_ID, SF_CLIENT_SECRET)

### 3. Outlook Calendar Integration (`/calendar`)
Interactive web UI for calendar management:
- **Week and month views** with navigation
- **Create events** with form modal
- **Edit events** inline
- **Delete events** with confirmation
- **OAuth2 authentication** with Microsoft Graph
- **Real-time sync** with Outlook

**Key Files**:
- [`server/routes/calendar.js`](server/routes/calendar.js) - Calendar API with Microsoft Graph
- [`client/src/pages/Calendar.jsx`](client/src/pages/Calendar.jsx) - Calendar UI component
- [`CALENDAR_SETUP.md`](CALENDAR_SETUP.md) - Complete setup guide

### 4. Other Features
- **Dashboard** - Overview of sales metrics
- **Accounts** - Account management
- **Daily View** - Daily activity tracking
- **Objectives** - Goal tracking
- **Settings** - Application configuration

## API Endpoints

### Deals API (`/api/deals`)
- `GET /api/deals` - List all deals
- `POST /api/deals` - Create deal (with auto-account creation)
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Salesforce API (`/api/salesforce`)
- `GET /api/salesforce/auth` - Initiate OAuth
- `GET /api/salesforce/callback` - OAuth callback
- `GET /api/salesforce/opportunities` - List opportunities
- `GET /api/salesforce/accounts` - List accounts
- `POST /api/salesforce/import` - Import data

### Calendar API (`/api/calendar`)
- `GET /api/calendar/auth` - Initiate OAuth
- `GET /api/calendar/callback` - OAuth callback
- `GET /api/calendar/events` - List events
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event
- `GET /api/calendar/status` - Auth status

## Setup Instructions

### 1. Install Dependencies
```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### 2. Configure Environment Variables

Edit `server/.env`:
```env
# Salesforce
SF_CLIENT_ID=your-salesforce-client-id
SF_CLIENT_SECRET=your-salesforce-client-secret
SF_REDIRECT_URI=http://localhost:3000/api/salesforce/callback

# Microsoft Graph
MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
MS_TENANT_ID=common
MS_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

### 3. Start the Application
```bash
# Terminal 1 - Start Express server
cd server
npm start

# Terminal 2 - Start Vite dev server
cd client
npm run dev
```

### 4. Access the Application
- **Main App**: http://localhost:5174
- **CRM**: http://localhost:5174/crm
- **Salesforce**: http://localhost:5174/salesforce
- **Calendar**: http://localhost:5174/calendar

## Configuration Guides

- **Salesforce Setup**: Register app at https://developer.salesforce.com
- **Calendar Setup**: See [`CALENDAR_SETUP.md`](CALENDAR_SETUP.md) for detailed Azure Portal configuration

## Data Storage

All data is stored in JSON files in `server/data/`:
- `deals.json` - CRM opportunities
- `accounts.json` - Customer accounts
- `daily.json` - Daily activities
- `objectives.json` - Sales objectives
- `settings.json` - Application settings

## Key Enhancements Made

1. **Account Auto-Creation**: When creating a deal with a new account name, the system automatically creates the account
2. **Product Tracking**: Added product tags to deals for better product-level reporting
3. **Meeting Management**: Next meeting field with datetime picker for scheduling
4. **Salesforce Import**: One-click import of opportunities and accounts with automatic stage mapping
5. **Calendar Integration**: Full calendar management with interactive web UI
6. **Enhanced UI**: Improved kanban cards, modals, and forms throughout

## Next Steps

To complete the setup:
1. Register applications in Salesforce and Azure Portal
2. Configure environment variables with real credentials
3. Test all integrations

## Troubleshooting

- **Port conflicts**: Ensure ports 3000 (Express) and 5174 (Vite) are available
- **CORS errors**: Check that API calls use correct base URL
- **Auth failures**: Verify redirect URIs match exactly in provider settings

## Project Structure
```
UI_Sales/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── api/          # API client
│   └── package.json
├── server/                # Express backend
│   ├── routes/           # API routes
│   ├── data/             # JSON database
│   └── package.json
├── CALENDAR_SETUP.md     # Calendar setup guide
└── PROJECT_SUMMARY.md    # This file
```

## Technologies Used

- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server
- **Express.js** - Backend server
- **lowdb** - JSON database
- **jsforce** - Salesforce API client
- **@microsoft/microsoft-graph-client** - Microsoft Graph API
- **express-session** - Session management
- **dayjs** - Date manipulation

## License

This is a private project for sales management.