/**
 * Browser Console Script
 * 
 * Copy and paste this entire script into your browser's console when you're on your Whatnot user page.
 * It will extract all shows and display them in a format you can copy.
 * 
 * Instructions:
 * 1. Open your Whatnot user page: https://www.whatnot.com/en-GB/user/poke__queen_1
 * 2. Open browser console (F12 or Cmd+Option+I)
 * 3. Paste this entire script
 * 4. Press Enter
 * 5. Copy the JSON output that appears
 */

(function() {
  console.log('🔍 Starting show extraction...');
  
  const shows = [];
  
  // Try multiple selectors to find show links
  // Priority: look for /live/ with ID first (individual shows)
  const selectors = [
    'a[href*="/live/"]',  // Individual shows have /live/ID
    '[data-testid*="show"] a',
    '[data-testid*="Show"] a',
    '[data-testid*="live"] a',
    '[data-testid*="Live"] a',
    '.show-card a',
    '[class*="show-card"] a',
    '[class*="ShowCard"] a',
    '[class*="live-card"] a',
    'article a[href*="/live/"]',
    '[class*="show"] a[href*="/live/"]',
    '[class*="live"] a[href*="/live/"]'
  ];
  
  let foundElements = [];
  let usedSelector = null;
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    // Filter to only include actual show links (with /live/ID pattern)
    const filtered = Array.from(elements).filter(el => {
      const href = el.href || el.getAttribute('href') || '';
      return /\/live\/[^\/\?]+/.test(href);
    });
    if (filtered.length > 0) {
      foundElements = filtered;
      usedSelector = selector;
      console.log(`✅ Found ${filtered.length} individual show links with: ${selector}`);
      break;
    }
  }
  
  // If no specific elements, get all links and filter for actual show links
  if (foundElements.length === 0) {
    const allLinks = Array.from(document.querySelectorAll('a'));
    foundElements = allLinks.filter(link => {
      const href = link.href || link.getAttribute('href') || '';
      // Must have /live/ with an ID (not just /live or /shows)
      return /\/live\/[^\/\?]+/.test(href);
    });
    console.log(`Found ${foundElements.length} individual show links`);
  }
  
  // Also try to find show cards/containers directly
  if (foundElements.length === 0) {
    console.log('🔍 Trying alternative method: looking for show cards...');
    const showCards = Array.from(document.querySelectorAll('[class*="show"], [class*="Show"], [class*="live"], [class*="Live"], article, [role="article"]'));
    console.log(`Found ${showCards.length} potential show cards`);
    
    showCards.forEach(card => {
      const link = card.querySelector('a[href*="/live/"]');
      if (link) {
        const href = link.href || link.getAttribute('href');
        if (href && /\/live\/[^\/\?]+/.test(href)) {
          foundElements.push(link);
        }
      }
    });
    console.log(`Found ${foundElements.length} shows via card method`);
  }
  
  // Extract show data
  foundElements.forEach((element, index) => {
    try {
      const link = element.closest('a') || element;
      const href = link.href || link.getAttribute('href');
      
      if (!href) return;
      
      // Filter out the general "shows" listing page - we want individual shows only
      // Individual shows have URLs like: /live/ABC123 or /live/xyz-123
      // Listing pages have URLs like: /user/.../shows or /shows
      const isListingPage = /\/shows$/.test(href) || /\/user\/[^\/]+\/shows/.test(href);
      if (isListingPage) {
        console.log(`⏭️  Skipping listing page: ${href}`);
        return;
      }
      
      // We want URLs that have /live/ followed by an ID (not just /live or /shows)
      const hasLiveId = /\/live\/[^\/\?]+/.test(href);
      if (!hasLiveId) {
        console.log(`⏭️  Skipping non-show link: ${href}`);
        return;
      }
      
      // Find the card/container element
      const card = link.closest('article, [class*="card"], [class*="Card"], [role="article"], [class*="item"], [class*="Item"]') || link.parentElement;
      
      // Extract title
      const title = card.querySelector('h2, h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim() ||
                   link.textContent?.trim() ||
                   card.textContent?.trim().substring(0, 100) ||
                   `Show ${index + 1}`;
      
      // Extract image
      const img = card.querySelector('img') || link.querySelector('img');
      const image = img?.src || img?.getAttribute('srcset')?.split(',')[0]?.trim() || null;
      
      // Extract date
      const dateEl = card.querySelector('[class*="date"], [class*="time"], time, [datetime]');
      const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || null;
      
      // Extract status
      const statusEl = card.querySelector('[class*="status"], [class*="badge"], [class*="label"]');
      const status = statusEl?.textContent?.trim()?.toLowerCase() || null;
      
      // Get show ID from URL
      const showId = href.match(/\/live\/([^\/\?]+)/)?.[1] || `show-${index}`;
      
      if (title && href) {
        shows.push({
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
  
  // Remove duplicates
  const uniqueShows = shows.filter((show, index, self) =>
    index === self.findIndex(s => s.url === show.url)
  );
  
  if (uniqueShows.length === 0) {
    console.log(`\n⚠️  No individual shows found!\n`);
    console.log('💡 Tips:');
    console.log('   1. Make sure you\'re on a page that displays individual shows');
    console.log('   2. Try navigating to: https://www.whatnot.com/user/poke__queen_1/shows');
    console.log('   3. Scroll down to load all shows if they load dynamically');
    console.log('   4. Individual shows have URLs like: /live/ABC123');
    console.log('   5. The script looks for links with /live/ followed by an ID\n');
    return [];
  }
  
  console.log(`\n✅ Found ${uniqueShows.length} unique shows\n`);
  
  // Display results
  console.log('📋 Shows Summary:');
  uniqueShows.forEach((show, i) => {
    console.log(`${i + 1}. ${show.title}`);
    console.log(`   URL: ${show.url}`);
    if (show.date) console.log(`   Date: ${show.date}`);
    if (show.status) console.log(`   Status: ${show.status}`);
    console.log('');
  });
  
  // Create downloadable JSON
  const json = JSON.stringify(uniqueShows, null, 2);
  console.log('\n📄 JSON Output (copy this):');
  console.log('='.repeat(80));
  console.log(json);
  console.log('='.repeat(80));
  
  // Also create a downloadable link
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whatnot-shows.json';
  a.textContent = '⬇️ Download shows.json';
  a.style.cssText = 'display: block; padding: 10px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; font-family: monospace;';
  document.body.appendChild(a);
  
  // Copy to clipboard button
  const copyBtn = document.createElement('button');
  copyBtn.textContent = '📋 Copy JSON to Clipboard';
  copyBtn.style.cssText = 'display: block; padding: 10px; background: #2196F3; color: white; border: none; border-radius: 4px; margin: 10px 0; cursor: pointer; font-family: monospace;';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(json).then(() => {
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy JSON to Clipboard';
      }, 2000);
    });
  };
  document.body.appendChild(copyBtn);
  
  return uniqueShows;
})();

