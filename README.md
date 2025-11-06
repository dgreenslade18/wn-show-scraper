# Whatnot Show Scraper

A web scraper to extract show information from your Whatnot user page for integration with your Shopify site.

## Features

- 🎯 Automatically scrapes shows from your Whatnot user page
- 📊 Exports show data to JSON format
- 🔄 Easy to integrate with Shopify
- 🛡️ Handles dynamic content loading

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### ⚠️ Recommended Method: Browser Console Script (Most Reliable)

If you're experiencing Puppeteer connection errors, use this method instead:

1. **Open your Whatnot user page** in your browser:
   - https://www.whatnot.com/en-GB/user/poke__queen_1

2. **Open the browser console**:
   - Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)

3. **Open the file `scraper-browser-console.js`** and copy the entire script

4. **Paste it into the console** and press Enter

5. **The script will**:
   - Extract all shows from the page
   - Display them in the console
   - Create a download button for `shows.json`
   - Create a copy-to-clipboard button

6. **Save the JSON file** to your project directory as `shows.json`

This method works 100% of the time and doesn't require Puppeteer!

---

### Alternative Method: Automated Scraper (If Puppeteer Works)

1. Update the `WHATNOT_USER_URL` in `scraper-fixed.js` if needed

2. Run the scraper:
```bash
npm start
```

**Expected Output:**
- `🚀 Starting Whatnot show scraper...`
- `🔧 Using Chrome at: [path]`
- `🌐 Launching browser...` (a browser window should open)
- `✅ Browser launched successfully`
- `⏳ Navigating to page...`
- `✅ Page loaded`
- `🔍 Extracting show data...`
- `✅ Found X unique shows`
- `💾 Shows saved to shows.json`
- `💾 Shows saved to shows.csv`

**If it fails with "socket hang up" error:**
- This is a known Puppeteer issue on macOS
- Use the Browser Console Script method above instead

### Step 2: Generate Shopify Content

After scraping, generate Shopify-ready content:

```bash
npm run shopify
```

This creates:
- `shopify-html.html` - Standalone HTML page you can use
- `shopify-shows.liquid` - Shopify Liquid template code
- `shopify-metafields.json` - JSON for Shopify metafields API

## Output Format

The scraper generates a `shows.json` file with the following structure:

```json
[
  {
    "id": "show-id",
    "title": "Show Title",
    "url": "https://www.whatnot.com/show/...",
    "image": "https://...",
    "date": "Date/Time",
    "status": "upcoming/live/past",
    "scrapedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Shopify Integration

You can use the generated `shows.json` file in several ways:

### Option 1: Shopify App/Theme Integration
- Create a custom Shopify app or theme section
- Read the JSON file and display shows dynamically
- Set up a cron job or webhook to refresh the data periodically

### Option 2: Manual Import
- Use the JSON data to manually create products or pages in Shopify
- Or use Shopify's API to programmatically create content

### Option 3: Scheduled Scraping
- Set up a cron job to run the scraper periodically
- Automatically update your Shopify site with new shows

## Troubleshooting

If the scraper doesn't find any shows:

1. Check that the Whatnot page URL is correct
2. The page structure might have changed - check `debug-screenshot.png` if generated
3. You may need to update the selectors in `scraper.js` to match the current page structure

## Legal Notice

⚠️ **Important**: Web scraping may violate Whatnot's Terms of Service. Please review their terms before using this scraper. This tool is for personal use only. Consider:
- Reaching out to Whatnot to request API access
- Using official integrations if available
- Manually curating content if scraping is not permitted

## License

MIT

