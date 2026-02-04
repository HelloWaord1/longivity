/**
 * Web Monitor Agent
 * Fetches RSS feeds from longevity blogs, news sites, and newsletters.
 * Extracts articles, filters for relevance, deduplicates, and saves to KB.
 * 
 * No external dependencies — uses native fetch() + regex XML parsing.
 * Designed to run as OpenClaw cron job (every 4-6 hours)
 */

import { KnowledgeBase } from '../kb/store.js';

// ─── RSS Feed Sources ───────────────────────────────────────────────────────

const RSS_FEEDS = [
  // News & Blogs
  { name: 'Longevity.Technology', url: 'https://longevity.technology/feed/', category: 'news' },
  { name: 'Life Extension Advocacy Foundation', url: 'https://www.lifespan.io/feed/', category: 'news' },
  { name: 'Fight Aging!', url: 'https://www.fightaging.org/feed/', category: 'news' },
  { name: 'Aging Research Blog', url: 'https://joshmitteldorf.scienceblog.com/feed/', category: 'research' },

  // Researchers & KOLs
  { name: 'Peter Attia', url: 'https://peterattiamd.com/feed/', category: 'protocols' },
  { name: 'Rhonda Patrick', url: 'https://www.foundmyfitness.com/feed', category: 'research' },

  // Supplement/Biohacking
  { name: 'Examine.com', url: 'https://examine.com/feed/', category: 'supplements' },
  { name: 'Healthline Nutrition', url: 'https://www.healthline.com/rss/nutrition', category: 'news' },

  // Science News
  { name: 'Nature Aging', url: 'https://www.nature.com/nataging.rss', category: 'research' },
  { name: 'Science Daily - Aging', url: 'https://www.sciencedaily.com/rss/health_medicine/healthy_aging.xml', category: 'research' },
  { name: 'Medical News Today - Nutrition', url: 'https://www.medicalnewstoday.com/rss/nutrition', category: 'news' },
];

// ─── Longevity Keywords ─────────────────────────────────────────────────────

const LONGEVITY_KEYWORDS = [
  // Core longevity terms
  'longevity', 'lifespan', 'healthspan', 'aging', 'ageing', 'anti-aging', 'anti-ageing',
  'life extension', 'geroprotect', 'geroscience',

  // Supplements & compounds
  'nad+', 'nad', 'nmn', 'nicotinamide mononucleotide', 'nicotinamide riboside',
  'resveratrol', 'spermidine', 'rapamycin', 'metformin', 'berberine',
  'fisetin', 'quercetin', 'dasatinib', 'urolithin', 'taurine',
  'coq10', 'ubiquinol', 'pqq', 'apigenin', 'sulforaphane',
  'omega-3', 'fish oil', 'epa', 'dha', 'curcumin',
  'alpha-ketoglutarate', 'akg', 'glycine', 'collagen',
  'vitamin d', 'magnesium', 'zinc', 'selenium',

  // Biological mechanisms
  'senolytic', 'senescence', 'senescent', 'senotherap',
  'autophagy', 'mitophagy', 'mtor', 'ampk', 'sirtuin',
  'telomere', 'telomerase', 'epigenetic', 'methylation',
  'mitochondri', 'oxidative stress', 'ferroptosis',
  'stem cell', 'cellular reprogramming', 'yamanaka',
  'caloric restriction', 'intermittent fasting', 'time-restricted eating',
  'dna repair', 'proteostasis', 'inflammaging', 'immunosenescence',

  // Clinical & research terms
  'biological age', 'epigenetic clock', 'horvath', 'pace of aging',
  'clinical trial', 'biomarker', 'blood test', 'wearable',
  'sarcopenia', 'osteoporosis', 'neurodegeneration', 'alzheimer',
  'cardiovascular', 'metabolic syndrome', 'insulin sensitivity',
  'gut microbiome', 'akkermansia', 'probiotic',
  'blue zone', 'centenarian',

  // Biohacking
  'biohack', 'nootropic', 'peptide', 'growth hormone', 'testosterone',
  'red light therapy', 'photobiomodulation', 'cold exposure', 'sauna',
  'hyperbaric oxygen', 'hbot',
];

