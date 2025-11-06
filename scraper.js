import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to convert JSON to CSV
function convertToCSV(shows) {
  if (shows.length === 0) return '';
  
  const headers = Object.keys(shows[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const show of shows) {
    const values = headers.map(header => {
      const value = show[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Configuration
const WHATNOT_USER_URL = 'https://www.whatnot.com/en-GB/user/poke__queen_1?srsltid=AfmBOoqQcvydElSx6vNig-JzPdTmHHta18Mpny0sM_BteSyuqaXKskrj';
const OUTPUT_FILE = join(__dirname, 'shows.json');
const OUTPUT_CSV = join(__dirname, 'shows.csv');

async function scrapeWhatnotShows() {
  console.log('🚀 Starting Whatnot show scraper...');
  console.log(`📡 Fetching shows from: ${WHATNOT_USER_URL}`);
  
  // Try to find Chrome executable
  let executablePath;
  try {
    executablePath = puppeteer.executablePath();
    console.log(`🔧 Using Chrome at: ${executablePath}`);
  } catch (e) {
    // Use system Chrome if available
    const possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        executablePath = path;
        console.log(`🔧 Using system Chrome at: ${executablePath}`);
        break;
      }
    }
  }

  // Try headless: false first for debugging, then switch back to 'new' if it works
  const browser = await puppeteer.launch({
    headless: false, // Set to 'new' or true after confirming it works
    executablePath: executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ],
    timeout: 60000
  });

  try {
    const page = await browser.newPage();
    
    // Set a realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    console.log('⏳ Loading page...');
    
    try {
      await page.goto(WHATNOT_USER_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } catch (navError) {
      console.log('⚠️  Initial navigation had issues, trying alternative approach...');
      // Try again with a simpler wait strategy
      await page.goto(WHATNOT_USER_URL, {
        waitUntil: 'load',
        timeout: 60000
      });
    }

    // Wait for page to stabilize
    console.log('⏳ Waiting for page content to load...');
    await page.waitForTimeout(5000); // Give more time for dynamic content
    
    // Try to wait for any content that might indicate the page loaded
    try {
      await page.waitForSelector('body', { timeout: 10000 });
    } catch (e) {
      console.log('⚠️  Body selector wait timed out, continuing anyway...');
    }

    // Get current URL to see if we were redirected
    const currentUrl = page.url();
    console.log(`📍 Current page URL: ${currentUrl}`);
    
    // Take a screenshot for debugging
    console.log('📸 Taking screenshot for analysis...');
    await page.screenshot({ path: join(__dirname, 'page-screenshot.png'), fullPage: true });
    console.log('✅ Screenshot saved to page-screenshot.png');
    
    // Extract show data
    const shows = await page.evaluate(() => {
      const showElements = [];
      
      // Log page title and some basic info for debugging
      console.log('Page title:', document.title);
      console.log('All links count:', document.querySelectorAll('a').length);
      
      // Try multiple possible selectors for show cards
      const selectors = [
        'a[href*="/show/"]',
        'a[href*="show"]',
        '[data-testid*="show"]',
        '[data-testid*="Show"]',
        '.show-card',
        '[class*="show"]',
        '[class*="Show"]',
        'article',
        '[role="article"]',
        '[class*="card"]',
        '[class*="Card"]'
      ];

      let elements = [];
      let foundSelector = null;
      
      for (const selector of selectors) {
        try {
          const found = Array.from(document.querySelectorAll(selector));
          if (found.length > 0) {
            elements = found;
            foundSelector = selector;
            console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // If still no elements, get all links and filter for show-related ones
      if (elements.length === 0) {
        const allLinks = Array.from(document.querySelectorAll('a'));
        elements = allLinks.filter(link => {
          const href = link.href || link.getAttribute('href') || '';
          return href.includes('show') || href.includes('Show');
        });
        console.log(`Found ${elements.length} show-related links`);
      }
      
      // Also try to get page HTML structure info
      const bodyText = document.body.innerText.substring(0, 500);
      console.log('Page content preview:', bodyText);

      elements.forEach((element, index) => {
        try {
          const link = element.closest('a') || element;
          const href = link.href || link.getAttribute('href');
          
          if (!href || !href.includes('show')) return;

          // Try to extract show information
          const title = element.querySelector('h2, h3, [class*="title"], [class*="name"]')?.textContent?.trim() ||
                       element.textContent?.trim() ||
                       `Show ${index + 1}`;

          const image = element.querySelector('img')?.src || 
                       element.querySelector('img')?.getAttribute('srcset')?.split(',')[0]?.trim() ||
                       null;

          // Try to extract date/time if available
          const dateElement = element.querySelector('[class*="date"], [class*="time"], time');
          const date = dateElement?.textContent?.trim() || 
                      dateElement?.getAttribute('datetime') ||
                      null;

          // Try to extract status (upcoming, live, past)
          const statusElement = element.querySelector('[class*="status"], [class*="badge"]');
          const status = statusElement?.textContent?.trim()?.toLowerCase() || null;

          if (title && href) {
            showElements.push({
              id: href.split('/show/')[1]?.split('?')[0] || `show-${index}`,
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

    // Remove duplicates based on URL
    const uniqueShows = shows.filter((show, index, self) =>
      index === self.findIndex(s => s.url === show.url)
    );

    console.log(`✅ Found ${uniqueShows.length} unique shows`);

    if (uniqueShows.length === 0) {
      console.log('⚠️  No shows found. The page structure might have changed.');
      console.log('💡 Checking page content...');
      
      // Get page HTML snippet for debugging
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 1000),
          linkCount: document.querySelectorAll('a').length,
          allLinks: Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => ({
            text: a.textContent.trim().substring(0, 50),
            href: a.href || a.getAttribute('href')
          }))
        };
      });
      
      console.log('\n📄 Page Info:');
      console.log(`Title: ${pageContent.title}`);
      console.log(`URL: ${pageContent.url}`);
      console.log(`Total links: ${pageContent.linkCount}`);
      console.log('\n🔗 First 20 links found:');
      pageContent.allLinks.forEach((link, i) => {
        console.log(`${i + 1}. ${link.text || '(no text)'} -> ${link.href}`);
      });
      
      // Save debug info
      await fs.writeFile(join(__dirname, 'debug-info.json'), JSON.stringify(pageContent, null, 2));
      console.log('\n💾 Debug info saved to debug-info.json');
    } else {
      // Save to JSON file
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(uniqueShows, null, 2));
      console.log(`💾 Shows saved to ${OUTPUT_FILE}`);
      
      // Save to CSV file
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
    console.error('Stack:', error.stack);
    
    // Try to take a screenshot even on error (if browser is still open)
    try {
      if (browser && browser.isConnected()) {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ path: join(__dirname, 'error-screenshot.png'), fullPage: true });
          console.log('📸 Error screenshot saved to error-screenshot.png');
        }
      }
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
scrapeWhatnotShows()
  .then(() => {
    console.log('✨ Scraping completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });

