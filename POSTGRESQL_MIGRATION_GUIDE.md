# PostgreSQL Migration Guide - Sales UI

## 🎯 Overview

This guide will help you migrate your Sales UI application from JSON file storage to PostgreSQL database on Render.com.

**Benefits:**
- ✅ Persistent data storage
- ✅ Better performance
- ✅ Concurrent access support
- ✅ No file system issues
- ✅ Free on Render (included in your setup)

**Time Required:** 15-20 minutes

---

## 📋 Prerequisites

- ✅ Application deployed on Render
- ✅ PostgreSQL database created on Render
- ✅ Backend service running

---

## 🚀 Migration Steps

### Step 1: Create PostgreSQL Database (If Not Done)

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click "New +" → "PostgreSQL"**
3. **Configure:**
   - **Name:** `sales-ui-db`
   - **Database:** `sales_ui`
   - **Region:** Oregon (or closest to you)
   - **Plan:** Free
4. **Click "Create Database"**
5. **Wait 2-3 minutes** for provisioning
6. **Save the Internal Database URL** (you'll need it)

### Step 2: Run Database Schema

1. **In Render Dashboard, go to your PostgreSQL database**
2. **Click "Connect" → "External Connection"**
3. **Copy the PSQL Command** (looks like):
   ```
   PGPASSWORD=xxx psql -h dpg-SW0UifNvGAFt82hGpVdUFWMOjPmboKvx psql -h dpg-xxx.oregon-postgres.render.com -U sales_ui_db_user sales_ui_db.oregon-postgres.render.com -U sales_ui_db_user sales_ui_db
   ```

4. **Open your terminal and run the PSQL command**

5. **Once connected, copy and paste the entire schema:**
   - Open `server/migrations/001_initial_schema.sql`
   - Copy all the content
   - Paste into the psql terminal
   - Press Enter

6. **Verify tables were created:**
   ```sql
   \dt
   ```
   You should see all tables listed.

7. **Exit psql:**
   ```sql
   \q
   ```

### Step 3: Update Backend Environment Variables

1. **Go to Render Dashboard → Your Backend Service (sales-ui-api)**
2. **Click "Environment" in left menu**
3. **Add/Update these variables:**

   ```
   DATABASE_URL=[Your PostgreSQL Internal Database URL]
   ```

   To get the Internal Database URL:
   - Go to your PostgreSQL database in Render
   - Copy the "Internal Database URL"
   - It looks like: `postgresql://user:pass@dpg-xxx-a.oregon-postgres.render.internal:5432/sales_ui_db`

4. **Click "Save Changes"**
5. **Backend will automatically redeploy** (wait 2-3 minutes)

### Step 4: Update Your Code (Hybrid Approach)

Your current code uses `lowdb` (JSON files). We'll update it to support **both** JSON and PostgreSQL, with PostgreSQL taking priority when available.

**Update `server/db.js`:**

The current code already supports this! When `DATABASE_URL` is set, it will use PostgreSQL. When not set, it falls back to JSON files.

No code changes needed - just set the `DATABASE_URL` environment variable!

### Step 5: Verify Migration

1. **Check Backend Logs:**
   - Render Dashboard → sales-ui-api → Logs
   - Look for successful startup messages
   - No database connection errors

2. **Test Your Application:**
   - Open your frontend: `https://your-frontend.onrender.com`
   - Try to **create a new account**
   - Try to **create a new deal**
   - Try to **create an objective log**

3. **Verify Data Persistence:**
   - Create some test data
   - Refresh the page
   - Data should still be there!

4. **Check Database:**
   ```bash
   # Connect to your database
   PGPASSWORD=xxx psql -h dpg-xxx.oregon-postgres.render.com -U sales_ui_db_user sales_ui_db
   
   # Check accounts
   SELECT * FROM accounts;
   
   # Check deals
   SELECT * FROM deals;
   
   # Exit
   \q
   ```

---

## 🔧 Troubleshooting

### Issue: "relation does not exist"

**Problem:** Tables weren't created properly.

**Solution:**
1. Reconnect to database via psql
2. Run the schema SQL again
3. Check for any error messages

### Issue: "connection refused" or "timeout"

**Problem:** Wrong database URL or network issue.

**Solution:**
1. Verify you're using the **Internal Database URL** (not External)
2. Check database is running in Render Dashboard
3. Restart backend service

### Issue: Backend won't start after adding DATABASE_URL

**Problem:** Database connection error.

**Solution:**
1. Check backend logs for specific error
2. Verify DATABASE_URL is correct
3. Ensure database is running
4. Try removing and re-adding DATABASE_URL

### Issue: Data not persisting

**Problem:** Still using JSON files instead of PostgreSQL.

**Solution:**
1. Verify DATABASE_URL is set in backend environment
2. Check backend logs for "Connected to PostgreSQL" message
3. Restart backend service

---

## 📊 Verification Checklist

- [ ] PostgreSQL database created on Render
- [ ] Database schema executed successfully
- [ ] DATABASE_URL added to backend environment
- [ ] Backend redeployed and running
- [ ] Can create accounts
- [ ] Can create deals
- [ ] Can create objectives
- [ ] Data persists after page refresh
- [ ] No errors in backend logs
- [ ] No errors in browser console

---

## 🎉 Success!

Once all checks pass, your application is successfully using PostgreSQL!

### What Changed:
- ✅ Data now stored in PostgreSQL database
- ✅ No more file system issues
- ✅ Better performance and reliability
- ✅ Data persists across deployments

### What Stayed the Same:
- ✅ Same API endpoints
- ✅ Same frontend code
- ✅ Same user experience
- ✅ No cost increase (PostgreSQL free tier)

---

## 🔄 Rollback (If Needed)

If something goes wrong and you need to go back to JSON files:

1. **Remove DATABASE_URL** from backend environment
2. **Add Persistent Disk** to backend ($1/month):
   - Settings → Disk → Add Disk
   - Mount Path: `/opt/render/project/src/server/data`
   - Size: 1 GB
3. **Redeploy backend**

---

## 📝 Next Steps

1. **Test thoroughly** - Create, read, update, delete operations
2. **Monitor logs** - Watch for any errors
3. **Backup strategy** - Render provides automatic backups on paid plans
4. **Consider upgrading** - PostgreSQL Starter plan ($7/month) for production

---

## 💡 Tips

- **Free PostgreSQL** expires after 90 days - upgrade to paid plan before then
- **Automatic backups** available on paid PostgreSQL plans
- **Connection pooling** - Consider adding `pg-pool` for better performance
- **Migrations** - Keep track of schema changes in `server/migrations/`

---

## 🆘 Need Help?

1. Check backend logs first (most informative)
2. Verify DATABASE_URL is correct
3. Test database connection with psql
4. Check this guide's troubleshooting section

---

**Your application is now production-ready with PostgreSQL!** 🎉