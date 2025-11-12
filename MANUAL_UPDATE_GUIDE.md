# Manual Update Guide

Since Cloudflare blocks automated scraping, use this simple manual process.

## ⚡ Quick Process (30 seconds)

1. **Open Whatnot page:**
   ```
   https://www.whatnot.com/en-GB/user/poke__queen_1/shows
   ```

2. **Open browser console:**
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Click the "Console" tab

3. **Run the script:**
   - Open `scraper-browser-console.js`
   - Copy ALL the code
   - Paste into console
   - Press Enter

4. **Download JSON:**
   - Click the "⬇️ Download shows.json" button
   - Save the file

5. **Commit to GitHub:**
   ```bash
   ./commit-shows.sh ~/Downloads/whatnot-shows.json
   ```

## 🔄 How Often to Update

- **Daily** - Keep shows current
- **Before events** - Update before big shows
- **After shows** - Update status

## 📝 Alternative: Manual Git

```bash
cp ~/Downloads/whatnot-shows.json ./shows.json
git add shows.json
git commit -m "Update shows data"
git push
```

## ✅ That's It!

Your Shopify site will automatically fetch the updated JSON from GitHub.
