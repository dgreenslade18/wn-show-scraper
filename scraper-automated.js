import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - can be overridden via environment variables
const WHATNOT_USER_URL = process.env.WHATNOT_USER_URL || 'https://www.whatnot.com/en-GB/user/poke__queen_1';
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
  console.log('🚀 Starting automated Whatnot show scraper...');
  console.log(`📡 Target URL: ${WHATNOT_USER_URL}`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    timeout: 60000
  });

  try {
    const page = await browser.newPage();
    
    // Set realistic browser properties
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    console.log('⏳ Navigating to page...');
    await page.goto(WHATNOT_USER_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(8000); // Wait for dynamic content
    
    // Navigate to shows page if we're on user page
    const currentUrl = page.url();
    if (!currentUrl.includes('/shows')) {
      console.log('📍 Not on shows page, navigating to shows...');
      try {
        await page.goto(`${WHATNOT_USER_URL}/shows`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        await page.waitForTimeout(5000);
      } catch (e) {
        console.log('⚠️  Could not navigate to /shows, continuing with current page...');
      }
    }
    
    // Scroll to load more content if needed
    console.log('📜 Scrolling to load content...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    await page.waitForTimeout(2000);
    
    console.log('🔍 Extracting show data...');
    const shows = await page.evaluate(() => {
      const showElements = [];
      
      // Look for /live/ URLs (individual shows)
      const selectors = [
        'a[href*="/live/"]',
        '[data-testid*="live"] a',
        '[data-testid*="Live"] a',
        'article a[href*="/live/"]',
        '[class*="show"] a[href*="/live/"]',
        '[class*="live"] a[href*="/live/"]'
      ];
      
      let foundElements = [];
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          const filtered = Array.from(elements).filter(el => {
            const href = el.href || el.getAttribute('href') || '';
            return /\/live\/[^\/\?]+/.test(href);
          });
          if (filtered.length > 0) {
            foundElements = filtered;
            console.log(`Found ${filtered.length} shows with ${selector}`);
            break;
          }
        } catch (e) {}
      }
      
      // Fallback: get all links with /live/
      if (foundElements.length === 0) {
        const allLinks = Array.from(document.querySelectorAll('a'));
        foundElements = allLinks.filter(link => {
          const href = link.href || link.getAttribute('href') || '';
          return /\/live\/[^\/\?]+/.test(href);
        });
      }
      
      // Also try finding show cards
      if (foundElements.length === 0) {
        const showCards = Array.from(document.querySelectorAll('[class*="show"], [class*="Show"], [class*="live"], article'));
        showCards.forEach(card => {
          const link = card.querySelector('a[href*="/live/"]');
          if (link) {
            const href = link.href || link.getAttribute('href');
            if (href && /\/live\/[^\/\?]+/.test(href)) {
              foundElements.push(link);
            }
          }
        });
      }
      
      foundElements.forEach((element, index) => {
        try {
          const link = element.closest('a') || element;
          const href = link.href || link.getAttribute('href');
          
          if (!href || !/\/live\/[^\/\?]+/.test(href)) return;
          
          // Skip listing pages
          if (/\/shows$/.test(href) || /\/user\/[^\/]+\/shows/.test(href)) return;
          
          const card = link.closest('article, [class*="card"], [class*="Card"], [role="article"], [class*="item"]') || link.parentElement;
          
          const title = card.querySelector('h2, h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim() ||
                       link.textContent?.trim() ||
                       card.textContent?.trim().substring(0, 100) ||
                       `Show ${index + 1}`;
          
          const img = card.querySelector('img') || link.querySelector('img');
          const image = img?.src || img?.getAttribute('srcset')?.split(',')[0]?.trim() || null;
          
          const dateEl = card.querySelector('[class*="date"], [class*="time"], time, [datetime]');
          const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || null;
          
          const statusEl = card.querySelector('[class*="status"], [class*="badge"], [class*="label"]');
          const status = statusEl?.textContent?.trim()?.toLowerCase() || null;
          
          const showId = href.match(/\/live\/([^\/\?]+)/)?.[1] || `show-${index}`;
          
          if (title && href) {
            showElements.push({
              id: showId,
              title: title,
              url: href.startsWith('http') ? href : `https://www.whatnot.com${href}`,
              image: image,
              date: date,
              status: status,
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error processing element ${index}:`, error);
        }
      });
      
      return showElements;
    });

    // Remove duplicates
    const uniqueShows = shows.filter((show, index, self) =>
      index === self.findIndex(s => s.url === show.url)
    );

    console.log(`✅ Found ${uniqueShows.length} unique shows`);

    if (uniqueShows.length === 0) {
      console.log('⚠️  No shows found. The page structure might have changed.');
      // Still save empty array so the workflow doesn't fail
      await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2));
      return [];
    }

    // Save to JSON
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(uniqueShows, null, 2));
    console.log(`💾 Shows saved to ${OUTPUT_FILE}`);
    
    // Save to CSV
    const csvContent = convertToCSV(uniqueShows);
    await fs.writeFile(OUTPUT_CSV, csvContent);
    console.log(`💾 Shows saved to ${OUTPUT_CSV}`);
    
    // Display summary
    console.log('\n📋 Shows Summary:');
    uniqueShows.slice(0, 5).forEach((show, index) => {
      console.log(`${index + 1}. ${show.title}`);
      console.log(`   URL: ${show.url}`);
    });
    if (uniqueShows.length > 5) {
      console.log(`   ... and ${uniqueShows.length - 5} more`);
    }

    return uniqueShows;

  } catch (error) {
    console.error('❌ Error scraping shows:', error.message);
    // Save empty array on error so workflow doesn't completely fail
    await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2));
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeWhatnotShows()
  .then(() => {
    console.log('\n✨ Scraping completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Scraping failed:', error.message);
    process.exit(1);
  });

