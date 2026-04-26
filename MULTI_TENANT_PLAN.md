# Multi-Tenant Sales Platform - Implementation Plan

## Executive Summary

Transform the current single-user Sales UI into a collaborative multi-tenant platform where sales teams can work together, track campaigns, monitor account activities, and visualize performance data.

## Key Requirements

### 1. Multi-User Authentication & Authorization
- Individual user accounts with secure login
- Role-based access control (Admin, Team Lead, Sales Rep)
- Team-based data isolation
- SSO integration (optional for enterprise)

### 2. Team Management
- Create and manage multiple teams
- Assign users to teams
- Team-specific data visibility
- Cross-team collaboration options

### 3. Campaign Management
- Create campaigns per team
- Track campaign activities and outcomes
- Assign deals/accounts to campaigns
- Campaign performance metrics
- Collaborative campaign planning

### 4. Activity/Event Tracking
- Log all account interactions (emails, calls, meetings, invites)
- Track who did what and when
- Link activities to accounts and deals
- Activity timeline per account
- Team activity feed

### 5. Data Visualization & Analytics
- Interactive dashboards with charts
- Team performance comparisons
- Campaign ROI analysis
- Activity heatmaps
- Pipeline velocity metrics
- Individual and team leaderboards

### 6. Production Deployment
- Cloud hosting (AWS, Azure, or DigitalOcean)
- Scalable infrastructure
- Automated backups
- SSL/HTTPS security
- Domain setup

---

## Technical Architecture

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Database Migration
**Current**: JSON files (lowdb)
**Target**: PostgreSQL or MongoDB

**Why**: 
- Better concurrent access
- ACID compliance
- Relationships and joins
- Scalability
- Better query performance

**Schema Design**:
```
Users
- id, email, password_hash, name, role, team_id, created_at

Teams
- id, name, description, created_at

Deals (enhanced)
- id, title, value, stage, account_id, owner_id, team_id, campaign_id, created_at, updated_at

Accounts (enhanced)
- id, name, industry, owner_id, team_id, created_at, updated_at

Campaigns
- id, name, description, team_id, start_date, end_date, budget, status, created_by, created_at

Activities
- id, type, description, account_id, deal_id, user_id, team_id, campaign_id, created_at

ActivityTypes: email_sent, call_made, meeting_held, invite_sent, demo_scheduled, proposal_sent, etc.
```

**Technology Stack**:
- **Database**: PostgreSQL (recommended) or MongoDB
- **ORM**: Sequelize (PostgreSQL) or Mongoose (MongoDB)
- **Migration Tool**: Sequelize CLI or Prisma

#### 1.2 Authentication System
**Implementation**:
- JWT-based authentication
- Secure password hashing (bcrypt)
- Session management
- Password reset flow
- Email verification (optional)

**Libraries**:
- `jsonwebtoken` - JWT tokens
- `bcrypt` - Password hashing
- `passport` - Authentication middleware
- `express-validator` - Input validation

**Endpoints**:
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user
POST /api/auth/refresh - Refresh token
POST /api/auth/forgot-password - Password reset request
POST /api/auth/reset-password - Reset password
```

#### 1.3 Authorization & Access Control
**Role Hierarchy**:
1. **Super Admin** - Full system access
2. **Team Admin** - Manage team, view all team data
3. **Sales Rep** - View own data + team data (read-only for others)

**Access Rules**:
- Users can only see data from their team
- Users can only edit their own deals/activities
- Team Admins can edit all team data
- Super Admins can access everything

**Middleware**:
```javascript
// Protect routes
const authenticate = require('./middleware/auth');
const authorize = require('./middleware/authorize');

