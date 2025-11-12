# Whatnot Shows Scraper for Shopify

Scrape your Whatnot shows and display them on your Shopify site.

## 🚀 Quick Start

### 1. Get Your Shows Data

**Use the browser console script** (works perfectly, no Cloudflare issues):

1. Open: https://www.whatnot.com/en-GB/user/poke__queen_1/shows
2. Open browser console (F12 or Cmd+Option+I)
3. Copy and paste the entire `scraper-browser-console.js` file
4. Press Enter
5. Click the "⬇️ Download shows.json" button
6. Save the file

### 2. Update GitHub

```bash
./commit-shows.sh ~/Downloads/whatnot-shows.json
```

Or manually:
```bash
cp ~/Downloads/whatnot-shows.json ./shows.json
git add shows.json
git commit -m "Update shows data"
git push
```

### 3. Add to Shopify

1. **Get your JSON URL:**
   - Go to your GitHub repo → Click `shows.json` → Click "Raw"
   - Copy the URL (e.g., `https://raw.githubusercontent.com/YOUR_USERNAME/wn-show-scraper/main/shows.json`)

2. **Add the section:**
   - Shopify Admin → Online Store → Themes → Edit code
   - Go to `sections` folder → Add new section: `whatnot-shows.liquid`
   - Copy the entire `shopify-simple.liquid` file into it
   - Save

3. **Add to a page:**
   - Themes → Customize → Add section → "Whatnot Shows"
   - Paste your JSON URL in settings
   - Save

## 📁 Project Structure

```
├── scraper-browser-console.js  # Browser console script (use this!)
├── shopify-simple.liquid       # Shopify theme section
├── commit-shows.sh            # Helper script to commit shows
├── shows.json                 # Your shows data (auto-updates)
└── .github/workflows/         # GitHub Actions (optional)
```

## 🔄 How It Works

1. **You run the browser console script** → Gets shows from Whatnot
2. **Download and commit** → Updates `shows.json` in GitHub
3. **Shopify fetches JSON** → Displays shows automatically

## 📝 Files

- **`scraper-browser-console.js`** - Script to paste in browser console
- **`shopify-simple.liquid`** - Shopify theme section (displays shows)
- **`commit-shows.sh`** - Helper to commit shows.json easily
- **`shows.json`** - Your shows data (committed to repo)

## 🎯 Features

- ✅ Works reliably (no Cloudflare issues)
- ✅ Fast (30 seconds to update)
- ✅ Automatic updates on Shopify (fetches fresh JSON)
- ✅ Displays: Title, Image, Link

## 🔧 Customization

Edit `shopify-simple.liquid` to customize:
- Colors and styling
- Layout (grid columns)
- Card design

## 📚 More Info

- See `SHOPIFY_QUICK_START.md` for detailed Shopify setup
- See `MANUAL_UPDATE_GUIDE.md` for update instructions

## ⚠️ Note

Automated scraping via GitHub Actions is blocked by Cloudflare. The manual browser console method works perfectly and is recommended.
