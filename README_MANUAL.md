# Manual Update Process (Recommended)

Since Cloudflare blocks automated scraping, use this simple manual process:

## ⚡ Quick Process (30 seconds)

1. **Open Whatnot page** → https://www.whatnot.com/en-GB/user/poke__queen_1/shows
2. **Open console** (F12) → Paste `scraper-browser-console.js` → Press Enter
3. **Click download button** → Save `shows.json`
4. **Run:** `./commit-shows.sh ~/Downloads/whatnot-shows.json`
5. **Done!** Your Shopify site will update automatically

## 📋 Detailed Steps

### 1. Get Shows Data

```bash
# Open browser console on Whatnot page
# Paste scraper-browser-console.js
# Download the JSON file
```

### 2. Update Repo

**Easy way (using helper script):**
```bash
./commit-shows.sh ~/Downloads/whatnot-shows.json
```

**Manual way:**
```bash
cp ~/Downloads/whatnot-shows.json ./shows.json
git add shows.json
git commit -m "Update shows data"
git push
```

## 🔄 Automation Options

### Option 1: GitHub Actions (Manual Trigger)

The workflow can be triggered manually:
1. Go to GitHub → Actions tab
2. Click "Scrape Whatnot Shows"
3. Click "Run workflow"
4. (Will still hit Cloudflare, but you can try)

### Option 2: Scheduled Reminder

Set a calendar reminder to update weekly/daily.

### Option 3: Browser Extension

Could create a browser extension that:
- Runs the script automatically
- Commits to GitHub via API
- Runs on a schedule

## ✅ Why This Works

- ✅ No Cloudflare issues (you're logged in)
- ✅ Fast (30 seconds)
- ✅ Reliable (always works)
- ✅ Your Shopify site auto-updates from GitHub

## 🎯 When to Update

- **Daily** - Keep shows current
- **Before events** - Update before big shows
- **After shows** - Update status (upcoming → past)

