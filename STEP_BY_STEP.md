# Step-by-Step: Extract Your Whatnot Shows

Since the automated scraper is having issues, here's the **easy browser method**:

## 🎯 Method: Browser Console Script

### Step 1: Open Your Whatnot Shows Page
1. Go to: https://www.whatnot.com/en-GB/user/poke__queen_1/shows
2. Make sure you can see your shows on the page
3. Scroll down if needed to load all shows

### Step 2: Open Browser Console
- **Mac**: Press `Cmd + Option + I` (or `Cmd + Option + J`)
- **Windows/Linux**: Press `F12` or `Ctrl + Shift + I`
- Or: Right-click → "Inspect" → Click "Console" tab

### Step 3: Copy the Script
1. Open the file `scraper-browser-console.js` in this folder
2. Select **ALL** the text (Cmd+A / Ctrl+A)
3. Copy it (Cmd+C / Ctrl+C)

### Step 4: Paste and Run
1. Click in the browser console (where you see the `>` prompt)
2. Paste the script (Cmd+V / Ctrl+V)
3. Press **Enter**

### Step 5: Download Results
You'll see:
- ✅ A list of shows in the console
- ⬇️ A "Download shows.json" button on the page
- 📋 A "Copy JSON to Clipboard" button

**Click the download button** and save the file to this project folder.

### Step 6: Generate Shopify Content
Once you have `shows.json` in this folder, run:

```bash
npm run shopify
```

This creates:
- `shopify-html.html` - Ready-to-use HTML
- `shopify-shows.liquid` - Shopify theme code
- `shopify-metafields.json` - For Shopify API

---

## 🆘 Troubleshooting

**Q: The script says "Found 0 shows"**  
A: Make sure:
- You're on the correct Whatnot user page
- The shows are visible on the page (scroll down)
- Try refreshing the page and running the script again

**Q: I don't see the download button**  
A: The JSON is still in the console. Look for the text between the `=====` lines and copy it. Save it as `shows.json` in this folder.

**Q: The console shows errors**  
A: Make sure you copied the ENTIRE script from `scraper-browser-console.js`, including the first and last lines.

