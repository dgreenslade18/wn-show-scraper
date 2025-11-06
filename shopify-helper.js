import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper script to format Whatnot shows data for Shopify integration
 * This creates HTML snippets and Shopify Liquid template code
 */

async function generateShopifyContent() {
  try {
    // Read the shows data
    const showsData = await fs.readFile(join(__dirname, 'shows.json'), 'utf-8');
    const shows = JSON.parse(showsData);

    if (shows.length === 0) {
      console.log('❌ No shows found. Please run the scraper first.');
      return;
    }

    console.log(`📦 Generating Shopify content for ${shows.length} shows...`);

    // Generate HTML snippet
    const htmlContent = generateHTML(shows);
    await fs.writeFile(join(__dirname, 'shopify-html.html'), htmlContent);
    console.log('✅ Generated shopify-html.html');

    // Generate Liquid template
    const liquidContent = generateLiquid(shows);
    await fs.writeFile(join(__dirname, 'shopify-shows.liquid'), liquidContent);
    console.log('✅ Generated shopify-shows.liquid');

    // Generate JSON for Shopify metafields
    const metafieldData = generateMetafieldJSON(shows);
    await fs.writeFile(join(__dirname, 'shopify-metafields.json'), JSON.stringify(metafieldData, null, 2));
    console.log('✅ Generated shopify-metafields.json');

    console.log('\n✨ Shopify content generation complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Use shopify-html.html as a starting point for a custom page');
    console.log('2. Use shopify-shows.liquid in your theme templates');
    console.log('3. Use shopify-metafields.json to create metafields via API');

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ shows.json not found. Please run the scraper first: npm start');
    } else {
      console.error('❌ Error generating Shopify content:', error);
    }
  }
}

function generateHTML(shows) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Whatnot Shows</title>
    <style>
        .shows-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .show-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            background: white;
        }
        .show-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .show-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            background: #f5f5f5;
        }
        .show-content {
            padding: 1.5rem;
        }
        .show-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
            color: #333;
        }
        .show-date {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        .show-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        .show-status.upcoming {
            background: #e3f2fd;
            color: #1976d2;
        }
        .show-status.live {
            background: #ffebee;
            color: #d32f2f;
        }
        .show-status.past {
            background: #f5f5f5;
            color: #757575;
        }
        .show-link {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #000;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            transition: background 0.2s;
        }
        .show-link:hover {
            background: #333;
        }
    </style>
</head>
<body>
    <div class="shows-container">
${shows.map(show => `        <div class="show-card">
            ${show.image ? `<img src="${show.image}" alt="${escapeHtml(show.title)}" class="show-image" onerror="this.style.display='none'">` : ''}
            <div class="show-content">
                <h3 class="show-title">${escapeHtml(show.title)}</h3>
                ${show.date ? `<div class="show-date">${escapeHtml(show.date)}</div>` : ''}
                ${show.status ? `<span class="show-status ${show.status}">${escapeHtml(show.status)}</span>` : ''}
                <a href="${show.url}" target="_blank" rel="noopener noreferrer" class="show-link">View Show</a>
            </div>
        </div>`).join('\n')}
    </div>
</body>
</html>`;
}

function generateLiquid(shows) {
  return `{% comment %}
  Whatnot Shows Section
  Add this to your Shopify theme as a section or include it in a page template
{% endcomment %}

<div class="whatnot-shows-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; padding: 2rem; max-width: 1200px; margin: 0 auto;">
  {% assign shows = ${JSON.stringify(shows)} | json %}
  {% for show in shows %}
    <div class="show-card" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: white;">
      {% if show.image %}
        <img src="{{ show.image }}" alt="{{ show.title | escape }}" style="width: 100%; height: 200px; object-fit: cover;">
      {% endif %}
      <div style="padding: 1.5rem;">
        <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem 0;">{{ show.title }}</h3>
        {% if show.date %}
          <div style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">{{ show.date }}</div>
        {% endif %}
        {% if show.status %}
          <span class="show-status show-status-{{ show.status }}" style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; margin-bottom: 1rem;">
            {{ show.status }}
          </span>
        {% endif %}
        <a href="{{ show.url }}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 0.75rem 1.5rem; background: #000; color: white; text-decoration: none; border-radius: 4px;">
          View Show
        </a>
      </div>
    </div>
  {% endfor %}
</div>

<style>
  .show-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .show-status-upcoming { background: #e3f2fd; color: #1976d2; }
  .show-status-live { background: #ffebee; color: #d32f2f; }
  .show-status-past { background: #f5f5f5; color: #757575; }
</style>`;
}

function generateMetafieldJSON(shows) {
  return {
    namespace: 'whatnot',
    key: 'shows',
    value: JSON.stringify(shows),
    type: 'json',
    description: 'Whatnot shows data scraped from user page'
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateShopifyContent();
}

export { generateShopifyContent };

