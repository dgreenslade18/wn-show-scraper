# Fix GitHub Actions Permissions

If you're getting a 403 error when the workflow tries to push, here's how to fix it:

## 🔧 Solution 1: Add Workflow Permissions (Already Done)

I've updated the workflow to include:
```yaml
permissions:
  contents: write
```

This should work for most repos.

## 🔧 Solution 2: If Solution 1 Doesn't Work

### Enable Workflow Permissions in Repo Settings

1. Go to your GitHub repo
2. Click **Settings** → **Actions** → **General**
3. Scroll to **"Workflow permissions"**
4. Select **"Read and write permissions"**
5. Check **"Allow GitHub Actions to create and approve pull requests"**
6. Click **Save**

### Alternative: Use Personal Access Token

If the above doesn't work:

1. **Create a Personal Access Token:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name it: "GitHub Actions Push"
   - Select scope: `repo` (full control)
   - Generate and **copy the token**

2. **Add to GitHub Secrets:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `PAT_TOKEN`
   - Value: Paste your token
   - Click "Add secret"

3. **Update the workflow** (I can do this if needed):
   ```yaml
   - name: Checkout repository
     uses: actions/checkout@v4
     with:
       token: ${{ secrets.PAT_TOKEN }}
   ```

## ✅ Test

After fixing permissions, trigger the workflow manually:
1. Go to **Actions** tab
2. Click **"Scrape Whatnot Shows"**
3. Click **"Run workflow"**

The commit step should now work!

