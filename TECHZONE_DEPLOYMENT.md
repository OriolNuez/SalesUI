# Deploying Sales UI to IBM TechZone

## Overview

IBM TechZone (formerly IBM Cloud Pak Experiences) provides cloud environments for development, demos, and proof-of-concepts. You can absolutely run your Sales UI application on TechZone.

## TechZone Deployment Options

### Option 1: Virtual Server Instance (Recommended)
Deploy on a TechZone-provisioned virtual machine with full control.

### Option 2: Red Hat OpenShift on IBM Cloud
Deploy as containerized application on OpenShift (more advanced, but scalable).

### Option 3: IBM Cloud Foundry
Deploy as a Cloud Foundry application (simpler, but less flexible).

---

## Option 1: Virtual Server Deployment (Recommended for Start)

### Step 1: Request TechZone Environment

1. Go to [IBM TechZone](https://techzone.ibm.com)
2. Search for "Virtual Server" or "RHEL" environment
3. Request a reservation:
   - **Environment**: Red Hat Enterprise Linux 8 or Ubuntu 20.04
   - **Size**: Medium (2 vCPU, 8GB RAM minimum)
   - **Duration**: Extended (or as needed)
   - **Purpose**: Development/Demo

### Step 2: Access Your Environment

Once provisioned, you'll receive:
- Public IP address
- SSH credentials
- VNC access (optional)

```bash
# SSH into your server
ssh root@<your-techzone-ip>
```

### Step 3: Install Prerequisites

```bash
# Update system
sudo yum update -y  # RHEL
# or
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs  # RHEL
# or
sudo apt install -y nodejs  # Ubuntu

# Verify installation
node --version
npm --version

# Install PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib  # RHEL
# or
sudo apt install -y postgresql postgresql-contrib  # Ubuntu

# Initialize and start PostgreSQL
sudo postgresql-setup --initdb  # RHEL only
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx (reverse proxy)
sudo yum install -y nginx  # RHEL
# or
sudo apt install -y nginx  # Ubuntu

# Install Git
sudo yum install -y git  # RHEL
# or
sudo apt install -y git  # Ubuntu

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 4: Set Up PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE sales_ui;
CREATE USER sales_admin WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE sales_ui TO sales_admin;
\q

# Configure PostgreSQL to accept connections
sudo nano /var/lib/pgsql/data/pg_hba.conf  # RHEL
# or
sudo nano /etc/postgresql/*/main/pg_hba.conf  # Ubuntu

# Add this line:
# local   all   sales_admin   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 5: Deploy Application

```bash
# Create application directory
sudo mkdir -p /opt/sales-ui
sudo chown $USER:$USER /opt/sales-ui
cd /opt/sales-ui

# Clone or upload your code
# Option A: If using Git
git clone <your-repo-url> .

# Option B: Upload via SCP from your local machine
# From your local machine:
# scp -r /path/to/UI_Sales root@<techzone-ip>:/opt/sales-ui/

# Install server dependencies
cd server
npm install --production

# Install client dependencies and build
cd ../client
npm install
npm run build

# The build output will be in client/dist
```

### Step 6: Configure Environment Variables

```bash
cd /opt/sales-ui/server

# Create production .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://sales_admin:your-secure-password@localhost:5432/sales_ui

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_EXPIRES_IN=7d

# Frontend URL (will be your TechZone IP or domain)
FRONTEND_URL=http://<your-techzone-ip>
BACKEND_URL=http://<your-techzone-ip>:3001

# Salesforce (optional)
SF_CLIENT_ID=your-salesforce-client-id
SF_CLIENT_SECRET=your-salesforce-client-secret
SF_REDIRECT_URI=http://<your-techzone-ip>:3001/api/salesforce/callback

# Microsoft Graph (optional)
MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
MS_TENANT_ID=common
MS_REDIRECT_URI=http://<your-techzone-ip>:3001/api/calendar/callback
EOF

# Secure the .env file
chmod 600 .env
```

### Step 7: Set Up Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/conf.d/sales-ui.conf
```

Add this configuration:

```nginx
# Frontend (React app)
server {
    listen 80;
    server_name <your-techzone-ip>;

    root /opt/sales-ui/client/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support (for real-time features)
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 8: Start Application with PM2

```bash
cd /opt/sales-ui/server

# Start the application
pm2 start index.js --name sales-ui-api

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status
pm2 logs sales-ui-api
```

### Step 9: Configure Firewall

```bash
# Open HTTP port
sudo firewall-cmd --permanent --add-service=http  # RHEL
sudo firewall-cmd --reload

# or for Ubuntu
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

### Step 10: Access Your Application

Open browser to: `http://<your-techzone-ip>`

---

## Option 2: OpenShift Deployment (Advanced)

If you want a more production-ready, scalable deployment:

### Prerequisites
- Request OpenShift cluster from TechZone
- Install `oc` CLI tool
- Containerize your application

### Step 1: Create Dockerfiles

**Backend Dockerfile** (`server/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

**Frontend Dockerfile** (`client/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Deploy to OpenShift

```bash
# Login to OpenShift
oc login --token=<your-token> --server=<openshift-api-url>

# Create new project
oc new-project sales-ui

# Create PostgreSQL database
oc new-app postgresql-persistent \
  -p POSTGRESQL_USER=sales_admin \
  -p POSTGRESQL_PASSWORD=secure-password \
  -p POSTGRESQL_DATABASE=sales_ui

# Build and deploy backend
oc new-app https://github.com/your-repo/sales-ui \
  --context-dir=server \
  --name=sales-ui-api

# Build and deploy frontend
oc new-app https://github.com/your-repo/sales-ui \
  --context-dir=client \
  --name=sales-ui-frontend

# Expose services
oc expose svc/sales-ui-frontend
oc expose svc/sales-ui-api

# Get routes
oc get routes
```

---

## TechZone-Specific Considerations

### 1. Environment Lifecycle
- TechZone environments have expiration dates
- Request extensions before expiration
- Set up automated backups

### 2. Networking
- TechZone VMs get public IPs
- No need for complex networking setup
- Firewall rules may need adjustment

### 3. Storage
- Use persistent volumes for database
- Regular backups to IBM Cloud Object Storage

### 4. Security
- Change all default passwords
- Use strong JWT secrets
- Keep system updated
- Consider VPN access for production

### 5. Monitoring
- Set up basic monitoring with PM2
- Use TechZone's built-in monitoring tools
- Configure log rotation

---

## Database Migration Script

Create a migration script to move from JSON to PostgreSQL:

```bash
cd /opt/sales-ui/server

# Create migration script
cat > migrate-to-postgres.js << 'EOF'
const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  await client.connect();

  // Read JSON files
  const deals = JSON.parse(fs.readFileSync('./data/deals.json', 'utf8'));
  const accounts = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));
  
  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      industry VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS deals (
      id UUID PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      value DECIMAL(12,2),
      stage VARCHAR(50),
      account_id UUID REFERENCES accounts(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Insert data
  for (const account of accounts) {
    await client.query(
      'INSERT INTO accounts (id, name, industry) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [account.id, account.name, account.industry]
    );
  }

  for (const deal of deals) {
    await client.query(
      'INSERT INTO deals (id, title, value, stage, account_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      [deal.id, deal.title, deal.value, deal.stage, deal.accountId]
    );
  }

  console.log('Migration completed!');
  await client.end();
}

migrate().catch(console.error);
EOF

# Run migration
node migrate-to-postgres.js
```

---

## Backup Strategy

```bash
# Create backup script
cat > /opt/sales-ui/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/sales-ui/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U sales_admin sales_ui > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/sales-ui/server /opt/sales-ui/client

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/sales-ui/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/sales-ui/backup.sh
```

---

## Monitoring & Maintenance

```bash
# Check application status
pm2 status
pm2 logs sales-ui-api --lines 100

# Check Nginx status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log

# Check PostgreSQL status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Monitor system resources
htop
df -h
free -m

# Update application
cd /opt/sales-ui
git pull
cd server && npm install
cd ../client && npm install && npm run build
pm2 restart sales-ui-api
```

---

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs sales-ui-api

# Check environment variables
cat /opt/sales-ui/server/.env

# Test database connection
psql -U sales_admin -d sales_ui -h localhost
```

### Can't access from browser
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if port 80 is open
sudo netstat -tlnp | grep :80

# Check firewall
sudo firewall-cmd --list-all
```

### Database connection issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Test connection
psql -U sales_admin -d sales_ui -h localhost
```

---

## Cost Considerations

### TechZone Costs
- **Free** for IBM employees and partners
- Environment duration limits (typically 2 weeks, extendable)
- No infrastructure costs during reservation period

### Advantages
- No credit card required
- IBM Cloud infrastructure
- Pre-configured environments
- Good for development and demos

### Limitations
- Not for production use
- Temporary environments
- May need to request extensions
- Limited to IBM ecosystem

---

## Next Steps

1. **Request TechZone Environment**
   - Go to techzone.ibm.com
   - Search for "Virtual Server" or "RHEL"
   - Submit reservation request

2. **Prepare Application**
   - Ensure all dependencies are in package.json
   - Test locally with PostgreSQL
   - Create migration scripts

3. **Deploy**
   - Follow steps above
   - Test thoroughly
   - Document any custom configurations

4. **Share with Team**
   - Provide access URL
   - Create user accounts
   - Train team on features

Would you like me to help you with any specific step of the TechZone deployment?