# Deploy Sales UI to Render.com - Complete Guide

## 🎯 Overview

This guide will help you deploy your Sales UI application to Render.com with:
- ✅ Free tier available (perfect for testing)
- ✅ Automatic HTTPS
- ✅ Continuous deployment from Git
- ✅ PostgreSQL database included
- ✅ Easy environment variable management
- ✅ No credit card required for free tier

**Estimated Time:** 30-45 minutes  
**Cost:** Free tier available, or $7/month for production

---

## 📋 Prerequisites

### 1. Create Accounts
- [ ] GitHub account (to host your code)
- [ ] Render.com account (sign up at https://render.com)

### 2. Prepare Your Code
- [ ] All bug fixes applied (from FIXES_APPLIED.md)
- [ ] Code pushed to GitHub repository

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Navigate to your project
cd /Users/oriolnuez/Desktop/UI_Sales

# Initialize git (if not already done)
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/
client/dist/

# Database files
server/data/*.json

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# SSH keys
*.pem
EOF

# Add all files
git add .

# Commit
git commit -m "Initial commit - Sales UI with bug fixes"

# Create GitHub repository (via GitHub website)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/sales-ui.git
git branch -M main
git push -u origin main
```

---

### Step 2: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "PostgreSQL"

2. **Configure Database**
   - **Name:** `sales-ui-db`
   - **Database:** `sales_ui`
   - **User:** `sales_admin` (auto-generated)
   - **Region:** Choose closest to your users
   - **Plan:** Free (or Starter $7/month for production)

3. **Create Database**
   - Click "Create Database"
   - Wait for provisioning (2-3 minutes)
   - **Save the connection details** (you'll need them)

4. **Note Your Database URL**
   - Format: `postgresql://user:password@host:port/database`
   - Example: `postgresql://sales_admin:abc123@dpg-xxx.oregon-postgres.render.com:5432/sales_ui`

---

### Step 3: Prepare Backend for Deployment

Create a `render.yaml` file in your project root:

```yaml
# render.yaml
services:
  # Backend API
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
      - key: DATABASE_URL
        fromDatabase:
          name: sales-ui-db
          property: connectionString
    healthCheckPath: /api/health

  # Frontend (Static Site)
  - type: web
    name: sales-ui-frontend
    env: static
    region: oregon
    plan: free
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/dist
    routes:
      - type: rewrite
        source: /api/*
        destination: https://sales-ui-api.onrender.com/api/*
      - type: rewrite
        source: /*
        destination: /index.html

databases:
  - name: sales-ui-db
    plan: free
    databaseName: sales_ui
    user: sales_admin
```

---

### Step 4: Update Backend Configuration

Update `server/index.js` to handle production:

```javascript
// At the top of server/index.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// ... rest of your code
```

---

### Step 5: Update Client Configuration

Update `client/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
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
})
```

Update `client/src/api/index.js`:

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

// ... rest of your API code
```

---

### Step 6: Create Environment Variables File Template

Create `server/.env.example`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database (will be auto-filled by Render)
DATABASE_URL=postgresql://user:password@host:port/database

# Frontend URL (update after deployment)
FRONTEND_URL=https://your-app.onrender.com

# Salesforce Integration (optional)
SF_CLIENT_ID=
SF_CLIENT_SECRET=
SF_LOGIN_URL=https://login.salesforce.com
SF_REDIRECT_URI=https://your-api.onrender.com/api/salesforce/callback

# Microsoft Graph Integration (optional)
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_TENANT_ID=common
MS_REDIRECT_URI=https://your-api.onrender.com/api/calendar/callback
```

---

### Step 7: Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. **Push render.yaml to GitHub**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Create New Blueprint on Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository with render.yaml
   - Click "Apply"
   - Render will automatically create all services

#### Option B: Manual Deployment

1. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - **Name:** `sales-ui-api`
   - **Root Directory:** `server`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Plan:** Free
   - Add environment variables (see Step 8)

2. **Deploy Frontend**
   - Click "New +" → "Static Site"
   - Connect GitHub repository
   - **Name:** `sales-ui-frontend`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** Free

---

### Step 8: Configure Environment Variables

In Render Dashboard → Your Backend Service → Environment:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=[Auto-filled from database connection]
FRONTEND_URL=https://sales-ui-frontend.onrender.com
```

---

### Step 9: Set Up Database Schema

Once backend is deployed:

1. **Access Render Shell**
   - Go to your backend service
   - Click "Shell" tab
   - Run database initialization:

```bash
# Connect to your database
psql $DATABASE_URL

# Create tables (if using PostgreSQL)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  sector VARCHAR(100),
  notes TEXT,
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add more tables as needed
\q
```

---

### Step 10: Configure Custom Domain (Optional)

1. **In Render Dashboard**
   - Go to your frontend service
   - Click "Settings" → "Custom Domain"
   - Add your domain (e.g., `sales.yourdomain.com`)

2. **Update DNS Records**
   - Add CNAME record pointing to Render URL
   - Wait for DNS propagation (5-30 minutes)

3. **Update Environment Variables**
   - Update `FRONTEND_URL` in backend service
   - Update any callback URLs for integrations

---

## 🔒 Security Checklist

- [ ] All environment variables set correctly
- [ ] Database password is strong and unique
- [ ] CORS configured for your domain only
- [ ] HTTPS enabled (automatic on Render)
- [ ] Sensitive files in .gitignore
- [ ] No API keys committed to Git

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# In Render Dashboard
# Go to service → Logs tab
# Real-time logs available
```

### Monitor Performance
- Render Dashboard shows:
  - CPU usage
  - Memory usage
  - Request count
  - Response times

### Set Up Alerts
- Go to service → Settings → Notifications
- Add email or Slack notifications
- Configure for:
  - Deploy failures
  - Service crashes
  - High resource usage

---

## 💰 Cost Breakdown

### Free Tier (Perfect for Testing)
- **Backend:** Free (spins down after 15 min inactivity)
- **Frontend:** Free (always on)
- **Database:** Free (90-day limit, then $7/month)
- **Total:** $0/month (first 90 days)

### Production Tier (Recommended)
- **Backend:** $7/month (always on, 512MB RAM)
- **Frontend:** Free (static site)
- **Database:** $7/month (1GB storage)
- **Total:** $14/month

### Enterprise Tier
- **Backend:** $25/month (2GB RAM)
- **Database:** $20/month (10GB storage)
- **Total:** $45/month

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs in Render Dashboard
# Common issues:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Port binding issues (use process.env.PORT)
```

### Frontend Shows 404
```bash
# Check build logs
# Verify dist folder was created
# Check staticPublishPath in render.yaml
```

### Database Connection Errors
```bash
# Verify DATABASE_URL is set
# Check database is running
# Test connection in Shell tab:
psql $DATABASE_URL -c "SELECT 1"
```

### CORS Errors
```bash
# Update CORS configuration in server/index.js
# Add your frontend URL to allowed origins
# Restart backend service
```

---

## 🚀 Post-Deployment Tasks

### 1. Test All Features
- [ ] User can access frontend
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] Integrations work (Salesforce, Calendar)

### 2. Set Up Monitoring
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up error tracking (Sentry)
- [ ] Enable Render notifications

### 3. Create Backups
```bash
# Set up automated database backups
# Render provides daily backups on paid plans
# Or use pg_dump manually:
pg_dump $DATABASE_URL > backup.sql
```

### 4. Document URLs
- Frontend URL: `https://sales-ui-frontend.onrender.com`
- Backend URL: `https://sales-ui-api.onrender.com`
- Database: `[connection string]`

---

## 📝 Next Steps

1. **Share with Team**
   - Send frontend URL to users
   - Create user accounts
   - Provide training/documentation

2. **Monitor Usage**
   - Check Render dashboard daily
   - Review logs for errors
   - Monitor database size

3. **Plan Upgrades**
   - Upgrade to paid tier when ready
   - Add custom domain
   - Enable advanced features

---

## 🆘 Support Resources

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Status Page:** https://status.render.com
- **Support:** support@render.com

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Environment variables configured
- [ ] Database schema initialized
- [ ] All features tested
- [ ] Monitoring set up
- [ ] Team notified
- [ ] Documentation updated

---

**Your application will be live at:**
- Frontend: `https://sales-ui-frontend.onrender.com`
- Backend API: `https://sales-ui-api.onrender.com`

**Deployment complete! 🎉**