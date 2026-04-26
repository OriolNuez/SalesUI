# Deploy Sales UI to TechZone RHEL 8 - Step by Step

## Prerequisites Checklist
- [x] RHEL 8 TechZone environment provisioned
- [ ] SSH access credentials received
- [ ] Public IP address noted
- [ ] Your local Sales UI code ready

## Step 1: Connect to Your Server

From your local machine:

```bash
# SSH into your TechZone server
ssh root@<your-techzone-ip>

# Or if you have a specific user:
ssh <username>@<your-techzone-ip>
```

**Note your IP address**: 158.175.163.228

## Step 2: Run the Automated Setup Script

Copy and paste this entire script into your RHEL server:

```bash
#!/bin/bash
# Sales UI TechZone Deployment Script for RHEL 8

set -e  # Exit on any error

echo "=========================================="
echo "Sales UI Deployment Script"
echo "=========================================="

# Update system
echo "Step 1: Updating system..."
sudo yum update -y

# Install Node.js 18.x
echo "Step 2: Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PostgreSQL
echo "Step 3: Installing PostgreSQL..."
sudo yum install -y postgresql-server postgresql-contrib

# Initialize PostgreSQL
echo "Step 4: Initializing PostgreSQL..."
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
echo "Step 5: Installing Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx

# Install Git
echo "Step 6: Installing Git..."
sudo yum install -y git

# Install PM2
echo "Step 7: Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "Step 8: Creating application directory..."
sudo mkdir -p /opt/sales-ui
sudo chown $USER:$USER /opt/sales-ui

echo "=========================================="
echo "✅ Prerequisites installed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload your Sales UI code to /opt/sales-ui"
echo "2. Run the database setup script"
echo "3. Configure and start the application"
echo ""
```

Save this as a file and run it:

```bash
# Create the script
cat > setup.sh << 'EOF'
[paste the script above]
EOF

# Make it executable
chmod +x setup.sh

# Run it
./setup.sh
```

## Step 3: Upload Your Application Code

From your **local machine** (not the server), run:

```bash
# Navigate to your Sales UI directory
cd /Users/oriolnuez/Desktop/UI_Sales

# Upload to TechZone server
scp -r * root@<your-techzone-ip>:/opt/sales-ui/

# This will upload:
# - server/ directory
# - client/ directory
# - All configuration files
```

**Alternative**: If you have the code in a Git repository:

```bash
# On the server
cd /opt/sales-ui
git clone <your-repo-url> .
```

## Step 4: Set Up PostgreSQL Database

On the server:

```bash
# Switch to postgres user and create database
sudo -u postgres psql << EOF
CREATE DATABASE sales_ui;
CREATE USER sales_admin WITH PASSWORD 'SalesUI2024!Secure';
GRANT ALL PRIVILEGES ON DATABASE sales_ui TO sales_admin;
\q
EOF

# Configure PostgreSQL authentication
sudo bash -c 'cat >> /var/lib/pgsql/data/pg_hba.conf << EOF
# Sales UI application
local   sales_ui   sales_admin   md5
host    sales_ui   sales_admin   127.0.0.1/32   md5
EOF'

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -U sales_admin -d sales_ui -h localhost -c "SELECT version();"
# Password: SalesUI2024!Secure
```

## Step 5: Install Application Dependencies

```bash
cd /opt/sales-ui

# Install server dependencies
cd server
npm install --production

# Install client dependencies and build
cd ../client
npm install
npm run build

# Verify build was created
ls -la dist/
```

## Step 6: Configure Environment Variables

```bash
cd /opt/sales-ui/server

# Get your server's public IP
SERVER_IP=$(curl -s ifconfig.me)
echo "Your server IP: $SERVER_IP"

# Create production .env file
cat > .env << EOF
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://sales_admin:SalesUI2024!Secure@localhost:5432/sales_ui

# JWT (change this to a random string!)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# URLs
FRONTEND_URL=http://$SERVER_IP
BACKEND_URL=http://$SERVER_IP:3001

# Salesforce (add your credentials if using)
SF_CLIENT_ID=
SF_CLIENT_SECRET=
SF_REDIRECT_URI=http://$SERVER_IP:3001/api/salesforce/callback

# Microsoft Graph (add your credentials if using)
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_TENANT_ID=common
MS_REDIRECT_URI=http://$SERVER_IP:3001/api/calendar/callback
EOF

# Secure the file
chmod 600 .env

# Show the generated JWT secret (save this!)
echo "Your JWT Secret (save this!):"
grep JWT_SECRET .env
```

