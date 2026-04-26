# Campaigns & Events Feature Plan

## Overview
Replace Salesforce and Calendar integrations with local Campaigns and Events management features.

---

## 1. Campaigns Module

### Purpose
Track marketing/sales campaigns and link accounts and opportunities to them.

### Data Model
```javascript
Campaign {
  id: uuid,
  name: string,
  description: text,
  status: enum('planning', 'active', 'completed', 'cancelled'),
  startDate: date,
  endDate: date,
  budget: number,
  targetRevenue: number,
  accountIds: [uuid],  // Accounts assigned to campaign
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Features
1. **Campaign List View**
   - Grid/list of all campaigns
   - Filter by status
   - Sort by date, budget, etc.
   - Quick stats (accounts, opportunities, revenue)

2. **Campaign Creation**
   - Name, description
   - Date range
   - Budget and target revenue
   - Status selection

3. **Campaign Detail View**
   - Campaign information
   - Drag-and-drop zone for accounts
   - List of assigned accounts
   - List of linked opportunities (via hashtag)
   - Campaign metrics:
     - Total accounts
     - Total opportunities
     - Total pipeline value
     - Conversion rate

4. **Account Assignment**
   - Drag accounts from account list into campaign
   - Remove accounts from campaign
   - View all campaigns an account is in

5. **Opportunity Linking**
   - Add campaign hashtag to opportunity (e.g., #Q1Launch)
   - Automatically link opportunities with campaign hashtag
   - View all opportunities for a campaign

### UI Components
```
Campaigns Page
├── Campaign List (cards or table)
├── Create Campaign Button
├── Campaign Detail Modal
│   ├── Campaign Info
│   ├── Accounts Section (drag-drop zone)
│   ├── Opportunities Section (filtered by hashtag)
│   └── Metrics Dashboard
└── Filters & Search
```

---

## 2. Events Module

### Purpose
Track events (conferences, webinars, trade shows) and manage account invitations.

### Data Model
```javascript
Event {
  id: uuid,
  name: string,
  description: text,
  type: enum('conference', 'webinar', 'trade_show', 'workshop', 'meeting', 'other'),
  date: date,
  location: string,
  accountIds: [uuid],  // Accounts invited to event
  createdAt: timestamp,
  updatedAt: timestamp
}

