# Outlook Calendar Integration Setup Guide

This guide will help you set up the web UI integration for Outlook Calendar.

## Overview

The integration provides an interactive calendar interface where you can:
- View your Outlook calendar events in week and month views
- Create new calendar events
- Edit existing events
- Delete events
- All changes sync directly with your Outlook calendar

## Prerequisites

- Microsoft 365 account with Outlook Calendar
- Azure Portal access to register an application

## Step 1: Register Azure Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the application:
   - **Name**: `Sales UI Calendar Integration`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: 
     - Platform: `Web`
     - URI: `http://localhost:3000/api/calendar/callback`
5. Click **Register**

## Step 2: Configure Application Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `Calendars.ReadWrite`
   - `Calendars.ReadWrite.Shared`
   - `offline_access` (for refresh tokens)
4. Click **Add permissions**
5. Click **Grant admin consent** (if you have admin rights)

## Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "Calendar Integration Secret")
4. Choose expiration period
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately (you won't be able to see it again)

## Step 4: Configure Server Environment Variables

1. Open `server/.env`
2. Add your Microsoft credentials:

```env
# Microsoft Graph API Configuration
MS_CLIENT_ID=your-application-client-id
MS_CLIENT_SECRET=your-client-secret-value
MS_TENANT_ID=common
MS_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

Replace:
- `your-application-client-id` with the Application (client) ID from Azure Portal
- `your-client-secret-value` with the secret you copied

## Step 5: Start the Application

1. **Start the Express server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the Vite client**:
   ```bash
   cd client
   npm run dev
   ```

## Step 6: Connect Your Calendar

1. Open browser to `http://localhost:5174/calendar`
2. Click "Connect to Outlook"
3. Sign in with your Microsoft account
4. Grant the requested permissions
5. You'll be redirected back to the calendar page

## Using the Calendar

### View Events
- Switch between **Week View** and **Month View** using the tabs
- Navigate using the **Previous** and **Next** buttons
- Click **Today** to jump to the current date

### Create Events
1. Click the **+ New Event** button
2. Fill in the event details:
   - **Title** (required)
   - **Start Date & Time**
   - **End Date & Time**
   - **Location** (optional)
   - **Description** (optional)
3. Click **Create Event**

### Edit Events
1. Click on any event in the calendar
2. Modify the details in the form
3. Click **Save Changes**

### Delete Events
1. Click on the event you want to delete
2. Click the **Delete** button
3. Confirm the deletion

## API Endpoints

The Express server provides these calendar endpoints:

- `GET /api/calendar/auth` - Initiate OAuth flow
- `GET /api/calendar/callback` - OAuth callback handler
- `GET /api/calendar/events` - List calendar events
- `POST /api/calendar/events` - Create new event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event
- `GET /api/calendar/status` - Check authentication status

## Troubleshooting

### "Authentication failed" error:
- Verify your Client ID and Secret are correct
- Check that redirect URI matches exactly: `http://localhost:3000/api/calendar/callback`
- Ensure API permissions are granted

### "Token expired" error:
- Click "Connect to Outlook" again to re-authenticate
- The system will automatically refresh tokens when needed

### Calendar events not showing:
- Check browser console for errors
- Verify the Express server is running on port 3000
- Check server logs for API errors
- Ensure you've granted calendar permissions

### CORS errors:
- Verify both servers are running (Express on 3000, Vite on 5174)
- Check that API calls use the correct base URL

## Security Notes

- **Never commit** your `.env` file with real credentials
- Client secrets should be rotated regularly
- Consider using Azure Key Vault for production deployments
- Tokens are stored in server sessions and automatically refreshed

## Features

- **Week View**: See your week at a glance with time slots
- **Month View**: Overview of the entire month
- **Event Creation**: Quick form to add new events
- **Event Editing**: Click any event to modify details
- **Event Deletion**: Remove events with confirmation
- **Real-time Sync**: All changes immediately sync with Outlook
- **OAuth2 Security**: Secure authentication with Microsoft

## Next Steps

Once configured, you can:
- Manage your calendar directly from the Sales UI
- Schedule meetings with clients
- Track important deadlines
- Coordinate with your team

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure you have the required Microsoft Graph API permissions
4. Check that both servers (Express and Vite) are running
5. Try re-authenticating by clicking "Connect to Outlook" again