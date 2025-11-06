import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
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
  console.log('🚀 Starting stealth Whatnot show scraper...');
  console.log(`📡 Target URL: ${WHATNOT_USER_URL}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],
    timeout: 60000
  });

  try {
    const page = await browser.newPage();
    
    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('⏳ Navigating to page...');
    await page.goto(WHATNOT_USER_URL, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Check for Cloudflare
    const pageTitle = await page.title();
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    if (pageTitle.includes('Just a moment') || 
        pageContent.includes('Verifying you are human') ||
        pageContent.includes('Cloudflare')) {
      console.log('⏳ Cloudflare detected, waiting for challenge to complete...');
      await page.waitForTimeout(15000); // Wait for Cloudflare
      
      // Check again
      const newTitle = await page.title();
      if (newTitle.includes('Just a moment')) {
        throw new Error('Cloudflare challenge not passed. Consider using manual browser console script.');
      }
    }

    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(10000);
    
    // Scroll to load content
    console.log('📜 Scrolling to load content...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let lastHeight = document.body.scrollHeight;
        const timer = setInterval(() => {
          window.scrollBy(0, 500);
          const newHeight = document.body.scrollHeight;
          if (newHeight === lastHeight) {
            clearInterval(timer);
            resolve();
          }
          lastHeight = newHeight;
        }, 200);
        setTimeout(() => {
          clearInterval(timer);
          resolve();
        }, 10000);
      });
    });
    
    await page.waitForTimeout(3000);
    
    console.log('🔍 Extracting show data...');
    const shows = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      const liveLinks = allLinks.filter(link => {
        const href = link.href || link.getAttribute('href') || '';
        return /\/live\/[^\/\?]+/.test(href);
      });
      
      return liveLinks.map((link, index) => {
        const href = link.href || link.getAttribute('href');
        const card = link.closest('article, [class*="card"], [role="article"]') || link.parentElement;
        const title = card.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim() ||
                     link.textContent?.trim() ||
                     `Show ${index + 1}`;
        const img = card.querySelector('img');
        const image = img?.src || null;
        const dateEl = card.querySelector('[class*="date"], time');
        const date = dateEl?.textContent?.trim() || null;
        const statusEl = card.querySelector('[class*="status"]');
        const status = statusEl?.textContent?.trim()?.toLowerCase() || null;
        const showId = href.match(/\/live\/([^\/\?]+)/)?.[1] || `show-${index}`;
        
        return {
          id: showId,
          title: title,
          url: href.startsWith('http') ? href : `https://www.whatnot.com${href}`,
          image: image,
          date: date,
          status: status,
          scrapedAt: new Date().toISOString()
        };
      });
    });

    // Remove duplicates
    const uniqueShows = shows.filter((show, index, self) =>
      index === self.findIndex(s => s.url === show.url)
    );

    console.log(`✅ Found ${uniqueShows.length} unique shows`);

    if (uniqueShows.length === 0) {
      await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2));
      return [];
    }

    // Save files
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(uniqueShows, null, 2));
    console.log(`💾 Shows saved to ${OUTPUT_FILE}`);
    
    const csvContent = convertToCSV(uniqueShows);
    await fs.writeFile(OUTPUT_CSV, csvContent);
    console.log(`💾 Shows saved to ${OUTPUT_CSV}`);

    return uniqueShows;

  } catch (error) {
    console.error('❌ Error:', error.message);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2));
    return [];
  } finally {
    await browser.close();
  }
}

scrapeWhatnotShows()
  .then(() => {
    console.log('✨ Scraping completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error.message);
    process.exit(0);
  });

