import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WHATNOT_USER_URL = 'https://www.whatnot.com/en-GB/user/poke__queen_1?srsltid=AfmBOoqQcvydElSx6vNig-JzPdTmHHta18Mpny0sM_BteSyuqaXKskrj';
const OUTPUT_FILE = join(__dirname, 'shows.json');
const OUTPUT_CSV = join(__dirname, 'shows.csv');

// Helper function to convert JSON to CSV
function convertToCSV(shows) {
  if (shows.length === 0) return '';
  
  const headers = Object.keys(shows[0]);
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  for (const show of shows) {
    const values = headers.map(header => {
      const value = show[header] || '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

async function scrapeWhatnotShows() {
  console.log('🚀 Starting Whatnot show scraper (simple HTTP method)...');
  console.log(`📡 Fetching shows from: ${WHATNOT_USER_URL}`);
  
  try {
    console.log('⏳ Fetching page...');
    
    const response = await axios.get(WHATNOT_USER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });

    console.log(`✅ Page loaded (${response.status})`);
    console.log('⏳ Parsing HTML...');

    const $ = cheerio.load(response.data);
    
    // Save HTML for debugging
    await fs.writeFile(join(__dirname, 'page-html.html'), response.data);
    console.log('💾 HTML saved to page-html.html for debugging');

    const shows = [];
    
    // Try multiple selectors
    const selectors = [
      'a[href*="/show/"]',
      'a[href*="show"]',
      '[data-testid*="show"]',
      '[data-testid*="Show"]',
      '.show-card',
      '[class*="show"]',
      '[class*="Show"]',
      'article',
      '[role="article"]'
    ];

    let foundElements = [];
    let usedSelector = null;

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        foundElements = elements;
        usedSelector = selector;
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
        break;
      }
    }

    // If no specific elements, get all links with "show" in href
    if (foundElements.length === 0) {
      foundElements = $('a[href*="show"]');
      console.log(`Found ${foundElements.length} links containing "show"`);
    }

    foundElements.each((index, element) => {
      try {
        const $el = $(element);
        const href = $el.attr('href') || $el.find('a').attr('href') || '';
        
        if (!href || !href.includes('show')) return;

        const fullUrl = href.startsWith('http') ? href : `https://www.whatnot.com${href}`;
        
        // Try to find title
        const title = $el.find('h2, h3, [class*="title"], [class*="name"]').first().text().trim() ||
                     $el.text().trim().substring(0, 100) ||
                     `Show ${index + 1}`;

        // Try to find image
        const image = $el.find('img').first().attr('src') || 
                     $el.find('img').first().attr('data-src') ||
                     null;

        // Try to find date
        const date = $el.find('[class*="date"], [class*="time"], time').first().text().trim() ||
                    $el.find('time').first().attr('datetime') ||
                    null;

        // Try to find status
        const status = $el.find('[class*="status"], [class*="badge"]').first().text().trim().toLowerCase() || null;

        if (title && fullUrl) {
          shows.push({
            id: fullUrl.split('/show/')[1]?.split('?')[0]?.split('/')[0] || `show-${index}`,
            title: title,
            url: fullUrl,
            image: image,
            date: date,
            status: status,
            scrapedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error processing element ${index}:`, error.message);
      }
    });

    // Remove duplicates
    const uniqueShows = shows.filter((show, index, self) =>
      index === self.findIndex(s => s.url === show.url)
    );

    console.log(`✅ Found ${uniqueShows.length} unique shows`);

    if (uniqueShows.length === 0) {
      console.log('⚠️  No shows found in static HTML.');
      console.log('💡 The page might be dynamically loaded with JavaScript.');
      console.log('💡 Check page-html.html to see what was actually loaded.');
      console.log('\n📄 Page Info:');
      console.log(`Title: ${$('title').text()}`);
      console.log(`Total links: ${$('a').length}`);
      
      // Show first 20 links
      console.log('\n🔗 First 20 links:');
      $('a').slice(0, 20).each((i, el) => {
        const $a = $(el);
        console.log(`${i + 1}. ${$a.text().trim().substring(0, 50) || '(no text)'} -> ${$a.attr('href')}`);
      });
    } else {
      // Save to JSON
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(uniqueShows, null, 2));
      console.log(`💾 Shows saved to ${OUTPUT_FILE}`);
      
      // Save to CSV
      const csvContent = convertToCSV(uniqueShows);
      await fs.writeFile(OUTPUT_CSV, csvContent);
      console.log(`💾 Shows saved to ${OUTPUT_CSV}`);
      
      // Display summary
      console.log('\n📋 Shows Summary:');
      uniqueShows.forEach((show, index) => {
        console.log(`${index + 1}. ${show.title}`);
        console.log(`   URL: ${show.url}`);
        if (show.date) console.log(`   Date: ${show.date}`);
        if (show.status) console.log(`   Status: ${show.status}`);
        console.log('');
      });
    }

    return uniqueShows;

  } catch (error) {
    console.error('❌ Error scraping shows:', error.message);
    
    if (error.response) {
      console.error(`HTTP Status: ${error.response.status}`);
      console.error(`URL: ${error.response.config.url}`);
    }
    
    throw error;
  }
}

// Run the scraper
scrapeWhatnotShows()
  .then(() => {
    console.log('✨ Scraping completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error.message);
    console.log('\n💡 If this fails, the page likely requires JavaScript. Try using the Puppeteer version.');
    process.exit(1);
  });

