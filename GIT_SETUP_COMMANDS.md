# Git Setup Commands for Your Repository

## Issue
The git remote is pointing to a placeholder URL instead of your actual GitHub repository.

## Solution

Run these commands in your terminal:

```bash
# Navigate to your project
cd /Users/oriolnuez/Desktop/UI_Sales

# Remove the incorrect remote
git remote remove origin

# Add the correct remote (your actual GitHub repo)
git remote add origin https://github.com/OriolNuez/sales-ui.git

# Verify the remote is correct
git remote -v

# Check if you have uncommitted changes
git status

# If you have changes, add and commit them
git add .
git commit -m "Production-ready: Bug fixes, optimizations, and Render config"

# Push to GitHub
git push -u origin main
```

## If the Repository Doesn't Exist on GitHub

If you get "Repository not found", you need to create it first:

1. **Go to GitHub:** https://github.com/new
2. **Create new repository:**
   - Repository name: `sales-ui`
   - Description: "Sales UI Application - Production Ready"
   - Visibility: Private (or Public)
   - **DO NOT** initialize with README, .gitignore, or license
3. **Click "Create repository"**
4. **Then run the commands above**

## Alternative: If Repository Already Exists

If the repository exists but you're getting errors:

```bash
# Check what remote URL is set
git remote -v

# If it shows the wrong URL, update it:
git remote set-url origin https://github.com/OriolNuez/sales-ui.git

# Then push
git push -u origin main
```

## If You Need to Force Push (Use with Caution)

Only if the repository exists but has different history:

```bash
git push -u origin main --force
```

⚠️ **Warning:** Force push will overwrite the remote repository. Only use if you're sure!

## Verify Success

After pushing, you should see:

```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Delta compression using up to X threads
Compressing objects: 100% (X/X), done.
Writing objects: 100% (X/X), X.XX MiB | X.XX MiB/s, done.
Total X (delta X), reused X (delta X), pack-reused 0
To https://github.com/OriolNuez/sales-ui.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## Next Steps After Successful Push

1. ✅ Verify your code is on GitHub: https://github.com/OriolNuez/sales-ui
2. ✅ Continue with Render.com deployment (see DEPLOYMENT_CHECKLIST.md)
3. ✅ Connect Render to your GitHub repository
4. ✅ Deploy!

---

**Current Status:** Ready to push to GitHub
**Next:** Follow commands above, then proceed to Render deployment