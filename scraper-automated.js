import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - can be overridden via environment variables
const WHATNOT_USER_URL = process.env.WHATNOT_USER_URL || 'https://www.whatnot.com/en-GB/user/poke__queen_1/shows';
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
    
    // Verify we're on the shows page
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // If not on shows page, navigate there
    if (!currentUrl.includes('/shows')) {
      console.log('📍 Not on shows page, navigating to shows...');
      try {
        const showsUrl = WHATNOT_USER_URL.endsWith('/shows') 
          ? WHATNOT_USER_URL 
          : `${WHATNOT_USER_URL}/shows`;
        console.log(`🔗 Navigating to: ${showsUrl}`);
        await page.goto(showsUrl, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });
        await page.waitForTimeout(5000);
        console.log(`✅ Now on: ${page.url()}`);
      } catch (e) {
        console.log(`⚠️  Could not navigate to /shows: ${e.message}`);
        console.log('⚠️  Continuing with current page...');
      }
    } else {
      console.log('✅ Already on shows page');
    }
    
    // Wait for any content to load
    console.log('⏳ Waiting for page content...');
    try {
      // Try to wait for common elements that indicate content loaded
      await Promise.race([
        page.waitForSelector('a[href*="/live/"]', { timeout: 10000 }).catch(() => null),
        page.waitForSelector('article', { timeout: 10000 }).catch(() => null),
        page.waitForSelector('[class*="card"]', { timeout: 10000 }).catch(() => null),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
    } catch (e) {
      console.log('⚠️  Selector wait timed out, continuing...');
    }
    
    // Scroll to load more content if needed
    console.log('📜 Scrolling to load content...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        let lastHeight = document.body.scrollHeight;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          const newHeight = document.body.scrollHeight;

          // If height didn't change, we've reached the bottom
          if (newHeight === lastHeight && totalHeight > 500) {
            clearInterval(timer);
            resolve();
          }
          lastHeight = newHeight;
        }, 100);
        
        // Max scroll time
        setTimeout(() => {
          clearInterval(timer);
          resolve();
        }, 10000);
      });
    });
    
    await page.waitForTimeout(3000);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: join(__dirname, 'debug-screenshot.png'), fullPage: true });
      console.log('📸 Debug screenshot saved');
    } catch (e) {
      console.log('⚠️  Could not save screenshot');
    }
    
    console.log('🔍 Extracting show data...');
    const shows = await page.evaluate(() => {
      const showElements = [];
      
      // Debug: Log page info
      console.log('Page title:', document.title);
      console.log('Page URL:', window.location.href);
      console.log('Total links:', document.querySelectorAll('a').length);
      
      // Look for /live/ URLs (individual shows)
      const selectors = [
        'a[href*="/live/"]',
        '[data-testid*="live"] a',
        '[data-testid*="Live"] a',
        'article a[href*="/live/"]',
        '[class*="show"] a[href*="/live/"]',
        '[class*="live"] a[href*="/live/"]',
        'a[href*="live"]' // Broader match
      ];
      
      let foundElements = [];
      let debugInfo = {
        allLinks: 0,
        liveLinks: 0,
        selectorsTried: []
      };
      
      // First, get all links for debugging
      const allLinks = Array.from(document.querySelectorAll('a'));
      debugInfo.allLinks = allLinks.length;
      
      // Filter for /live/ links
      const liveLinks = allLinks.filter(link => {
        const href = link.href || link.getAttribute('href') || '';
        return /\/live\/[^\/\?]+/.test(href);
      });
      debugInfo.liveLinks = liveLinks.length;
      
      console.log(`Found ${liveLinks.length} links with /live/ pattern`);
      
      // Try selectors
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          const filtered = Array.from(elements).filter(el => {
            const href = el.href || el.getAttribute('href') || '';
            return /\/live\/[^\/\?]+/.test(href);
          });
          debugInfo.selectorsTried.push({ selector, found: elements.length, filtered: filtered.length });
          if (filtered.length > 0) {
            foundElements = filtered;
            console.log(`✅ Found ${filtered.length} shows with ${selector}`);
            break;
          }
        } catch (e) {
          debugInfo.selectorsTried.push({ selector, error: e.message });
        }
      }
      
      // Fallback: use the liveLinks we found
      if (foundElements.length === 0 && liveLinks.length > 0) {
        foundElements = liveLinks;
        console.log(`Using ${liveLinks.length} live links found via broad search`);
      }
      
      // Also try finding show cards
      if (foundElements.length === 0) {
        console.log('Trying card-based approach...');
        const showCards = Array.from(document.querySelectorAll('[class*="show"], [class*="Show"], [class*="live"], [class*="Live"], article, [role="article"]'));
        console.log(`Found ${showCards.length} potential cards`);
        showCards.forEach(card => {
          const link = card.querySelector('a[href*="/live/"]') || card.querySelector('a[href*="live"]');
          if (link) {
            const href = link.href || link.getAttribute('href');
            if (href && /\/live\/[^\/\?]+/.test(href)) {
              foundElements.push(link);
            }
          }
        });
        console.log(`Found ${foundElements.length} shows via card method`);
      }
      
      // Log debug info
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
      
      // If still nothing, log some sample links for debugging
      if (foundElements.length === 0) {
        console.log('No shows found. Sample links on page:');
        allLinks.slice(0, 20).forEach((link, i) => {
          const href = link.href || link.getAttribute('href') || '';
          const text = link.textContent.trim().substring(0, 50);
          console.log(`${i + 1}. ${text} -> ${href}`);
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
      console.log('💡 Debugging info:');
      console.log(`   - Current URL: ${page.url()}`);
      console.log(`   - Page title: ${await page.title()}`);
      
      // Get page content info
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          linkCount: document.querySelectorAll('a').length,
          liveLinkCount: Array.from(document.querySelectorAll('a')).filter(a => {
            const href = a.href || a.getAttribute('href') || '';
            return /\/live\//.test(href);
          }).length,
          bodyText: document.body.innerText.substring(0, 500)
        };
      });
      
      console.log(`   - Total links: ${pageInfo.linkCount}`);
      console.log(`   - Links with /live/: ${pageInfo.liveLinkCount}`);
      console.log(`   - Body text preview: ${pageInfo.bodyText.substring(0, 200)}...`);
      
      // Still save empty array so the workflow doesn't fail
      await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2));
      console.log('💾 Saved empty shows.json (workflow will not fail)');
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

