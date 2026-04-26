# Sales UI - Sales Management Platform

A comprehensive sales management application for tracking deals, campaigns, events, and team performance.

## Features

### 📊 Dashboard
- Sales metrics overview
- Pipeline visualization
- Quick access to key information

### 📅 Daily View
- Daily task management
- Activity tracking
- Diary entries

### 🏢 Accounts
- Customer account management
- Action items per account
- Account history and notes

### 💼 CRM Pipeline
- Kanban board for deals
- Drag-and-drop between stages
- Account linking with autocomplete
- Product tags
- Next meeting scheduling
- Business partner tracking
- Campaign linking

### 📢 Campaigns
- Create and manage sales campaigns
- Assign accounts to campaigns
- Link opportunities to campaigns
- Track campaign performance
- Budget and target revenue tracking
- Campaign status management

### 🎉 Events
- Manage conferences, webinars, trade shows
- Track account invitations
- Record invitation details:
  - Contact name and position
  - Platform used (LinkedIn, Email, Phone, etc.)
  - Invitation status tracking
  - Response dates
- Event attendance tracking

### 🎯 Objectives
- Sales goal tracking
- Activity logging
- Performance metrics

### ⚙️ Settings
- Application configuration
- User preferences

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd UI_Sales
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

### Running the Application

1. **Start the backend server**
```bash
cd server
npm start
```
Server will run on: `http://localhost:3001`

2. **Start the frontend** (in a new terminal)
```bash
cd client
npm run dev
```
Frontend will run on: `http://localhost:5174`

3. **Access the application**
Open your browser to: `http://localhost:5174`

## Project Structure

```
UI_Sales/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DailyView.jsx
│   │   │   ├── Accounts.jsx
│   │   │   ├── CRM.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Objectives.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/    # Reusable components
│   │   │   └── layout/
│   │   │       ├── Layout.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── api/          # API client
│   │   │   └── index.js
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   └── package.json
├── server/                # Express backend
│   ├── routes/           # API routes
│   │   ├── daily.js
│   │   ├── accounts.js
│   │   ├── deals.js
│   │   ├── campaigns.js
│   │   ├── events.js
│   │   ├── objectives.js
│   │   └── settings.js
│   ├── data/             # JSON database
│   │   ├── daily.json
│   │   ├── accounts.json
│   │   ├── deals.json
│   │   ├── campaigns.json
│   │   ├── events.json
│   │   ├── invitations.json
│   │   ├── objectives.json
│   │   └── settings.json
│   ├── db.js            # Database helper
│   ├── index.js         # Server entry point
│   └── package.json
└── README.md            # This file
```

## API Endpoints

### Deals
- `GET /api/deals` - List all deals
- `POST /api/deals` - Create deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/accounts` - Add account to campaign
- `DELETE /api/campaigns/:id/accounts/:accountId` - Remove account
- `GET /api/campaigns/:id/opportunities` - Get linked opportunities

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/accounts` - Add account to event
- `DELETE /api/events/:id/accounts/:accountId` - Remove account
- `GET /api/events/:id/invitations` - List event invitations
- `POST /api/events/:id/invitations` - Create invitation
- `PUT /api/invitations/:id` - Update invitation
- `DELETE /api/invitations/:id` - Delete invitation

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Objectives
- `GET /api/objectives` - List objectives
- `PUT /api/objectives/:id` - Update objective
- `POST /api/objectives/log` - Log activity
- `GET /api/objectives/logs` - Get activity logs

## Data Storage

All data is stored locally in JSON files in the `server/data/` directory:
- `deals.json` - CRM opportunities
- `accounts.json` - Customer accounts
- `campaigns.json` - Sales campaigns
- `events.json` - Events and conferences
- `invitations.json` - Event invitations
- `daily.json` - Daily activities
- `objectives.json` - Sales objectives
- `settings.json` - App settings

## Key Features Explained

### Campaign Management
Create campaigns to organize your sales efforts. Assign accounts to campaigns and link opportunities by adding the campaign name to the opportunity's campaign field. Track campaign performance with built-in metrics.

### Event Tracking
Manage events like conferences, webinars, and trade shows. For each event, you can:
- Add accounts you want to invite
- Create detailed invitations for each account
- Track who you invited, their position, and how you reached out
- Monitor invitation status (sent, accepted, declined, attended)
- Record response dates and notes

### CRM Pipeline
Visual kanban board for managing deals through your sales stages:
1. Engage
2. Qualify
3. Design
4. Propose
5. Negotiate
6. Closing
7. Won
8. Lost

Drag deals between stages and track progress with automatic activity logging.

## Technology Stack

- **Frontend**: React 18, React Router 6, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: lowdb (JSON-based)
- **Date Handling**: dayjs
- **HTTP Client**: Axios

## Development

### Frontend Development
```bash
cd client
npm run dev
```
Hot module replacement enabled for fast development.

### Backend Development
```bash
cd server
npm run dev  # or npm start
```
Restart server after making changes.

### Building for Production
```bash
cd client
npm run build
```
Builds the app for production to the `dist` folder.

## Common Tasks

### Creating a Deal
1. Go to CRM Pipeline
2. Click "+ New Deal"
3. Fill in details (name, account, value, etc.)
4. Optionally add campaign name
5. Click "Create Opportunity"

### Managing Campaigns
1. Go to Campaigns page
2. Click "+ New Campaign"
3. Set name, budget, dates, etc.
4. Click on campaign card to view details
5. Add accounts using the dropdown
6. View linked opportunities automatically

### Tracking Event Invitations
1. Go to Events page
2. Click "+ New Event"
3. Set event details
4. Click on event card to view details
5. Add accounts to invite
6. Click "+ Add Invitation" for each account
7. Fill in contact details and platform used
8. Update status as you progress

## Troubleshooting

### Port Already in Use
If you see "EADDRINUSE" error:
```bash
# Find and kill the process using the port
lsof -ti:3001 | xargs kill -9  # For server
lsof -ti:5174 | xargs kill -9  # For client
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Data Reset
To reset all data, delete the JSON files in `server/data/` and restart the server. They will be recreated with empty arrays.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private project for internal use.

## Support

For issues or questions, please contact the development team.

---

**Made with ❤️ for sales teams**