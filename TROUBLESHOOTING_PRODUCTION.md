# Troubleshooting Production Issues - Sales UI on Render

## 🐛 Issue: Cannot Create Accounts, Objectives, or Other Items

### Symptoms
- Frontend loads correctly
- Can view pages and navigate
- Cannot create new items (accounts, objectives, deals, etc.)
- No error messages visible on the page

### Most Likely Causes

#### 1. **File System Write Permissions (Most Common)**

**Problem:** Render's free tier has a read-only file system. Your app uses JSON files in `server/data/` which cannot be written to in production.

**Solution:** You need to either:
- Use PostgreSQL database instead of JSON files
- Use Render's persistent disk (paid feature)

#### 2. **CORS Issues**

**Problem:** Frontend and backend on different domains causing CORS errors.

**Check:** Open browser console (F12) and look for CORS errors.

#### 3. **API Connection Issues**

**Problem:** Frontend cannot reach backend API.

**Check:** Network tab in browser dev tools (F12 → Network).

---

## 🔍 Diagnostic Steps

### Step 1: Check Browser Console

1. Open your app in browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to create an account
5. Look for error messages

**Common Errors:**

```
❌ CORS error
❌ Network Error
❌ 404 Not Found
❌ 500 Internal Server Error
❌ Failed to fetch
```

### Step 2: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Try to create an account
3. Look at the API request
4. Check:
   - Request URL (should be your backend URL)
   - Status Code (200 = success, 4xx/5xx = error)
   - Response body (error message)

### Step 3: Check Backend Logs

1. Go to Render Dashboard
2. Click on your **backend service** (sales-ui-api)
3. Click **"Logs"** in left menu
4. Try to create an account in your app
5. Watch the logs for errors

**Common Log Errors:**

```
❌ ENOENT: no such file or directory
❌ EACCES: permission denied
❌ Cannot write to file
❌ Database connection error
```

---

## 🔧 Solutions

### Solution 1: File System Issue (Most Likely)

**The Problem:**
Your app stores data in JSON files (`server/data/*.json`). Render's free tier has a **read-only file system**, so it cannot write to these files.

**Quick Fix Options:**

#### Option A: Use Render Persistent Disk (Paid - $1/month)

1. In Render Dashboard → Backend Service → Settings
2. Scroll to "Disk"
3. Add a disk:
   - **Mount Path:** `/opt/render/project/src/server/data`
   - **Size:** 1 GB
   - Click "Save"
4. Redeploy your service

#### Option B: Migrate to PostgreSQL (Recommended for Production)

This requires code changes. I can help you with this if needed.

#### Option C: Use Render's Environment Storage (Temporary)

For testing only - data will be lost on redeploy:

1. Your current setup should work for reading
2. But writes will fail silently
3. Not recommended for production

### Solution 2: Fix CORS Issues

If you see CORS errors in console:

1. Go to Render Dashboard → Backend Service → Environment
2. Find `FRONTEND_URL` variable
3. Set it to your frontend URL: `https://your-frontend.onrender.com`
4. Save and wait for redeploy

### Solution 3: Fix API Connection

If frontend can't reach backend:

1. Check your frontend environment variable
2. In Render Dashboard → Frontend Service → Environment
3. Verify `VITE_API_URL` is set to: `https://your-backend.onrender.com/api`
4. Redeploy frontend if you made changes

---

## 🎯 Immediate Action Plan

### For Testing (Quick Fix):

**Add Persistent Disk to Backend:**

1. Render Dashboard → sales-ui-api → Settings
2. Scroll to "Disk" section
3. Click "Add Disk"
4. Configure:
   - **Name:** `data-storage`
   - **Mount Path:** `/opt/render/project/src/server/data`
   - **Size:** 1 GB ($1/month)
5. Click "Create Disk"
6. Service will redeploy automatically
7. Test creating accounts again

### For Production (Better Solution):

**Migrate to PostgreSQL:**

This requires updating your code to use PostgreSQL instead of JSON files. Benefits:
- ✅ Proper database with transactions
- ✅ Better performance
- ✅ Data persistence
- ✅ Concurrent access support
- ✅ Already included in Render setup

---

## 📊 Check Current Status

### Test These URLs:

1. **Frontend:** `https://your-frontend.onrender.com`
   - Should load the app

2. **Backend Health:** `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Backend Accounts:** `https://your-backend.onrender.com/api/accounts`
   - Should return: `{"data":[]}`  or list of accounts

### If Backend URLs Don't Work:

- Backend might not be deployed correctly
- Check backend logs in Render Dashboard
- Verify build and start commands are correct

---

## 🆘 Quick Diagnosis

Run this in your browser console (F12 → Console):

```javascript
// Test backend connection
fetch('https://your-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.error('❌ Backend Error:', e));

// Test create account
fetch('https://your-backend.onrender.com/api/accounts', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'Test Account'})
})
  .then(r => r.json())
  .then(d => console.log('✅ Create OK:', d))
  .catch(e => console.error('❌ Create Error:', e));
```

Replace `your-backend.onrender.com` with your actual backend URL.

---

## 💡 Most Likely Solution

Based on your symptoms, **99% chance** it's the file system issue. 

**Quick fix:** Add a persistent disk to your backend service ($1/month).

**Better fix:** Migrate to PostgreSQL (I can help with this).

---

## 📞 Need Help?

1. Check backend logs first (most informative)
2. Check browser console for errors
3. Try the persistent disk solution
4. If still stuck, share:
   - Error messages from logs
   - Error messages from console
   - Your backend URL (so I can test)

---

**Next Step:** Check your backend logs in Render Dashboard → sales-ui-api → Logs