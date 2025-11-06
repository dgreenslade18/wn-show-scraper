# How to Save Your Shows Data

Since the script is working and showing shows in the console, here's how to save it:

## Option 1: Use the Download Button (Easiest)
1. Look for the **"⬇️ Download shows.json"** button on the page
2. Click it
3. Save the file to this project folder: `/Users/dom/WebstormProjects/wn-show-scraper/`

## Option 2: Copy from Console
1. In the console, find the JSON output between the `=====` lines
2. Select and copy the entire JSON (from `[` to `]`)
3. Create a new file called `shows.json` in this folder
4. Paste the JSON into it
5. Save the file

## Option 3: Use Copy Button
1. Look for the **"📋 Copy JSON to Clipboard"** button on the page
2. Click it
3. Create a new file called `shows.json` in this folder
4. Paste (Cmd+V) and save

---

## After Saving shows.json

Once you have `shows.json` in this folder, run:

```bash
npm run shopify
```

This will generate:
- `shopify-html.html` - Standalone HTML page
- `shopify-shows.liquid` - Shopify Liquid template
- `shopify-metafields.json` - For Shopify API