## Step 7: Configure Nginx

```bash
# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

# Create Nginx configuration
sudo bash -c "cat > /etc/nginx/conf.d/sales-ui.conf << 'EOF'
server {
    listen 80;
    server_name $SERVER_IP;

    # Frontend (React app)
    root /opt/sales-ui/client/dist;
    index index.html;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
EOF"

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

## Step 8: Configure Firewall

```bash
# Open HTTP port
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# Verify firewall rules
sudo firewall-cmd --list-all
```

## Step 9: Start the Application

```bash
cd /opt/sales-ui/server

# Start with PM2
pm2 start index.js --name sales-ui-api

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs sales-ui-api --lines 50
```

## Step 10: Verify Deployment

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check if Nginx is serving frontend
curl http://localhost/

# Get your public IP
echo "Your application is available at: http://$(curl -s ifconfig.me)"
```

## Step 11: Access Your Application

Open your browser to:
```
http://<your-techzone-ip>
```

You should see the Sales UI login/dashboard page!

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
pm2 logs sales-ui-api

# Check if port 3001 is in use
sudo netstat -tlnp | grep 3001

# Restart the app
pm2 restart sales-ui-api
```

### Can't access from browser

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U sales_admin -d sales_ui -h localhost

# Check PostgreSQL logs
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log
```

### Firewall blocking access

```bash
# Check firewall status
sudo firewall-cmd --list-all

# Temporarily disable firewall (for testing only!)
sudo systemctl stop firewalld

# If that works, add proper rules:
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
sudo systemctl start firewalld
```

---

## Post-Deployment Tasks

### 1. Set Up Automated Backups

```bash
# Create backup script
cat > /opt/sales-ui/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/sales-ui/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='SalesUI2024!Secure' pg_dump -U sales_admin -h localhost sales_ui > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/sales-ui/server /opt/sales-ui/client

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/sales-ui/backup.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/sales-ui/backup.sh") | crontab -
```

### 2. Set Up Monitoring

```bash
# Install htop for system monitoring
sudo yum install -y htop

# Check system resources
htop

# Monitor application logs
pm2 logs sales-ui-api --lines 100

# Monitor Nginx access
sudo tail -f /var/log/nginx/access.log
```

### 3. Update Application (Future Updates)

```bash
cd /opt/sales-ui

# Pull latest code (if using Git)
git pull

# Or upload new files via SCP from local machine:
# scp -r * root@<ip>:/opt/sales-ui/

# Rebuild frontend
cd client
npm install
npm run build

# Restart backend
cd ../server
npm install
pm2 restart sales-ui-api

# Check status
pm2 status
```

---

## Quick Reference Commands

```bash
# Check application status
pm2 status
pm2 logs sales-ui-api

# Restart application
pm2 restart sales-ui-api

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check database
sudo systemctl status postgresql
psql -U sales_admin -d sales_ui -h localhost

# View logs
pm2 logs sales-ui-api --lines 100
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log

# System resources
htop
df -h
free -m
```

---

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated unique JWT secret
- [ ] Configured firewall rules
- [ ] Set up automated backups
- [ ] Restricted file permissions (chmod 600 .env)
- [ ] Disabled root SSH login (optional)
- [ ] Set up fail2ban (optional)
- [ ] Configured log rotation

---

## Next Steps

1. **Test the application** thoroughly
2. **Create user accounts** for your team
3. **Configure Salesforce/Calendar** integrations (optional)
4. **Set up SSL/HTTPS** (if needed for production)
5. **Share the URL** with your team
6. **Monitor performance** and logs

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs: `pm2 logs sales-ui-api`
3. Check system resources: `htop`
4. Verify all services are running

Your application should now be live at: **http://\<your-techzone-ip\>**

Enjoy your Sales UI platform! 🚀