# Webhook Alternative (Advanced)

If you want to use webhooks instead of fetching JSON directly, here's how:

## Option 1: GitHub Webhook → Shopify

### Setup GitHub Webhook

1. Go to your GitHub repo → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: Your Shopify webhook endpoint (see below)
   - **Content type**: `application/json`
   - **Events**: Select "Just the push event"
   - **Active**: ✅

### Create Shopify Webhook Endpoint

You'll need a server/function to receive the webhook and update Shopify. Options:

#### A. Shopify Functions (Recommended)

Create a function that:
1. Receives webhook from GitHub
2. Updates Shopify metafields with show data
3. Returns success

#### B. External Server

Use a service like:
- **Vercel Functions**
- **Netlify Functions**
- **AWS Lambda**
- **Google Cloud Functions**

Example (Node.js):

```javascript
// webhook-handler.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const shows = req.body.shows || [];
  
  // Update Shopify metafields via Admin API
  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/metafields.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metafield: {
          namespace: 'whatnot',
          key: 'shows',
          value: JSON.stringify(shows),
          type: 'json'
        }
      })
    }
  );

  return res.status(200).json({ success: true });
}
```

## Option 2: Direct Shopify API Update

Modify GitHub Actions to update Shopify directly:

### Update Workflow

Add to `.github/workflows/scrape-shows.yml`:

```yaml
- name: Update Shopify Metafields
  env:
    SHOPIFY_STORE: ${{ secrets.SHOPIFY_STORE }}
    SHOPIFY_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ACCESS_TOKEN }}
  run: |
    # Read shows.json
    SHOWS=$(cat shows.json)
    
    # Update Shopify metafield
    curl -X PUT \
      "https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/metafields.json" \
      -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"metafield\": {
          \"namespace\": \"whatnot\",
          \"key\": \"shows\",
          \"value\": ${SHOWS},
          \"type\": \"json\"
        }
      }"
```

### Get Shopify Access Token

1. Go to **Settings** → **Apps and sales channels**
2. Click **Develop apps**
3. Create a new app
4. Configure Admin API access:
   - **Read and write** access to metafields
5. Install the app
6. Copy the **Admin API access token**
7. Add to GitHub Secrets as `SHOPIFY_ACCESS_TOKEN`

### Use in Liquid

Then in your theme:

```liquid
{% assign shows = shop.metafields.whatnot.shows | json %}
{% for show in shows %}
  <!-- Display show -->
{% endfor %}
```

## Recommendation

**For most users, fetching JSON directly is simpler and recommended:**
- ✅ No server needed
- ✅ No API tokens to manage
- ✅ Works immediately
- ✅ Free (GitHub raw URLs)
- ✅ Automatic updates

Only use webhooks if you need:
- Real-time updates (instead of 6-hour delay)
- More control over data storage
- Integration with other systems

