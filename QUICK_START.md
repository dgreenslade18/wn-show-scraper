# Quick Start Guide

## 🎯 Easiest Method: Browser Console Script

**This is the most reliable way to get your shows!**

### Steps:

1. **Open your Whatnot page** in Chrome/Firefox:
   ```
   https://www.whatnot.com/en-GB/user/poke__queen_1
   ```

2. **Open Developer Console**:
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Click the "Console" tab

3. **Copy the script**:
   - Open `scraper-browser-console.js` in this folder
   - Select all (Cmd+A / Ctrl+A) and copy (Cmd+C / Ctrl+C)

4. **Paste into console**:
   - Click in the console
   - Paste (Cmd+V / Ctrl+V)
   - Press Enter

5. **Download the results**:
   - You'll see a "Download shows.json" button appear on the page
   - Click it to download
   - Move the file to this project folder

6. **Generate Shopify content**:
   ```bash
   npm run shopify
   ```

That's it! You now have:
- `shows.json` - Your show data
- `shopify-html.html` - Ready-to-use HTML page
- `shopify-shows.liquid` - Shopify theme code
- `shopify-metafields.json` - For Shopify API

---

## 🔧 Troubleshooting

**Q: The automated scraper (`npm start`) gives "socket hang up" error**  
A: This is a Puppeteer issue on macOS. Use the Browser Console Script method above - it's actually easier and more reliable!

**Q: The browser console script doesn't find any shows**  
A: Make sure you're on the correct Whatnot user page and the shows are visible on the page. Try scrolling down to load more content, then run the script again.

**Q: How do I update the shows later?**  
A: Just run the browser console script again on your Whatnot page, and it will generate fresh data.