router.get('/deals', authenticate, getDeals);
router.post('/deals', authenticate, authorize(['admin', 'rep']), createDeal);
router.delete('/deals/:id', authenticate, authorize(['admin']), deleteDeal);
```

---

### Phase 2: Core Features (Weeks 3-4)

#### 2.1 Team Management Module

**Features**:
- Create/edit/delete teams
- Invite users to teams
- Assign team roles
- View team members
- Team settings

**UI Components**:
- Team selector dropdown (switch between teams if user is in multiple)
- Team management page (admin only)
- User invitation modal
- Team member list with roles

**API Endpoints**:
```
GET /api/teams - List teams (user's teams)
POST /api/teams - Create team (admin only)
GET /api/teams/:id - Get team details
PUT /api/teams/:id - Update team
DELETE /api/teams/:id - Delete team
POST /api/teams/:id/invite - Invite user to team
GET /api/teams/:id/members - List team members
PUT /api/teams/:id/members/:userId - Update member role
DELETE /api/teams/:id/members/:userId - Remove member
```

#### 2.2 Campaign Management Module

**Features**:
- Create campaigns with goals and budgets
- Assign deals to campaigns
- Track campaign activities
- Campaign performance dashboard
- Campaign timeline view

**Data Model**:
```javascript
Campaign {
  id: uuid,
  name: string,
  description: text,
  team_id: uuid,
  start_date: date,
  end_date: date,
  budget: decimal,
  target_revenue: decimal,
  status: enum('planning', 'active', 'completed', 'cancelled'),
  created_by: uuid,
  created_at: timestamp,
  updated_at: timestamp
}

CampaignMetrics {
  campaign_id: uuid,
  deals_count: int,
  total_value: decimal,
  won_deals: int,
  won_value: decimal,
  activities_count: int,
  conversion_rate: decimal
}
```

**UI Components**:
- Campaigns list page
- Campaign creation modal
- Campaign detail page with metrics
- Campaign assignment to deals
- Campaign activity feed

**API Endpoints**:
```
GET /api/campaigns - List campaigns (team-filtered)
POST /api/campaigns - Create campaign
GET /api/campaigns/:id - Get campaign details
PUT /api/campaigns/:id - Update campaign
DELETE /api/campaigns/:id - Delete campaign
GET /api/campaigns/:id/metrics - Get campaign metrics
GET /api/campaigns/:id/deals - Get campaign deals
GET /api/campaigns/:id/activities - Get campaign activities
```

#### 2.3 Activity Tracking System

**Activity Types**:
- Email sent
- Call made
- Meeting held
- Invite sent
- Demo scheduled
- Proposal sent
- Contract sent
- Follow-up scheduled
- Note added

**Features**:
- Log activities against accounts/deals
- Activity timeline per account
- Team activity feed
- Activity search and filtering
- Activity templates
- Bulk activity logging

**Data Model**:
```javascript
Activity {
  id: uuid,
  type: enum('email', 'call', 'meeting', 'invite', 'demo', 'proposal', 'contract', 'note'),
  subject: string,
  description: text,
  account_id: uuid,
  deal_id: uuid (optional),
  campaign_id: uuid (optional),
  user_id: uuid,
  team_id: uuid,
  outcome: enum('positive', 'neutral', 'negative', 'pending'),
  next_action: text,
  next_action_date: date,
  created_at: timestamp
}
```

**UI Components**:
- Activity log modal (quick add)
- Activity timeline component
- Activity feed (team-wide)
- Activity filters and search
- Activity detail view

**API Endpoints**:
```
GET /api/activities - List activities (filtered by team/user/account)
POST /api/activities - Create activity
GET /api/activities/:id - Get activity details
PUT /api/activities/:id - Update activity
DELETE /api/activities/:id - Delete activity
GET /api/accounts/:id/activities - Get account activities
GET /api/deals/:id/activities - Get deal activities
GET /api/campaigns/:id/activities - Get campaign activities
GET /api/activities/feed - Get team activity feed
```

---

### Phase 3: Analytics & Visualization (Weeks 5-6)

#### 3.1 Dashboard Enhancements

**Metrics to Track**:
- Total pipeline value
- Deals by stage
- Win rate
- Average deal size
- Sales cycle length
- Activities per day/week
- Campaign performance
- Team performance
- Individual performance

**Visualization Libraries**:
- **Chart.js** - Simple, lightweight charts
- **Recharts** - React-specific charts
- **D3.js** - Advanced custom visualizations
- **Victory** - React Native compatible

**Recommended**: Recharts (good balance of features and ease of use)

#### 3.2 Chart Types & Use Cases

**1. Pipeline Funnel Chart**
- Shows deals moving through stages
- Conversion rates between stages
- Identifies bottlenecks

**2. Revenue Trend Line Chart**
- Monthly/quarterly revenue trends
- Forecast vs actual
- Team comparisons

**3. Activity Heatmap**
- Activity volume by day/time
- Team activity patterns
- Individual productivity

**4. Campaign Performance Bar Chart**
- Compare multiple campaigns
- ROI by campaign
- Activities per campaign

**5. Team Leaderboard**
- Top performers by revenue
- Most activities logged
- Highest win rate

**6. Deal Stage Distribution (Pie/Donut)**
- Current pipeline distribution
- Stage health indicators

**7. Activity Type Breakdown**
- Most common activities
- Activity effectiveness

#### 3.3 Analytics API Endpoints

```
GET /api/analytics/pipeline - Pipeline metrics
GET /api/analytics/revenue - Revenue trends
GET /api/analytics/activities - Activity analytics
GET /api/analytics/campaigns - Campaign performance
GET /api/analytics/team - Team performance
GET /api/analytics/leaderboard - User rankings
GET /api/analytics/conversion - Conversion rates
GET /api/analytics/forecast - Revenue forecast
```

**Query Parameters**:
- `start_date` - Filter start date
- `end_date` - Filter end date
- `team_id` - Filter by team
- `user_id` - Filter by user
- `campaign_id` - Filter by campaign
- `period` - Grouping (day, week, month, quarter)

#### 3.4 Dashboard UI Components

**Main Dashboard**:
```
┌─────────────────────────────────────────────────────┐
│  Team Selector  │  Date Range Picker  │  Export     │
├─────────────────────────────────────────────────────┤
│  KPI Cards (Revenue, Deals, Win Rate, Activities)   │
├──────────────────────┬──────────────────────────────┤
│  Pipeline Funnel     │  Revenue Trend               │
├──────────────────────┼──────────────────────────────┤
│  Activity Heatmap    │  Campaign Performance        │
├──────────────────────┴──────────────────────────────┤
│  Team Leaderboard                                    │
└─────────────────────────────────────────────────────┘
```

**Campaign Dashboard**:
- Campaign-specific metrics
- Deal progress
- Activity breakdown
- ROI calculation

**Account Dashboard**:
- Account activity timeline
- Deal history
- Engagement score
- Next actions

---

### Phase 4: Production Deployment (Week 7)

#### 4.1 Hosting Options

**Option A: DigitalOcean (Recommended for Start)**
- **Cost**: ~$20-40/month
- **Pros**: Simple, affordable, good for small teams
- **Setup**: Droplet + Managed Database + Spaces (storage)

**Option B: AWS**
- **Cost**: ~$50-100/month
- **Pros**: Scalable, enterprise-ready, many services
- **Setup**: EC2 + RDS + S3 + CloudFront

**Option C: Heroku**
- **Cost**: ~$25-50/month
- **Pros**: Easiest deployment, zero DevOps
- **Setup**: Heroku Postgres + Heroku Dynos

**Option D: Vercel (Frontend) + Railway (Backend)**
- **Cost**: ~$20-30/month
- **Pros**: Modern, fast, great DX
- **Setup**: Vercel for React, Railway for Node.js + DB

**Recommendation**: Start with **DigitalOcean** or **Railway** for simplicity and cost-effectiveness.

#### 4.2 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│  Domain: sales.yourcompany.com                  │
│  SSL Certificate (Let's Encrypt)                │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Load Balancer / Reverse Proxy (Nginx)         │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  Frontend        │      │  Backend API     │
│  (React/Vite)    │      │  (Express.js)    │
│  Port: 80/443    │      │  Port: 3001      │
└──────────────────┘      └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  PostgreSQL DB   │
                          │  (Managed)       │
                          └──────────────────┘
```

#### 4.3 Deployment Steps

**1. Prepare Application**:
```bash
# Build frontend
cd client
npm run build

# Test production build locally
npm run preview

# Prepare backend
cd server
# Set NODE_ENV=production
# Update database connection strings
```

**2. Set Up Database**:
- Create managed PostgreSQL instance
- Run migrations
- Seed initial data (admin user, default team)

**3. Deploy Backend**:
```bash
# Using Railway (example)
railway login
railway init
railway add postgresql
railway up
```

**4. Deploy Frontend**:
```bash
# Using Vercel (example)
vercel login
vercel --prod
```

**5. Configure Environment Variables**:
```env
# Production .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://sales.yourcompany.com
BACKEND_URL=https://api.sales.yourcompany.com

# Salesforce
SF_CLIENT_ID=prod-client-id
SF_CLIENT_SECRET=prod-client-secret
SF_REDIRECT_URI=https://api.sales.yourcompany.com/api/salesforce/callback

# Microsoft
MS_CLIENT_ID=prod-client-id
MS_CLIENT_SECRET=prod-client-secret
MS_REDIRECT_URI=https://api.sales.yourcompany.com/api/calendar/callback
```

**6. Set Up Domain & SSL**:
- Point domain to server IP
- Configure SSL certificate (Let's Encrypt)
- Set up HTTPS redirect

**7. Configure Monitoring**:
- Set up error tracking (Sentry)
- Configure uptime monitoring (UptimeRobot)
- Set up log aggregation (Papertrail)

#### 4.4 Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] CSRF tokens implemented
- [ ] Secure password requirements
- [ ] Session timeout configured
- [ ] API authentication required
- [ ] File upload restrictions
- [ ] Regular security updates

---

### Phase 5: Advanced Features (Weeks 8+)

#### 5.1 Real-Time Collaboration

**Features**:
- Live activity feed updates
- Real-time deal stage changes
- Collaborative editing indicators
- Team member presence
- In-app notifications

**Technology**:
- **Socket.io** - WebSocket library
- **Redis** - Pub/sub for scaling

**Implementation**:
```javascript
// Server
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('join-team', (teamId) => {
    socket.join(`team-${teamId}`);
  });
  
  socket.on('activity-created', (activity) => {
    io.to(`team-${activity.team_id}`).emit('new-activity', activity);
  });
});

// Client
import io from 'socket.io-client';
const socket = io('http://localhost:3001');

socket.emit('join-team', currentTeam.id);
socket.on('new-activity', (activity) => {
  // Update UI
});
```

#### 5.2 Email Integration

**Features**:
- Send emails from the platform
- Track email opens
- Email templates
- Bulk email campaigns
- Email sync (Gmail/Outlook)

**Technology**:
- **SendGrid** or **AWS SES** - Email delivery
- **Nylas** or **Microsoft Graph** - Email sync

#### 5.3 Mobile App (Optional)

**Options**:
- **React Native** - Cross-platform mobile app
- **Progressive Web App (PWA)** - Web-based mobile experience

**Features**:
- Mobile-optimized UI
- Offline support
- Push notifications
- Quick activity logging
- Deal updates on the go

#### 5.4 AI/ML Features (Future)

**Potential Features**:
- Lead scoring
- Deal probability prediction
- Next best action recommendations
- Automated activity suggestions
- Sentiment analysis on notes
- Churn prediction

---

## Implementation Timeline

### Week 1-2: Foundation
- Set up PostgreSQL database
- Implement authentication system
- Create user and team models
- Build basic admin panel

### Week 3-4: Core Features
- Team management UI
- Campaign module
- Activity tracking system
- Enhanced CRM with team features

### Week 5-6: Analytics
- Build analytics API
- Implement charts and visualizations
- Create dashboard components
- Add export functionality

### Week 7: Deployment
- Set up production infrastructure
- Deploy to cloud
- Configure domain and SSL
- Test and optimize

### Week 8+: Polish & Advanced Features
- Real-time updates
- Email integration
- Mobile optimization
- Performance tuning

---

## Cost Estimates

### Development Costs
- **DIY (Your Time)**: 8-10 weeks full-time
- **Freelancer**: $10,000 - $20,000
- **Agency**: $30,000 - $50,000

### Monthly Operating Costs
- **Hosting**: $20-50/month (DigitalOcean/Railway)
- **Database**: Included or $15/month
- **Email Service**: $0-20/month (SendGrid free tier)
- **Monitoring**: $0-10/month (free tiers available)
- **Domain**: $12/year
- **SSL**: Free (Let's Encrypt)

**Total**: ~$30-80/month for small team (5-10 users)

### Scaling Costs (50+ users)
- **Hosting**: $100-200/month
- **Database**: $50-100/month
- **CDN**: $20-50/month
- **Email**: $50-100/month

**Total**: ~$220-450/month

---

## Technology Stack Summary

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize or Prisma
- **Authentication**: JWT + Passport
- **Real-time**: Socket.io
- **Email**: SendGrid
- **File Storage**: AWS S3 or DigitalOcean Spaces

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router 6
- **State Management**: React Context or Zustand
- **UI Library**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form
- **HTTP Client**: Axios

### DevOps
- **Hosting**: DigitalOcean, Railway, or AWS
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **Logging**: Winston + Papertrail
- **Backups**: Automated daily backups

---

## Next Steps

1. **Review this plan** with your team
2. **Prioritize features** based on immediate needs
3. **Choose deployment platform** (recommend Railway or DigitalOcean)
4. **Set up development environment** with PostgreSQL
5. **Start with Phase 1** (authentication and database)

Would you like me to start implementing any specific phase? I recommend starting with:
1. Database migration (JSON → PostgreSQL)
2. Authentication system
3. Team management

This will give you a solid foundation for the collaborative features.