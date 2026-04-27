# Quick PostgreSQL Setup - 5 Minutes

## 🎯 Goal
Get your Sales UI working with PostgreSQL database on Render.

## ⚡ Quick Steps

### 1. Connect to Your Database (2 minutes)

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click on your PostgreSQL database** (sales-ui-db)
3. **Click "Connect" button** (top right)
4. **Copy the PSQL Command** from "External Connection" tab
5. **Open Terminal** and paste the command, press Enter

### 2. Create Tables (1 minute)

Once connected to psql, run this command:

```sql
-- Copy and paste the entire content of server/migrations/001_initial_schema.sql
-- Or run this shorter version:

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Just run the schema file content here
-- (Open server/migrations/001_initial_schema.sql and copy all)
```

**Verify tables created:**
```sql
\dt
```

You should see: accounts, deals, objectives, activities, campaigns, events, etc.

**Exit:**
```sql
\q
```

### 3. Update Backend Environment (2 minutes)

1. **Render Dashboard → Your Backend Service** (sales-ui-api)
2. **Click "Environment"** in left menu
3. **Find or Add `DATABASE_URL`:**
   - Go back to your PostgreSQL database
   - Copy the **"Internal Database URL"**
   - Paste it as the value for `DATABASE_URL`
4. **Click "Save Changes"**
5. **Wait 2-3 minutes** for automatic redeploy

### 4. Test It! (30 seconds)

1. **Open your app:** `https://your-frontend.onrender.com`
2. **Try to create an account**
3. **Success!** ✅

---

## 🔍 Troubleshooting

### Can't connect to database?
- Make sure you copied the **External Connection** PSQL command
- Check your internet connection
- Try again in a few minutes

### Tables not created?
- Make sure you pasted the entire schema SQL
- Look for error messages in psql
- Try running the schema again

### Backend won't start?
- Check backend logs: Render Dashboard → sales-ui-api → Logs
- Verify DATABASE_URL is correct (should be Internal URL)
- Make sure it starts with `postgresql://`

### Still using JSON files?
- Verify DATABASE_URL is set in backend environment
- Check backend logs for "Connected to PostgreSQL" message
- Try restarting the backend service

---

## ✅ Success Checklist

- [ ] Connected to database via psql
- [ ] Ran schema SQL successfully
- [ ] Saw all tables with `\dt` command
- [ ] Added DATABASE_URL to backend environment
- [ ] Backend redeployed successfully
- [ ] Can create accounts in the app
- [ ] Data persists after refresh

---

## 📝 What Just Happened?

1. ✅ Created database tables in PostgreSQL
2. ✅ Connected your backend to PostgreSQL
3. ✅ Your app now stores data in a real database
4. ✅ No more file system issues!

---

## 🎉 Done!

Your app is now using PostgreSQL. All create/update/delete operations will work perfectly!

**For detailed guide, see:** [POSTGRESQL_MIGRATION_GUIDE.md](POSTGRESQL_MIGRATION_GUIDE.md)