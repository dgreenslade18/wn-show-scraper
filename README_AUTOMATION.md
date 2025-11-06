# Automated Workflow Setup

This guide explains how to set up automated scraping via GitHub Actions and integrate with Shopify.

## 🎯 Overview

The workflow:
1. **GitHub Actions** runs on a schedule (every 6 hours)
2. **Scrapes** your Whatnot shows automatically
3. **Commits** the `shows.json` file to the repo
4. **Shopify** fetches the JSON and displays shows

## 🚀 Quick Setup

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/wn-show-scraper.git
git push -u origin main
```

### Step 2: Configure GitHub Actions

1. Go to your GitHub repo
2. Go to **Settings > Secrets and variables > Actions**
3. Add a secret (optional):
   - Name: `WHATNOT_USER_URL`
   - Value: Your Whatnot user URL (if different from default)

### Step 3: Enable GitHub Actions

The workflow is already configured in `.github/workflows/scrape-shows.yml`. It will:
- Run every 6 hours automatically
- Can be triggered manually via "Actions" tab
- Commits `shows.json` when shows are found

### Step 4: Test the Workflow

1. Go to **Actions** tab in your GitHub repo
2. Click **"Scrape Whatnot Shows"**
3. Click **"Run workflow"**
4. Wait for it to complete
5. Check that `shows.json` was created/updated

## 📦 Using the JSON in Shopify

### Option 1: GitHub Raw URL (Easiest)

1. After GitHub Actions runs, your `shows.json` is available at:
   ```
   https://raw.githubusercontent.com/YOUR_USERNAME/wn-show-scraper/main/shows.json
   ```

2. In your Shopify theme, add JavaScript to fetch it:
   ```javascript
   fetch('https://raw.githubusercontent.com/YOUR_USERNAME/wn-show-scraper/main/shows.json')
     .then(res => res.json())
     .then(shows => {
       // Render your shows
     });
   ```

### Option 2: GitHub Pages

1. Enable GitHub Pages in repo settings
2. Your JSON will be at: `https://YOUR_USERNAME.github.io/wn-show-scraper/shows.json`

### Option 3: Download and Upload to Shopify

1. After GitHub Actions runs, download `shows.json` from the repo
2. Upload to Shopify Files (Settings > Files)
3. Reference in your theme

## 🔧 Customization

### Change Schedule

Edit `.github/workflows/scrape-shows.yml`:
```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
  # Or: '0 0 * * *'      # Daily at midnight
  # Or: '0 */12 * * *'   # Every 12 hours
```

### Change Whatnot URL

Either:
1. Set GitHub secret `WHATNOT_USER_URL`
2. Or edit `scraper-automated.js` default URL

### Manual Trigger

You can always trigger manually:
1. Go to **Actions** tab
2. Select **"Scrape Whatnot Shows"**
3. Click **"Run workflow"**

## 📊 Monitoring

- Check **Actions** tab to see run history
- Each run creates an artifact with `shows.json`
- Failed runs won't break your site (empty array is saved)

## 🛠️ Troubleshooting

**Workflow fails:**
- Check the Actions logs
- Make sure Puppeteer can access Whatnot
- Verify the Whatnot URL is correct

**No shows found:**
- Check if Whatnot page structure changed
- Verify you're using the correct user URL
- Check the workflow logs for errors

**JSON not updating:**
- Check if workflow is running (Actions tab)
- Verify the commit was pushed
- Check if shows.json is being ignored by .gitignore

## 🎨 Next Steps

See `SHOPIFY_INTEGRATION.md` for detailed Shopify integration options!