// ─── Product Mapping ────────────────────────────────────────────────────────

const KEYWORD_PRODUCT_MAP = {
  'nad+': ['nmn', 'nicotinamide-riboside', 'niacin-vitamin-b3-'],
  'nad': ['nmn', 'nicotinamide-riboside', 'niacin-vitamin-b3-'],
  'nmn': ['nmn'],
  'nicotinamide mononucleotide': ['nmn'],
  'nicotinamide riboside': ['nicotinamide-riboside'],
  'resveratrol': ['resveratrol'],
  'spermidine': ['spermidine'],
  'rapamycin': ['rapamycin'],
  'metformin': ['metformin'],
  'berberine': ['berberine'],
  'fisetin': ['fisetin'],
  'quercetin': ['quercetin'],
  'senolytic': ['fisetin', 'quercetin'],
  'urolithin': ['urolithin-a'],
  'mitophagy': ['urolithin-a'],
  'taurine': ['taurine'],
  'coq10': ['coq10-ubiquinol'],
  'ubiquinol': ['coq10-ubiquinol'],
  'omega-3': ['omega-3-fish-oil'],
  'fish oil': ['omega-3-fish-oil'],
  'epa': ['omega-3-fish-oil'],
  'dha': ['omega-3-fish-oil'],
  'vitamin d': ['vitamin-d3-k2'],
  'magnesium': ['magnesium'],
  'apigenin': ['apigenin'],
  'sulforaphane': ['sulforaphane'],
  'curcumin': ['curcumin'],
  'collagen': ['collagen'],
  'glycine': ['glycine'],
  'alpha-ketoglutarate': ['alpha-ketoglutarate'],
  'akg': ['alpha-ketoglutarate'],
  'autophagy': ['spermidine', 'rapamycin'],
  'mtor': ['rapamycin'],
  'ampk': ['berberine', 'metformin'],
  'sirtuin': ['nmn', 'nicotinamide-riboside', 'resveratrol'],
};

// ─── RSS Parsing (no dependencies) ──────────────────────────────────────────

function parseRSS(xml) {
  const items = [];

  // Try <item> (RSS 2.0 + RDF/RSS 1.0) and <entry> (Atom) patterns
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;

  let match;

  // RSS 2.0 items
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    items.push({
      title: extractTag(content, 'title'),
      link: extractLink(content),
      description: extractTag(content, 'description') || extractTag(content, 'content:encoded'),
      pubDate: extractTag(content, 'pubDate') || extractTag(content, 'dc:date'),
      author: extractTag(content, 'dc:creator') || extractTag(content, 'author'),
    });
  }

  // Atom entries (if no RSS items found)
  if (items.length === 0) {
    while ((match = entryRegex.exec(xml)) !== null) {
      const content = match[1];
      const linkMatch = content.match(/<link[^>]*href="([^"]*)"[^>]*\/?\s*>/i);
      items.push({
        title: extractTag(content, 'title'),
        link: linkMatch ? linkMatch[1] : extractTag(content, 'link'),
        description: extractTag(content, 'summary') || extractTag(content, 'content'),
        pubDate: extractTag(content, 'published') || extractTag(content, 'updated'),
        author: extractAtomAuthor(content),
      });
    }
  }

  return items;
}

