# Production Implementation Plan

## 📋 Overview

This document outlines all the files and changes needed to deploy the Sales UI application to Render.com in production.

---

## 🎯 Implementation Checklist

### Phase 1: Configuration Files (Code Mode Required)
- [ ] Create `render.yaml` - Render deployment configuration
- [ ] Create `.gitignore` - Exclude sensitive files
- [ ] Create `server/.env.example` - Environment template
- [ ] Update `server/index.js` - Production CORS and settings
- [ ] Update `client/vite.config.js` - Production build config
- [ ] Update `client/src/api/index.js` - Dynamic API URL

### Phase 2: Database Migration (Code Mode Required)
- [ ] Create `server/migrations/init.sql` - PostgreSQL schema
- [ ] Create `server/scripts/migrate-to-postgres.js` - Data migration script
- [ ] Update `server/db.js` - Support PostgreSQL

### Phase 3: Git Repository Setup
- [ ] Initialize Git repository
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Verify all files are committed

### Phase 4: Render.com Setup
- [ ] Create Render account
- [ ] Create PostgreSQL database
- [ ] Deploy backend service
- [ ] Deploy frontend service
- [ ] Configure environment variables
- [ ] Run database migrations

### Phase 5: Testing & Verification
- [ ] Test backend API endpoints
- [ ] Test frontend functionality
- [ ] Verify database operations
- [ ] Test all CRUD operations
- [ ] Check error handling

---

## 📁 Files to Create

### 1. render.yaml
```yaml
services:
  - type: web
    name: sales-ui-api
    env: node
    region: oregon
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
    healthCheckPath: /api/health

  - type: web
    name: sales-ui-frontend
    env: static
    region: oregon
    plan: free
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/dist
```

### 2. .gitignore
```
node_modules/
.env
.env.local
.env.production
dist/
build/
client/dist/
server/data/*.json
*.log
.DS_Store
*.pem
.vscode/
.idea/
```

### 3. server/.env.example
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=https://your-app.onrender.com
SF_CLIENT_ID=
SF_CLIENT_SECRET=
SF_LOGIN_URL=https://login.salesforce.com
SF_REDIRECT_URI=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_TENANT_ID=common
MS_REDIRECT_URI=
```

### 4. server/migrations/init.sql
```sql
-- Create tables for PostgreSQL
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  sector VARCHAR(100),
  notes TEXT,
  actions JSONB DEFAULT '[]',
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  account_id UUID REFERENCES accounts(id),
  account_name VARCHAR(255),
  contact VARCHAR(255),
  value DECIMAL(12,2),
  stage VARCHAR(50),
  predicted_close_date DATE,
  notes TEXT,
  next_meeting TIMESTAMP,
  products TEXT[],
  next_steps TEXT,
  business_partner VARCHAR(255),
  isc_link VARCHAR(500),
  history JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS objectives (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target INTEGER,
  period VARCHAR(20),
  unit VARCHAR(100),
  color VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS objective_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id VARCHAR(50) REFERENCES objectives(id),
  value INTEGER DEFAULT 1,
  note TEXT,
  date DATE NOT NULL,
  source VARCHAR(50),
  activity_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(100) PRIMARY KEY,
  activity_type VARCHAR(50) NOT NULL,
  contact_name VARCHAR(255),
  contact_position VARCHAR(255),
  account_id UUID REFERENCES accounts(id),
  account_name VARCHAR(255),
  linkedin_url VARCHAR(500),
  phone_number VARCHAR(50),
  email VARCHAR(255),
  activity_date TIMESTAMP,
  outcome VARCHAR(100),
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  call_duration INTEGER,
  call_type VARCHAR(50),
  call_purpose TEXT,
  rejection_reason TEXT,
  next_meeting_date DATE,
  email_subject VARCHAR(500),
  email_type VARCHAR(50),
  email_sent BOOLEAN DEFAULT FALSE,
  email_opened BOOLEAN DEFAULT FALSE,
  email_replied BOOLEAN DEFAULT FALSE,
  email_bounced BOOLEAN DEFAULT FALSE,
  linkedin_message_type VARCHAR(50),
  linkedin_connection_status VARCHAR(50),
  linkedin_engagement_type VARCHAR(50),
  linked_opportunity_id VARCHAR(100),
  linked_campaign_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  target_revenue DECIMAL(12,2),
  account_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  date TIMESTAMP,
  location VARCHAR(500),
  account_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id),
  contact_name VARCHAR(255),
  contact_position VARCHAR(255),
  platform VARCHAR(50),
  status VARCHAR(50),
  sent_date DATE,
  response_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  priority VARCHAR(20),
  due_date DATE,
  done BOOLEAN DEFAULT FALSE,
  week_start DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  tasks JSONB DEFAULT '[]',
  completed_log JSONB DEFAULT '[]',
  diary JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(10) DEFAULT 'USD',
  currency_symbol VARCHAR(5) DEFAULT '$',
  stages TEXT[],
  user_name VARCHAR(255),
  week_starts_on VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default objectives
