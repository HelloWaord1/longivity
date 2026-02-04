/**
 * Community Monitor Agent
 * Aggregates insights from Reddit, biohacker communities, and social media
 * Runs every 4 hours as OpenClaw cron job
 */

import { KnowledgeBase } from '../kb/store.js';

// Subreddits and sources to monitor
const REDDIT_SOURCES = [
  'r/longevity',
  'r/Supplements',
  'r/Biohackers',
  'r/NicotinamideRiboside',
  'r/Rapamycin',
  'r/Nootropics',
];

const TWITTER_ACCOUNTS = [
  'davidasinclair',    // David Sinclair - NAD+ researcher
  'PeterAttiaMD',      // Peter Attia - longevity physician
  'RhondaPatrick',     // Rhonda Patrick - nutrition/longevity
  'MattKaebworthy',    // Matt Kaeberlein - mTOR/rapamycin
  'BryanJohnson',      // Bryan Johnson - Blueprint protocol
  'andrewdhuberman',   // Andrew Huberman - neuroscience
];

const LONGEVITY_BLOGS = [
  { name: 'Longevity Technology', url: 'https://www.longevity.technology/' },
  { name: 'Life Extension Advocacy Foundation', url: 'https://www.lifespan.io/' },
  { name: 'Fight Aging!', url: 'https://www.fightaging.org/' },
  { name: 'Examine.com', url: 'https://examine.com/' },
];

export class CommunityMonitor {
  constructor() {
    this.kb = new KnowledgeBase();
  }

  async init() {
    await this.kb.init();
  }

  /**
   * Fetch top posts from Reddit (via JSON API)
   */
  async fetchReddit(subreddit, limit = 10) {
    try {
      const url = `https://www.reddit.com/${subreddit}/hot.json?limit=${limit}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Longivity-Bot/1.0' },
      });

      if (!res.ok) {
        console.error(`[CommunityMonitor] Reddit ${subreddit} returned ${res.status}`);
        return [];
      }

      const data = await res.json();
      return (data?.data?.children || []).map(child => ({
        source: `reddit:${subreddit}`,
        title: child.data.title,
        url: `https://reddit.com${child.data.permalink}`,
        score: child.data.score,
        comments: child.data.num_comments,
        created: new Date(child.data.created_utc * 1000).toISOString(),
        selftext: child.data.selftext?.slice(0, 500) || '',
        flair: child.data.link_flair_text || '',
      }));
    } catch (err) {
      console.error(`[CommunityMonitor] Reddit fetch failed for ${subreddit}:`, err.message);
      return [];
    }
  }

  /**
   * Run full monitoring cycle
   */
  async run() {
    console.log('[CommunityMonitor] Starting monitoring cycle...');
    const allPosts = [];

    // Fetch from each subreddit
    for (const sub of REDDIT_SOURCES) {
      const posts = await this.fetchReddit(sub, 5);
      allPosts.push(...posts);
      await new Promise(r => setTimeout(r, 2000)); // Reddit rate limiting
    }

    // Filter for high-engagement posts
    const trending = allPosts
      .filter(p => p.score > 10 || p.comments > 5)
      .sort((a, b) => b.score - a.score);

    // Generate community digest
    const digest = this.generateDigest(trending);
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].slice(0, 5);

    // Save as community report
    const reportPath = `${this.kb.dirs.community}/reddit-${today}-${time.replace(':', '')}.md`;
    const { writeFile } = await import('fs/promises');
    await writeFile(reportPath, digest);

    console.log(`[CommunityMonitor] Cycle complete. ${trending.length} trending posts from ${REDDIT_SOURCES.length} subreddits.`);
    return { total: allPosts.length, trending: trending.length };
  }

  generateDigest(posts) {
    const today = new Date().toISOString().split('T')[0];
    let md = `# Community Digest — ${today}\n\n`;
    md += `**${posts.length} trending posts**\n\n`;

    const bySource = {};
    for (const p of posts) {
      if (!bySource[p.source]) bySource[p.source] = [];
      bySource[p.source].push(p);
    }

    for (const [source, items] of Object.entries(bySource)) {
      md += `## ${source}\n\n`;
      for (const p of items.slice(0, 5)) {
        md += `### [${p.title}](${p.url})\n`;
        md += `⬆️ ${p.score} | 💬 ${p.comments} | ${p.flair || 'No flair'}\n`;
        if (p.selftext) {
          md += `> ${p.selftext.slice(0, 200)}...\n`;
        }
        md += '\n';
      }
    }

    return md;
  }
}
