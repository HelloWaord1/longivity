/**
 * Research Monitor Agent
 * Monitors PubMed, bioRxiv, and longevity blogs for new research
 * Designed to run as OpenClaw cron job (every 4-6 hours)
 */

import { KnowledgeBase } from '../kb/store.js';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const BIORXIV_API = 'https://api.biorxiv.org/details/biorxiv';

// Key longevity search terms
const SEARCH_TERMS = [
  'longevity supplement human trial',
  'NAD+ NMN NR aging',
  'senolytic dasatinib quercetin',
  'rapamycin mTOR aging',
  'metformin aging TAME trial',
  'spermidine autophagy longevity',
  'urolithin A mitophagy',
  'resveratrol sirtuin aging',
  'omega-3 EPA DHA longevity',
  'vitamin D aging mortality',
  'berberine AMPK metabolism',
  'fisetin senolytic',
  'alpha-ketoglutarate aging',
  'glycine aging collagen',
  'taurine aging supplementation',
];

export class ResearchMonitor {
  constructor() {
    this.kb = new KnowledgeBase();
  }

  async init() {
    await this.kb.init();
  }

  /**
   * Search PubMed for recent papers
   */
  async searchPubMed(query, maxResults = 5) {
    try {
      const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=date&retmode=json&datetype=edat&reldate=30`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      const ids = searchData?.esearchresult?.idlist || [];
      if (ids.length === 0) return [];

      // Fetch details for each paper
      const detailUrl = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
      const detailRes = await fetch(detailUrl);
      const xml = await detailRes.text();

      // Simple XML parsing for key fields
      return this.parsePubMedXml(xml, ids);
    } catch (err) {
      console.error(`[ResearchMonitor] PubMed search failed for "${query}":`, err.message);
      return [];
    }
  }

  /**
   * Search bioRxiv for preprints
   */
  async searchBioRxiv(daysBack = 7) {
    try {
      const now = new Date();
      const from = new Date(now - daysBack * 86400000);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = now.toISOString().split('T')[0];

      const url = `${BIORXIV_API}/${fromStr}/${toStr}/0/25`;
      const res = await fetch(url);
      const data = await res.json();

      const papers = (data.collection || []).filter(p =>
        /aging|longevity|senescent|senolyti|nad\+|nmn|autophagy|mtor|telomer|epigenetic.*(age|clock)/i.test(
          p.title + ' ' + p.abstract
        )
      );

      return papers.map(p => ({
        id: p.doi,
        title: p.title,
        authors: p.authors?.split(';').map(a => a.trim()) || [],
        journal: 'bioRxiv (preprint)',
        publishedDate: p.date,
        doi: p.doi,
        url: `https://doi.org/${p.doi}`,
        abstract: p.abstract,
        studyType: 'preprint',
        tags: ['preprint', 'longevity'],
      }));
    } catch (err) {
      console.error('[ResearchMonitor] bioRxiv search failed:', err.message);
      return [];
    }
  }

  /**
   * Run full monitoring cycle
   */
  async run() {
    console.log('[ResearchMonitor] Starting monitoring cycle...');
    const allPapers = [];

    // PubMed searches
    for (const term of SEARCH_TERMS) {
      const papers = await this.searchPubMed(term, 3);
      allPapers.push(...papers);
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    // bioRxiv
    const preprints = await this.searchBioRxiv(7);
    allPapers.push(...preprints);

    // Deduplicate by title similarity
    const unique = this.deduplicatePapers(allPapers);

    // Save to KB
    let saved = 0;
    for (const paper of unique) {
      try {
        await this.kb.saveResearch(paper);
        saved++;
      } catch (err) {
        console.error(`[ResearchMonitor] Failed to save: ${paper.title}`, err.message);
      }
    }

    // Generate daily digest
    const digest = this.generateDigest(unique);
    const today = new Date().toISOString().split('T')[0];
    await this.kb.saveDailyDigest(today, digest);

    console.log(`[ResearchMonitor] Cycle complete. Found ${allPapers.length}, saved ${saved} unique papers.`);
    return { total: allPapers.length, saved, digest };
  }

  /**
   * Parse PubMed XML (simplified)
   */
  parsePubMedXml(xml, ids) {
    const papers = [];
    // Simple regex-based parsing (good enough for MVP)
    const articles = xml.split('<PubmedArticle>').slice(1);

    for (const article of articles) {
      const title = this.extractXml(article, 'ArticleTitle') || 'Untitled';
      const abstract = this.extractXml(article, 'AbstractText') || '';
      const journal = this.extractXml(article, 'Title') || '';
      const doi = this.extractXml(article, 'ArticleId IdType="doi"') || '';
      const year = this.extractXml(article, 'Year') || '';

      papers.push({
        id: doi || `pubmed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        abstract,
        journal,
        doi,
        url: doi ? `https://doi.org/${doi}` : '',
        publishedDate: year,
        studyType: this.inferStudyType(title + ' ' + abstract),
        tags: ['pubmed', 'longevity'],
        authors: [],
      });
    }

    return papers;
  }

  extractXml(xml, tag) {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag.split(' ')[0]}>`));
    return match ? match[1].replace(/<[^>]+>/g, '').trim() : null;
  }

  inferStudyType(text) {
    const lower = text.toLowerCase();
    if (/meta-analysis|systematic review/.test(lower)) return 'meta-analysis';
    if (/randomized|rct|double-blind|placebo-controlled/.test(lower)) return 'RCT';
    if (/cohort|longitudinal|prospective/.test(lower)) return 'cohort';
    if (/in vitro|cell line|culture/.test(lower)) return 'in-vitro';
    if (/mouse|mice|rat|animal model/.test(lower)) return 'animal';
    return 'other';
  }

  deduplicatePapers(papers) {
    const seen = new Map();
    return papers.filter(p => {
      const key = p.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }

  generateDigest(papers) {
    const today = new Date().toISOString().split('T')[0];
    const byType = {};

    for (const p of papers) {
      const type = p.studyType || 'other';
      if (!byType[type]) byType[type] = [];
      byType[type].push(p);
    }

    let md = `# Longivity Research Digest — ${today}\n\n`;
    md += `**${papers.length} papers found**\n\n`;

    for (const [type, items] of Object.entries(byType)) {
      md += `## ${type.toUpperCase()}\n\n`;
      for (const p of items.slice(0, 10)) {
        md += `### ${p.title}\n`;
        md += `- **Journal:** ${p.journal}\n`;
        md += `- **DOI:** ${p.doi || 'N/A'}\n`;
        if (p.abstract) {
          md += `- **Abstract:** ${p.abstract.slice(0, 300)}...\n`;
        }
        md += '\n';
      }
    }

    return md;
  }
}
