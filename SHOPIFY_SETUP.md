# Shopify Setup Guide

Complete guide to integrate your Whatnot shows into your Shopify store.

## 🎯 Overview

This setup will:
1. ✅ Display your Whatnot shows on your Shopify site
2. ✅ Automatically update every 6 hours (via GitHub Actions)
3. ✅ Work with any Shopify theme
4. ✅ Be fully customizable

## 📋 Prerequisites

- Your GitHub repo with `shows.json` (already set up!)
- Access to your Shopify theme code
- Basic knowledge of Shopify theme editor

## 🚀 Step-by-Step Setup

### Step 1: Get Your JSON URL

1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/wn-show-scraper`
2. Click on `shows.json`
3. Click "Raw" button (top right)
4. Copy the URL - it should look like:
   ```
   https://raw.githubusercontent.com/YOUR_USERNAME/wn-show-scraper/main/shows.json
   ```
5. **Save this URL** - you'll need it in Step 3

### Step 2: Add the Section to Your Theme

#### Option A: Via Theme Editor (Easiest)

1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **"..."** next to your theme → **Edit code**
3. Navigate to `sections` folder
4. Click **"Add a new section"**
5. Name it: `whatnot-shows.liquid`
6. Copy the entire contents of `shopify-theme-section.liquid` from this repo
7. Paste it into the new file
8. Click **Save**

#### Option B: Via Theme Files (Advanced)

1. Download your theme files
2. Add `shopify-theme-section.liquid` to the `sections` folder
3. Upload the theme back to Shopify

### Step 3: Configure the Section

1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **"Customize"** on your active theme
3. Click **"Add section"**
4. Find and select **"Whatnot Shows"**
5. In the section settings:
   - **Section Title**: e.g., "Upcoming Shows"
   - **Description**: Optional description
   - **JSON URL**: Paste your GitHub raw URL from Step 1
6. Click **Save**

### Step 4: Add to a Page

#### Option A: Add to Homepage

1. In the theme customizer, the section should already be visible
2. Drag it to where you want it on the page
3. Click **Save**

#### Option B: Add to a Custom Page

1. Create a new page: **Online Store** → **Pages** → **Add page**
2. In the page template, add:
   ```liquid
   {% section 'whatnot-shows' %}
   ```
3. Or use the theme customizer to add the section to the page

#### Option C: Add to Product Page

1. Edit your product template
2. Add the section where you want it:
   ```liquid
   {% section 'whatnot-shows' %}
   ```

## 🔄 Automatic Updates

**Good news!** Your shows update automatically every 6 hours via GitHub Actions. No cron job needed!

### How It Works:

1. **GitHub Actions** runs every 6 hours
2. Scrapes your Whatnot shows
3. Updates `shows.json` in your repo
4. Your Shopify site fetches the updated JSON
5. Shows update automatically (no cache clearing needed)

### Manual Refresh:

If you want to force an update:
1. Go to your GitHub repo
2. Click **Actions** tab
3. Click **"Scrape Whatnot Shows"**
4. Click **"Run workflow"**

## 🎨 Customization

### Change Update Frequency

Edit `.github/workflows/scrape-shows.yml`:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
  # Change to:
  # - cron: '0 */12 * * *'  # Every 12 hours
  # - cron: '0 0 * * *'     # Daily at midnight
  # - cron: '0 */2 * * *'   # Every 2 hours
```

### Customize the Display

Edit `shopify-theme-section.liquid`:
- Change colors in the `<style>` section
- Modify the card layout
- Adjust grid columns
- Add/remove fields

### Filter Shows

To show only upcoming shows, modify the JavaScript in the section:

```javascript
.then(shows => {
  // Filter to only upcoming shows
  const upcomingShows = shows.filter(show => 
    show.status === 'upcoming' || show.status === 'live'
  );
  // Use upcomingShows instead of shows
})
```

## 🐛 Troubleshooting

### Shows Not Appearing

1. **Check the JSON URL**:
   - Make sure it's the raw GitHub URL
   - Test it in your browser - you should see JSON

2. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Look for errors in the Console tab
   - Check Network tab to see if the JSON is loading

3. **Check CORS**:
   - GitHub raw URLs should work fine
   - If using a custom domain, ensure CORS is enabled

### Shows Not Updating

1. **Check GitHub Actions**:
   - Go to Actions tab in your repo
   - Verify the workflow is running
   - Check if `shows.json` was updated

2. **Clear Browser Cache**:
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache

3. **Check JSON Format**:
   - Verify `shows.json` is valid JSON
   - Use a JSON validator if needed

### Styling Issues

1. **Theme Conflicts**:
   - Some themes may override styles
   - Add `!important` to critical styles if needed
   - Or use more specific selectors

2. **Mobile Responsiveness**:
   - The section is responsive by default
   - Test on mobile devices
   - Adjust breakpoints in the CSS if needed

## 📱 Alternative: Shopify App

If you want a more robust solution, you could create a Shopify app:

1. Use Shopify CLI to create an app
2. Store shows in Shopify metafields
3. Update via webhook from GitHub Actions
4. Display via app blocks

See `SHOPIFY_INTEGRATION.md` for more advanced options.

## ✅ Next Steps

1. ✅ Set up the section (Steps 1-4 above)
2. ✅ Test that shows appear
3. ✅ Customize the styling
4. ✅ Add to your desired pages
5. ✅ Monitor GitHub Actions to ensure updates are working

Your shows will now automatically update every 6 hours! 🎉