INSERT INTO objectives (id, name, description, target, period, unit, color) VALUES
('obj-1', 'Business Development', 'Proactive effort to uncover and grow opportunities', 3, 'weekly', 'opportunities uncovered', '#3B82F6'),
('obj-2', 'Lead Passing', 'Team-working with Territory Sales Specialists', 3, 'monthly', 'opportunities grown from whitespace', '#8B5CF6'),
('obj-3', 'Client & BP Engagement', 'Minimum 2 client meetings per week', 2, 'weekly', 'meetings', '#10B981'),
('obj-4', 'WIP Business Plan', 'Tsunami and strategic weekly business approach', 1, 'weekly', 'strategies entered', '#F59E0B'),
('obj-5', 'Learning Enablement', 'Commitment to skill growth', 8, 'weekly', 'learning hours', '#EF4444'),
('obj-6', 'Behavioural Objectives', 'Team player, wider team collaboration', 2, 'weekly', 'team collab events', '#EC4899'),
('obj-7', 'Leads Called On', 'Proactive outreach to leads', 10, 'weekly', 'calls', '#06B6D4'),
('obj-8', 'Opportunities Closed', 'Deals moved to Won or Lost stage', 2, 'monthly', 'opportunities closed', '#84CC16')
ON CONFLICT (id) DO NOTHING;

-- Insert default settings
INSERT INTO settings (currency, currency_symbol, stages, user_name, week_starts_on) VALUES
('USD', '$', ARRAY['Engage', 'Qualify', 'Design', 'Propose', 'Negotiate', 'Closing', 'Won', 'Lost'], 'Seller', 'monday');

-- Create indexes for better performance
CREATE INDEX idx_deals_account_id ON deals(account_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_activities_account_id ON activities(account_id);
CREATE INDEX idx_activities_date ON activities(activity_date);
CREATE INDEX idx_objective_logs_objective_id ON objective_logs(objective_id);
CREATE INDEX idx_objective_logs_date ON objective_logs(date);
CREATE INDEX idx_invitations_event_id ON invitations(event_id);
CREATE INDEX idx_weekly_tasks_week_start ON weekly_tasks(week_start);
CREATE INDEX idx_daily_tasks_date ON daily_tasks(date);
```

---

## 🔧 Code Changes Required

### Update server/index.js
Add production CORS configuration:
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### Update client/vite.config.js
Add production build optimization:
```javascript
build: {
  outDir: 'dist',
  sourcemap: false,
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        charts: ['recharts']
      }
    }
  }
}
```

### Update client/src/api/index.js
Use environment variable for API URL:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})
```

---

## 🚀 Deployment Steps

### 1. Prepare Repository
```bash
cd /Users/oriolnuez/Desktop/UI_Sales
git init
git add .
git commit -m "Initial commit with bug fixes and production config"
```

### 2. Create GitHub Repository
- Go to github.com
- Create new repository: `sales-ui`
- Push code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/sales-ui.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Render
- Sign up at render.com
- Create PostgreSQL database
- Create Web Service for backend
- Create Static Site for frontend
- Configure environment variables
- Deploy!

---

## ✅ Success Criteria

- [ ] Application accessible via HTTPS URL
- [ ] All API endpoints working
- [ ] Database operations successful
- [ ] No console errors
- [ ] All features functional
- [ ] Performance acceptable (<3s load time)

---

## 📞 Next Actions

1. **Switch to Code Mode** to create configuration files
2. **Implement database migration** support
3. **Test locally** with PostgreSQL
4. **Deploy to Render** following the guide
5. **Verify production** deployment

---

**Ready to proceed with implementation!**