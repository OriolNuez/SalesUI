-- Sales UI Database Schema for PostgreSQL
-- Run this in your Render PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  sector VARCHAR(100),
  notes TEXT,
  actions JSONB DEFAULT '[]'::jsonb,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
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
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Objectives table
CREATE TABLE IF NOT EXISTS objectives (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target INTEGER,
  period VARCHAR(20),
  unit VARCHAR(100),
  color VARCHAR(20)
);

-- Objective logs table
CREATE TABLE IF NOT EXISTS objective_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objective_id VARCHAR(50) REFERENCES objectives(id) ON DELETE CASCADE,
  value INTEGER DEFAULT 1,
  note TEXT,
  date DATE NOT NULL,
  source VARCHAR(50),
  activity_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(100) PRIMARY KEY,
  activity_type VARCHAR(50) NOT NULL,
  contact_name VARCHAR(255),
  contact_position VARCHAR(255),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
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

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  date TIMESTAMP,
  location VARCHAR(500),
  account_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
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

-- Weekly tasks table
CREATE TABLE IF NOT EXISTS weekly_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  priority VARCHAR(20),
  due_date DATE,
  done BOOLEAN DEFAULT FALSE,
  week_start DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  tasks JSONB DEFAULT '[]'::jsonb,
  completed_log JSONB DEFAULT '[]'::jsonb,
  diary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cadence templates table
CREATE TABLE IF NOT EXISTS cadence_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cadence enrollments table
CREATE TABLE IF NOT EXISTS cadence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES cadence_templates(id) ON DELETE CASCADE,
  template_name VARCHAR(255),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  account_name VARCHAR(255),
  contact_id VARCHAR(100),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_linkedin VARCHAR(500),
  status VARCHAR(50),
  current_step INTEGER DEFAULT 0,
  step_executions JSONB DEFAULT '[]'::jsonb,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  paused_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  notes TEXT
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,
  variables TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(10) DEFAULT 'USD',
  currency_symbol VARCHAR(5) DEFAULT '$',
  stages TEXT[],
  user_name VARCHAR(255),
  week_starts_on VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_account_id ON deals(account_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);

CREATE INDEX IF NOT EXISTS idx_activities_account_id ON activities(account_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_objective_logs_objective_id ON objective_logs(objective_id);
CREATE INDEX IF NOT EXISTS idx_objective_logs_date ON objective_logs(date);

CREATE INDEX IF NOT EXISTS idx_invitations_event_id ON invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_account_id ON invitations(account_id);

CREATE INDEX IF NOT EXISTS idx_weekly_tasks_week_start ON weekly_tasks(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_done ON weekly_tasks(done);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date);

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_template_id ON cadence_enrollments(template_id);
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_status ON cadence_enrollments(status);

-- Insert default objectives
INSERT INTO objectives (id, name, description, target, period, unit, color) VALUES
('obj-1', 'Business Development', 'Proactive effort to uncover and grow opportunities. Targeted campaigns, weekly sprints, cross-sell/upsell, partner collaboration.', 3, 'weekly', 'opportunities uncovered', '#3B82F6'),
('obj-2', 'Lead Passing', 'Team-working with Territory Sales Specialists. Grow clients for install base expansion above focus.', 3, 'monthly', 'opportunities grown from whitespace', '#8B5CF6'),
('obj-3', 'Client & BP Engagement', 'Minimum 2 client meetings per week. Proactive approach driving partner engagement.', 2, 'weekly', 'meetings', '#10B981'),
('obj-4', 'WIP Business Plan', 'Tsunami and strategic weekly business approach. Product focus plans.', 1, 'weekly', 'strategies entered', '#F59E0B'),
('obj-5', 'Learning Enablement', 'Commitment to skill growth. Your Learning, proactive enablement, technical skills.', 8, 'weekly', 'learning hours', '#EF4444'),
('obj-6', 'Behavioural Objectives', 'Team player, wider team collaboration, wider ecosystem collaboration.', 2, 'weekly', 'team collab events', '#EC4899'),
('obj-7', 'Leads Called On', 'Proactive outreach to leads.', 10, 'weekly', 'calls', '#06B6D4'),
('obj-8', 'Opportunities Closed', 'Deals moved to Won or Lost stage.', 2, 'monthly', 'opportunities closed', '#84CC16')
ON CONFLICT (id) DO NOTHING;

-- Insert default settings
INSERT INTO settings (currency, currency_symbol, stages, user_name, week_starts_on) 
VALUES ('USD', '$', ARRAY['Engage', 'Qualify', 'Design', 'Propose', 'Negotiate', 'Closing', 'Won', 'Lost'], 'Seller', 'monday')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Tables created: accounts, deals, objectives, objective_logs, activities, campaigns, events, invitations, weekly_tasks, daily_tasks, cadence_templates, cadence_enrollments, email_templates, settings';
  RAISE NOTICE 'Default data inserted: 8 objectives, default settings';
END $$;

-- Made with Bob
