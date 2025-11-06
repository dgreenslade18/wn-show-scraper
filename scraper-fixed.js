import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { existsSync } from 'fs';
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
  console.log('🚀 Starting Whatnot show scraper...');
  console.log(`📡 Fetching shows from: ${WHATNOT_USER_URL}`);
  
  let browser;
  
  try {
    // Try to find Chrome executable
    let executablePath;
    try {
      executablePath = puppeteer.executablePath();
      console.log(`🔧 Using Chrome at: ${executablePath}`);
    } catch (e) {
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

    // Launch browser with more robust settings
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Visible for debugging
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      ignoreHTTPSErrors: true,
      timeout: 90000
    });

    console.log('✅ Browser launched successfully');
    
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
    
    // Navigate with retry logic
    let navigationSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`   Attempt ${attempt}/3...`);
        await page.goto(WHATNOT_USER_URL, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        navigationSuccess = true;
        break;
      } catch (navError) {
        console.log(`   Attempt ${attempt} failed: ${navError.message}`);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!navigationSuccess) {
      throw new Error('Failed to navigate to page after 3 attempts');
    }

    console.log('✅ Page loaded');
    console.log(`📍 Current URL: ${page.url()}`);
    
    // Wait for content
    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(8000); // Give plenty of time for dynamic content
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: join(__dirname, 'page-screenshot.png'), fullPage: true });
    console.log('✅ Screenshot saved');
    
    // Extract show data using the browser console script
    console.log('🔍 Extracting show data...');
    const shows = await page.evaluate(() => {
      const showElements = [];
      
      // Try multiple selectors
      const selectors = [
        'a[href*="/show/"]',
        'a[href*="show"]',
        '[data-testid*="show"]',
        '[data-testid*="Show"]',
        '.show-card a',
        '[class*="show"] a',
        'article a'
      ];
      
      let foundElements = [];
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            foundElements = Array.from(elements);
            console.log(`Found ${elements.length} with ${selector}`);
            break;
          }
        } catch (e) {}
      }
      
      if (foundElements.length === 0) {
        const allLinks = Array.from(document.querySelectorAll('a'));
        foundElements = allLinks.filter(link => {
          const href = link.href || link.getAttribute('href') || '';
          return href.includes('show') || href.includes('Show');
        });
      }
      
      foundElements.forEach((element, index) => {
        try {
          const link = element.closest('a') || element;
          const href = link.href || link.getAttribute('href');
          
          if (!href || !href.includes('show')) return;
          
          const card = link.closest('article, [class*="card"], [class*="Card"], [role="article"]') || link.parentElement;
          
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
          
          const showId = href.match(/\/show\/([^\/\?]+)/)?.[1] || `show-${index}`;
          
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
      console.log('💡 Check page-screenshot.png to see what was loaded');
      
      // Get page info
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          linkCount: document.querySelectorAll('a').length,
          bodyText: document.body.innerText.substring(0, 500)
        };
      });
      
      console.log('\n📄 Page Info:');
      console.log(`Title: ${pageInfo.title}`);
      console.log(`URL: ${pageInfo.url}`);
      console.log(`Total links: ${pageInfo.linkCount}`);
      console.log(`\nBody text preview:\n${pageInfo.bodyText}`);
      
      await fs.writeFile(join(__dirname, 'debug-info.json'), JSON.stringify(pageInfo, null, 2));
      console.log('\n💾 Debug info saved to debug-info.json');
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

    // Keep browser open for a moment so user can see it
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

    return uniqueShows;

  } catch (error) {
    console.error('❌ Error scraping shows:', error.message);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Try to get page info even on error
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const page = pages[0];
          const url = page.url();
          console.log(`Current page URL: ${url}`);
          await page.screenshot({ path: join(__dirname, 'error-screenshot.png'), fullPage: true });
          console.log('📸 Error screenshot saved to error-screenshot.png');
        }
      } catch (screenshotError) {
        console.error('Could not take error screenshot:', screenshotError.message);
      }
    }
    
    throw error;
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
    }
  }
}

// Run the scraper
scrapeWhatnotShows()
  .then(() => {
    console.log('\n✨ Scraping completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Scraping failed!');
    console.error('\n💡 Alternative: Use the browser console script!');
    console.error('   1. Open scraper-browser-console.js');
    console.error('   2. Copy the script');
    console.error('   3. Paste it into your browser console on the Whatnot page');
    console.error('   4. It will extract the shows and let you download them\n');
    process.exit(1);
  });