function extractTag(xml, tag) {
  // Handle namespaced tags (dc:creator, content:encoded)
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<${escapedTag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${escapedTag}>`,
    'i'
  );
  const m = xml.match(re);
  if (!m) return '';
  return m[1]
    .trim()
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#\d+;/g, '') // catch remaining numeric entities
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLink(xml) {
  // First try <link> tag content
  const tagLink = extractTag(xml, 'link');
  if (tagLink && tagLink.startsWith('http')) return tagLink;

  // Try <link> with no content (self-closing or empty) — get from after the tag
  // Sometimes RSS has <link>URL</link> but URL is on next line
  const linkMatch = xml.match(/<link[^>]*>\s*(https?:\/\/[^\s<]+)/i);
  if (linkMatch) return linkMatch[1].trim();

  // Try href attribute
  const hrefMatch = xml.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/i);
  if (hrefMatch) return hrefMatch[1];

  return '';
}

function extractAtomAuthor(xml) {
  const authorMatch = xml.match(/<author>[\s\S]*?<name>([^<]*)<\/name>[\s\S]*?<\/author>/i);
  return authorMatch ? authorMatch[1].trim() : '';
}

// ─── Relevance Scoring ──────────────────────────────────────────────────────

function calculateRelevance(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const matchedKeywords = [];

  // Short keywords that need word-boundary matching to avoid false positives
  const needsBoundary = new Set(['nad', 'nmn', 'epa', 'dha', 'pqq', 'akg', 'hbot', 'nr']);

  for (const keyword of LONGEVITY_KEYWORDS) {
    const kw = keyword.toLowerCase();
    if (needsBoundary.has(kw)) {
      // Use word boundary matching for short terms
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(text)) {
        matchedKeywords.push(keyword);
      }
    } else if (text.includes(kw)) {
      matchedKeywords.push(keyword);
    }
  }

  // Score: based on number & quality of keyword matches
  let score = 0;
  if (matchedKeywords.length === 0) return { score: 0, matchedKeywords: [], relatedProducts: [] };

  // Base score from keyword count
  score = Math.min(matchedKeywords.length / 5, 1.0);

  // Boost for title matches (more relevant)
  const titleLower = title.toLowerCase();
  const titleMatches = matchedKeywords.filter(kw => titleLower.includes(kw.toLowerCase()));
  score += titleMatches.length * 0.1;

  // Cap at 1.0
  score = Math.min(Math.round(score * 100) / 100, 1.0);

  // Find related products
  const relatedProducts = new Set();
  for (const kw of matchedKeywords) {
    const products = KEYWORD_PRODUCT_MAP[kw.toLowerCase()];
    if (products) {
      products.forEach(p => relatedProducts.add(p));
    }
  }

  return {
    score,
    matchedKeywords: [...new Set(matchedKeywords)],
    relatedProducts: [...relatedProducts],
  };
}

// ─── Slug Generator ─────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

// ─── Clean Description ──────────────────────────────────────────────────────

function cleanDescription(desc) {
  if (!desc) return '';
  return desc
    .replace(/<[^>]+>/g, '')     // strip HTML
    .replace(/\s+/g, ' ')        // normalize whitespace
    .replace(/&nbsp;/g, ' ')
    .trim()
    .slice(0, 1000);             // cap length
}

// ─── Main Web Monitor ───────────────────────────────────────────────────────

export class WebMonitor {
  constructor() {
    this.kb = new KnowledgeBase();
  }

  async init() {
    await this.kb.init();
  }

  /**
   * Fetch a single RSS feed with timeout and error handling
   */
  async fetchFeed(feed) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(feed.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Longivity-WebMonitor/1.0 (longevity research aggregator)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`  ✗ ${feed.name}: HTTP ${response.status}`);
        return [];
      }

      const xml = await response.text();
      const items = parseRSS(xml);

      // Limit to most recent 50 items per feed to avoid massive archives
      const limited = items.slice(0, 50);
      console.log(`  ✓ ${feed.name}: ${limited.length} items${items.length > 50 ? ` (limited from ${items.length})` : ''}`);
      return limited.map(item => ({ ...item, source: feed.name, category: feed.category }));
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'timeout' : err.message;
      console.error(`  ✗ ${feed.name}: ${msg}`);
      return [];
    }
  }

  /**
   * Process raw RSS items into article objects
   */
  processItems(rawItems) {
    const articles = [];

    for (const item of rawItems) {
      if (!item.title || !item.link) continue;

      const cleanDesc = cleanDescription(item.description);
      const { score, matchedKeywords, relatedProducts } = calculateRelevance(item.title, cleanDesc);

      // Skip items with no relevance
      if (score === 0) continue;

      const id = slugify(item.title);
      if (!id) continue;

      // Parse publish date
      let publishedAt = null;
      if (item.pubDate) {
        try {
          publishedAt = new Date(item.pubDate).toISOString();
        } catch {
          publishedAt = null;
        }
      }

      articles.push({
        id,
        title: item.title.slice(0, 300),
        summary: cleanDesc || 'No description available.',
        url: item.link,
        source: item.source,
        author: item.author || null,
        category: item.category,
        publishedAt: publishedAt || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        relevanceScore: score,
        matchedKeywords,
        relatedProducts,
        type: 'web', // distinguish from generated articles
      });
    }

    return articles;
  }

  /**
   * Run the full monitoring cycle
   */
  async run() {
    console.log('🌐 Longivity Web Monitor');
    console.log('━'.repeat(50));
    console.log(`\n📡 Fetching ${RSS_FEEDS.length} RSS feeds...\n`);

    const allRawItems = [];
    let feedsSucceeded = 0;
    let feedsFailed = 0;

    for (const feed of RSS_FEEDS) {
      const items = await this.fetchFeed(feed);
      if (items.length > 0) {
        allRawItems.push(...items);
        feedsSucceeded++;
      } else {
        feedsFailed++;
      }
      // Rate limit: 1 second between requests
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n📊 Feed results: ${feedsSucceeded} succeeded, ${feedsFailed} failed`);
    console.log(`   Total raw items: ${allRawItems.length}`);

    // Process and filter for relevance
    console.log('\n🔍 Processing and filtering for relevance...');
    const articles = this.processItems(allRawItems);
    console.log(`   ${articles.length} relevant articles (from ${allRawItems.length} raw items)`);

    // Sort by relevance score (highest first)
    articles.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Deduplicate against existing KB
    console.log('\n📁 Deduplicating against knowledge base...');
    const existingArticles = await this.kb.listWebArticles();
    const existingIds = new Set(existingArticles);

    // Also deduplicate within this batch (by URL)
    const seenUrls = new Set();
    const newArticles = [];

    for (const article of articles) {
      if (existingIds.has(article.id)) continue;
      if (seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);
      newArticles.push(article);
    }

    console.log(`   ${newArticles.length} new articles (${articles.length - newArticles.length} duplicates skipped)`);

    // Save new articles
    let saved = 0;
    for (const article of newArticles) {
      try {
        await this.kb.saveWebArticle(article);
        saved++;
      } catch (err) {
        console.error(`   ✗ Failed to save "${article.title}": ${err.message}`);
      }
    }

    // Summary
    console.log('\n' + '━'.repeat(50));
    console.log(`✅ Web Monitor complete`);
    console.log(`   Fetched ${allRawItems.length} items from ${feedsSucceeded} sources`);
    console.log(`   ${articles.length} relevant, ${saved} new saved`);

    // Log top articles
    if (newArticles.length > 0) {
      console.log(`\n📰 Top new articles:`);
      for (const a of newArticles.slice(0, 10)) {
        console.log(`   [${a.relevanceScore.toFixed(1)}] ${a.title.slice(0, 70)}... (${a.source})`);
      }
    }

    console.log('\n✨ Done!\n');
    return { total: allRawItems.length, relevant: articles.length, saved, sources: feedsSucceeded };
  }
}

// ─── CLI Runner ─────────────────────────────────────────────────────────────

const monitor = new WebMonitor();
monitor.init()
  .then(() => monitor.run())
  .catch(err => {
    console.error('❌ Web Monitor failed:', err);
    process.exit(1);
  });