EventInvitation {
  id: uuid,
  eventId: uuid,
  accountId: uuid,
  contactName: string,
  contactPosition: string,
  platform: enum('linkedin', 'email', 'phone', 'in_person', 'other'),
  status: enum('not_sent', 'sent', 'accepted', 'declined', 'attended', 'no_show'),
  sentDate: date,
  responseDate: date,
  notes: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Features
1. **Event List View**
   - Grid/list of all events
   - Filter by type, date
   - Sort by date
   - Quick stats (invitations, attendance)

2. **Event Creation**
   - Name, description
   - Event type
   - Date and location
   - Initial account selection

3. **Event Detail View**
   - Event information
   - Drag-and-drop zone for accounts
   - Invitation management table
   - Event metrics:
     - Total invitations
     - Acceptance rate
     - Attendance rate
     - By platform breakdown

4. **Invitation Management**
   - Add accounts to event (drag-drop)
   - For each account, add invitation details:
     - Contact name
     - Contact position
     - Platform used (LinkedIn, Email, Phone, etc.)
     - Status (sent, accepted, declined, attended)
     - Dates (sent, response)
     - Notes
   - Bulk update invitation status
   - Track who invited whom

5. **Account View Integration**
   - See all events an account is invited to
   - See invitation history
   - Quick add to event

### UI Components
```
Events Page
├── Event List (cards or table)
├── Create Event Button
├── Event Detail Modal
│   ├── Event Info
│   ├── Accounts Section (drag-drop zone)
│   ├── Invitations Table
│   │   ├── Contact Name
│   │   ├── Position
│   │   ├── Platform
│   │   ├── Status
│   │   └── Actions
│   └── Metrics Dashboard
└── Filters & Search
```

---

## 3. Integration with Existing Features

### CRM Pipeline Integration
- Add "Campaign" field to opportunities (hashtag)
- Filter opportunities by campaign
- Show campaign tag on kanban cards

### Accounts Integration
- Show campaigns account is in
- Show events account is invited to
- Quick actions to add to campaign/event

### Dashboard Integration
- Campaign performance metrics
- Event attendance metrics
- Top performing campaigns
- Upcoming events

---

## 4. Implementation Plan

### Phase 1: Remove Old Integrations (30 min)
1. Delete Salesforce files
2. Delete Calendar files
3. Remove from navigation
4. Clean up API endpoints
5. Remove unused dependencies

### Phase 2: Campaigns Module (2-3 hours)
1. Create data structure (campaigns.json)
2. Create API routes
3. Create Campaigns page component
4. Implement drag-and-drop
5. Add campaign hashtag to opportunities
6. Create campaign metrics

### Phase 3: Events Module (2-3 hours)
1. Create data structure (events.json, invitations.json)
2. Create API routes
3. Create Events page component
4. Implement invitation management
5. Add drag-and-drop for accounts
6. Create event metrics

### Phase 4: Integration (1-2 hours)
1. Update CRM to show campaign tags
2. Update Accounts to show campaigns/events
3. Update Dashboard with new metrics
4. Add filters and search

### Phase 5: Polish (1 hour)
1. Add loading states
2. Add error handling
3. Improve UI/UX
4. Add tooltips and help text
5. Test thoroughly

**Total Time: 6-10 hours**

---

## 5. File Structure

```
server/
├── data/
│   ├── campaigns.json
│   ├── events.json
│   └── invitations.json
├── routes/
│   ├── campaigns.js
│   ├── events.js
│   └── invitations.js

client/src/
├── pages/
│   ├── Campaigns.jsx
│   └── Events.jsx
├── components/
│   ├── campaigns/
│   │   ├── CampaignCard.jsx
│   │   ├── CampaignDetail.jsx
│   │   └── AccountDropZone.jsx
│   └── events/
│       ├── EventCard.jsx
│       ├── EventDetail.jsx
│       ├── InvitationTable.jsx
│       └── InvitationForm.jsx
```

---

## 6. API Endpoints

### Campaigns
```
GET    /api/campaigns              - List all campaigns
POST   /api/campaigns              - Create campaign
GET    /api/campaigns/:id          - Get campaign details
PUT    /api/campaigns/:id          - Update campaign
DELETE /api/campaigns/:id          - Delete campaign
POST   /api/campaigns/:id/accounts - Add account to campaign
DELETE /api/campaigns/:id/accounts/:accountId - Remove account
GET    /api/campaigns/:id/opportunities - Get campaign opportunities
```

### Events
```
GET    /api/events                 - List all events
POST   /api/events                 - Create event
GET    /api/events/:id             - Get event details
PUT    /api/events/:id             - Update event
DELETE /api/events/:id             - Delete event
POST   /api/events/:id/accounts    - Add account to event
DELETE /api/events/:id/accounts/:accountId - Remove account
```

### Invitations
```
GET    /api/events/:id/invitations - List event invitations
POST   /api/events/:id/invitations - Create invitation
PUT    /api/invitations/:id        - Update invitation
DELETE /api/invitations/:id        - Delete invitation
```

---

## 7. UI Mockups

### Campaigns Page
```
┌─────────────────────────────────────────────────────────┐
│  Campaigns                          [+ New Campaign]     │
├─────────────────────────────────────────────────────────┤
│  [All] [Active] [Planning] [Completed]   🔍 Search      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Q1 Launch    │  │ Summer Sale  │  │ Partner Prog │  │
│  │ Active       │  │ Planning     │  │ Active       │  │
│  │ 15 Accounts  │  │ 8 Accounts   │  │ 23 Accounts  │  │
│  │ 12 Opps      │  │ 5 Opps       │  │ 18 Opps      │  │
│  │ $450K        │  │ $200K        │  │ $890K        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Campaign Detail
```
┌─────────────────────────────────────────────────────────┐
│  Q1 Launch Campaign                          [Edit] [×]  │
├─────────────────────────────────────────────────────────┤
│  Status: Active  │  Budget: $50K  │  Target: $500K     │
│  Start: Jan 1    │  End: Mar 31                         │
├─────────────────────────────────────────────────────────┤
│  Accounts (15)                    [+ Add Account]        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Drag accounts here or click + to add            │    │
│  │                                                  │    │
│  │  • Acme Corp                              [×]   │    │
│  │  • TechStart Inc                          [×]   │    │
│  │  • Global Solutions                       [×]   │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Opportunities (#Q1Launch) (12)                          │
│  • Enterprise Deal - $150K - Negotiation                 │
│  • Cloud Migration - $80K - Proposal                     │
│  • Support Contract - $45K - Closed Won                  │
└─────────────────────────────────────────────────────────┘
```

### Events Page
```
┌─────────────────────────────────────────────────────────┐
│  Events                                [+ New Event]     │
├─────────────────────────────────────────────────────────┤
│  [All] [Upcoming] [Past]   🔍 Search                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Tech Summit  │  │ Q2 Webinar   │  │ Trade Show   │  │
│  │ Conference   │  │ Webinar      │  │ Trade Show   │  │
│  │ Mar 15, 2024 │  │ Apr 10, 2024 │  │ May 5, 2024  │  │
│  │ 25 Invited   │  │ 50 Invited   │  │ 15 Invited   │  │
│  │ 18 Accepted  │  │ 35 Accepted  │  │ 12 Accepted  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Event Detail with Invitations
```
┌─────────────────────────────────────────────────────────┐
│  Tech Summit 2024                            [Edit] [×]  │
├─────────────────────────────────────────────────────────┤
│  Type: Conference  │  Date: Mar 15, 2024                │
│  Location: San Francisco Convention Center              │
├─────────────────────────────────────────────────────────┤
│  Invitations (25)                  [+ Add Invitation]    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Account      │ Contact  │ Position │ Platform  │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ Acme Corp    │ John Doe │ CTO      │ Email     │    │
│  │              │ Status: Accepted    │ [Edit]    │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ TechStart    │ Jane Sm  │ CEO      │ LinkedIn  │    │
│  │              │ Status: Sent        │ [Edit]    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Next Steps

Ready to implement? I recommend this order:

1. **Start with cleanup** - Remove Salesforce and Calendar code
2. **Build Campaigns** - Simpler feature, good foundation
3. **Build Events** - More complex with invitations
4. **Integrate** - Connect with existing features
5. **Polish** - UI improvements and testing

Would you like me to start with Step 1 (cleanup)?