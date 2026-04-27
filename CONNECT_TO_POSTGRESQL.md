# Connect to Render PostgreSQL Database

## Quick Method (Using Connection String)

### Step 1: Get Your Connection String

1. Go to your Render Dashboard: https://dashboard.render.com
2. Click on your PostgreSQL database (dpg-d7n8nu57vvec7390aglg-a)
3. Scroll down to the **Connections** section
4. Copy the **External Database URL** (it looks like this):
   ```
   postgresql://username:password@dpg-d7n8nu57vvec7390aglg-a.oregon-postgres.render.com/database_name
   ```

### Step 2: Connect Using psql

Run this command in your terminal (replace with your actual connection string):

```bash
psql "postgresql://oriol:SW0UifNvGAFt82hGpVdUFWMOjPmboKvx@dpg-d7n8nu57vvec7390aglg-a.frankfurt-postgres.render.com/sales_ui"
```

**Note**: Make sure you have PostgreSQL installed on your Mac. If not, install it first:

```bash
brew install postgresql
```

### Step 3: Run the Migration

Once connected to the database, you'll see a prompt like `database_name=>`. Now run:

```sql
\i server/migrations/001_initial_schema.sql
```

**Important**: Make sure you run this command from your project directory (`/Users/oriolnuez/Desktop/UI_Sales`), or provide the full path to the SQL file.

### Step 4: Verify Tables Were Created

```sql
\dt
```

You should see a list of 14 tables including accounts, deals, objectives, etc.

### Step 5: Exit psql

```sql
\q
```

---

## Alternative Method (Using Render Dashboard)

If you prefer not to use the command line:

1. Go to your PostgreSQL database in Render Dashboard
2. Click the **"Connect"** button at the top right
3. Select **"External Connection"**
4. Use a PostgreSQL client like:
   - **pgAdmin** (GUI application)
   - **DBeaver** (GUI application)
   - **TablePlus** (GUI application for Mac)

5. Copy the SQL from `server/migrations/001_initial_schema.sql`
6. Paste and execute it in your chosen client

---

## After Migration is Complete

### Add DATABASE_URL to Backend Service

1. Go to your backend service in Render Dashboard
2. Click **"Environment"** in the left sidebar
3. Click **"Add Environment Variable"**
4. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Your **Internal Database URL** from the PostgreSQL database page
     (It looks like: `postgresql://username:password@dpg-xxx-a/database_name`)

5. Click **"Save Changes"**
6. Your backend will automatically redeploy (takes 2-3 minutes)

### Verify It's Working

1. Wait for the redeploy to complete
2. Check your backend logs - you should see: `Connected to PostgreSQL database`
3. Open your frontend application
4. Try creating a new account or deal
5. Refresh the page - the data should persist!

---

## Troubleshooting

### "psql: command not found"

Install PostgreSQL on your Mac:

```bash
brew install postgresql
```

### "Connection refused" or "timeout"

- Make sure you're using the **External Database URL** (not Internal)
- Check that your IP is not blocked (Render allows all IPs by default)
- Verify the database is running in Render Dashboard

### "Permission denied"

- Make sure you copied the complete connection string including the password
- The connection string should start with `postgresql://` not `postgres://`

### Migration file not found

Make sure you're in the project directory:

```bash
cd /Users/oriolnuez/Desktop/UI_Sales
psql "your-connection-string"
```

Then run:
```sql
\i server/migrations/001_initial_schema.sql
```

---

## What Happens After Migration?

1. ✅ Your app will use PostgreSQL instead of JSON files
2. ✅ All create/update/delete operations will work in production
3. ✅ Data will persist across deployments
4. ✅ The app will be fully functional on Render.com
5. ✅ You'll have 90 days free, then $7/month for the database

The backend code already supports PostgreSQL - it will automatically detect the `DATABASE_URL` environment variable and use PostgreSQL instead of JSON files.