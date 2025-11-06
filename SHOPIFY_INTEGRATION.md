# Shopify Integration Guide

Once you have `shows.json` (either manually or via GitHub Actions), here's how to use it in Shopify:

## Option 1: Shopify Theme Integration (Recommended)

### Step 1: Generate Shopify Content
```bash
npm run shopify
```

This creates:
- `shopify-html.html` - Standalone HTML page
- `shopify-shows.liquid` - Shopify Liquid template
- `shopify-metafields.json` - For Shopify API

### Step 2: Add to Your Theme

#### Method A: Custom Page Template
1. In Shopify Admin, go to **Online Store > Themes > Actions > Edit code**
2. Create a new section: `sections/whatnot-shows.liquid`
3. Copy the content from `shopify-shows.liquid`
4. Create a new page template: `templates/page.whatnot-shows.liquid`
   ```liquid
   {% section 'whatnot-shows' %}
   ```
5. Create a new page and assign the template

#### Method B: Include in Existing Page
1. Edit your theme's page template
2. Add this where you want shows to appear:
   ```liquid
   {% include 'whatnot-shows' %}
   ```
3. Create `snippets/whatnot-shows.liquid` with the content from `shopify-shows.liquid`

### Step 3: Load the JSON Data

You have several options:

#### Option A: Upload JSON to Shopify Files
1. Upload `shows.json` to Shopify Files (Settings > Files)
2. Reference it in your Liquid template:
   ```liquid
   {% assign shows_json = 'https://cdn.shopify.com/s/files/1/.../shows.json' %}
   {% assign shows = shows_json | json %}
   ```

#### Option B: Use Shopify Metafields
1. Use the Shopify Admin API to create metafields from `shopify-metafields.json`
2. Access in Liquid:
   ```liquid
   {{ shop.metafields.whatnot.shows }}
   ```

#### Option C: Fetch from GitHub (Automated)
If using GitHub Actions, you can:
1. Host `shows.json` on GitHub Pages or raw.githubusercontent.com
2. Fetch it in your Liquid template:
   ```liquid
   {% assign shows_url = 'https://raw.githubusercontent.com/YOUR_USER/wn-show-scraper/main/shows.json' %}
   {% comment %} Use JavaScript to fetch and render {% endcomment %}
   ```

## Option 2: Shopify App/API Integration

### Using Shopify Admin API

1. **Create a Custom App** in Shopify:
   - Go to Settings > Apps and sales channels > Develop apps
   - Create a new app
   - Grant read/write access to metafields

2. **Upload Shows Data**:
   ```bash
   # Using Shopify CLI
   shopify app generate extension
   # Or use the Admin API directly
   ```

3. **Store as Metafield**:
   - Use the metafield API to store `shows.json`
   - Access via Liquid: `{{ shop.metafields.whatnot.shows }}`

## Option 3: External Service (Recommended for Automation)

### Setup:
1. **GitHub Actions** runs and updates `shows.json`
2. **Host the JSON** on:
   - GitHub Pages (free)
   - Your own server
   - CDN (Cloudflare, etc.)

3. **Fetch in Shopify**:
   ```javascript
   // In your theme's JavaScript
   fetch('https://your-domain.com/shows.json')
     .then(res => res.json())
     .then(shows => {
       // Render shows
     });
   ```

### Example Implementation:

**In your Shopify theme:**
```liquid
<!-- sections/whatnot-shows.liquid -->
<div class="whatnot-shows-container" id="whatnot-shows">
  <div class="loading">Loading shows...</div>
</div>

<script>
fetch('https://raw.githubusercontent.com/YOUR_USER/wn-show-scraper/main/shows.json')
  .then(res => res.json())
  .then(shows => {
    const container = document.getElementById('whatnot-shows');
    container.innerHTML = shows.map(show => `
      <div class="show-card">
        <h3>${show.title}</h3>
        <a href="${show.url}" target="_blank">View Show</a>
      </div>
    `).join('');
  });
</script>

<style>
.whatnot-shows-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}
.show-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
}
</style>
```

## Option 4: Shopify Functions (Advanced)

For real-time updates, you could create a Shopify Function that:
1. Fetches shows from your GitHub-hosted JSON
2. Updates product metafields or creates draft products
3. Runs on a schedule via Shopify Flow

## Recommended Workflow

1. **GitHub Actions** runs every 6 hours (or manually)
2. **Commits** `shows.json` to the repo
3. **GitHub Pages** serves the JSON (or use raw.githubusercontent.com)
4. **Shopify Theme** fetches and displays the shows

This keeps everything automated and up-to-date!

