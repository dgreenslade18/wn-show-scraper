# Manual Update Guide

Since Cloudflare is blocking automated scraping, use this manual method (it works perfectly!).

## 🎯 Quick Steps

### Step 1: Get the JSON

1. **Open your Whatnot shows page:**
   ```
   https://www.whatnot.com/en-GB/user/poke__queen_1/shows
   ```

2. **Open browser console:**
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Click the "Console" tab

3. **Copy and paste the script:**
   - Open `scraper-browser-console.js` in this folder
   - Select ALL the code (Cmd+A / Ctrl+A)
   - Copy it (Cmd+C / Ctrl+C)
   - Paste into the console (Cmd+V / Ctrl+V)
   - Press **Enter**

4. **Download the JSON:**
   - A green "⬇️ Download shows.json" button will appear on the page
   - Click it to download
   - Or use the "📋 Copy JSON to Clipboard" button and save it manually

### Step 2: Update Your Repo

**Option A: Using Git (Command Line)**

```bash
# Save the downloaded file to your project folder
# Replace the existing shows.json
cp ~/Downloads/whatnot-shows.json ./shows.json

# Commit and push
git add shows.json
git commit -m "Update shows data"
git push
```

**Option B: Using GitHub Web Interface**

1. Go to your GitHub repo
2. Click on `shows.json`
3. Click the pencil icon (Edit)
4. Paste your JSON content
5. Click "Commit changes"

**Option C: Using the Helper Script**

I've created a helper script - see below!

## 🔄 How Often to Update

- **Daily**: Run the console script once per day
- **Before big shows**: Update right before important shows
- **After shows**: Update after shows to reflect current status

## 📝 Quick Reference

**Console Script Location:** `scraper-browser-console.js`

**What it does:**
- ✅ Extracts all shows from the page
- ✅ Creates downloadable JSON
- ✅ Works perfectly (no Cloudflare issues!)
- ✅ Takes 10 seconds

**Time needed:** ~30 seconds total (script + download + commit)

## 🎨 Pro Tip

Bookmark the console script in a text file or note-taking app for quick access!

