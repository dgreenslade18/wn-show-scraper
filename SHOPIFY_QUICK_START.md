# Shopify Quick Start - Display Your Shows

Simple guide to show your Whatnot shows (title, image, link) on a Shopify page.

## 🎯 What You Need

1. Your `shows.json` file (you have this!)
2. Your GitHub raw JSON URL
3. Access to edit your Shopify theme

## 📋 Step-by-Step

### Step 1: Get Your JSON URL

1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/wn-show-scraper`
2. Click on `shows.json`
3. Click the **"Raw"** button (top right)
4. Copy the URL - it looks like:
   ```
   https://raw.githubusercontent.com/YOUR_USERNAME/wn-show-scraper/main/shows.json
   ```

### Step 2: Add the Section to Shopify

1. **Shopify Admin** → **Online Store** → **Themes**
2. Click **"..."** next to your theme → **Edit code**
3. Go to `sections` folder
4. Click **"Add a new section"**
5. Name it: `whatnot-shows.liquid`
6. Open `shopify-simple.liquid` from this repo
7. Copy ALL the code
8. Paste into the new `whatnot-shows.liquid` file
9. Click **Save**

### Step 3: Add to a Page

**Option A: Add to Homepage**
1. Go to **Online Store** → **Themes** → **Customize**
2. Click **"Add section"**
3. Find **"Whatnot Shows"**
4. Paste your JSON URL in the settings
5. Click **Save**

**Option B: Add to a Custom Page**
1. Create a new page: **Pages** → **Add page**
2. In theme customizer, add the "Whatnot Shows" section
3. Paste your JSON URL
4. Save

## ✅ That's It!

Your shows will now display with:
- ✅ **Title** - Show name
- ✅ **Image** - Show thumbnail (if available)
- ✅ **Link** - Clickable link to the show

## 🎨 Customize

Edit `whatnot-shows.liquid` to change:
- Colors
- Layout (grid columns)
- Spacing
- Fonts

## 🔄 Updates

When you update `shows.json` in GitHub, your Shopify page will automatically show the new shows (no cache clearing needed - it fetches fresh each time).

## 🐛 Troubleshooting

**Shows not appearing?**
- Check the JSON URL is correct (test it in browser)
- Open browser console (F12) and check for errors
- Make sure `shows.json` is valid JSON

**Images not showing?**
- Some shows might not have images (that's normal)
- Check browser console for image load errors

**Layout looks wrong?**
- Check your theme's CSS isn't overriding styles
- Try adding `!important` to critical styles if needed


