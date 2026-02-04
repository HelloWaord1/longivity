/**
 * Knowledge Base Store
 * File-based storage with JSON + Markdown for easy agent access
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';

const KB_ROOT = join(process.cwd(), 'knowledge-base');

export class KnowledgeBase {
  constructor(root = KB_ROOT) {
    this.root = root;
    this.dirs = {
      products: join(root, 'products'),
      research: join(root, 'research'),
      protocols: join(root, 'protocols'),
      community: join(root, 'community'),
      experts: join(root, 'experts'),
      daily: join(root, 'daily-digests'),
      webArticles: join(root, 'web-articles'),
    };
  }

  async init() {
    for (const dir of Object.values(this.dirs)) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }
    console.log('[KB] Knowledge base initialized at', this.root);
  }

  // --- Products ---

  async saveProduct(product) {
    const filename = `${this.slugify(product.name)}.json`;
    const filepath = join(this.dirs.products, filename);
    product.lastUpdated = new Date().toISOString();
    if (!product.createdAt) product.createdAt = product.lastUpdated;
    await writeFile(filepath, JSON.stringify(product, null, 2));

    // Also save a markdown version for agent-friendly reading
    const mdPath = join(this.dirs.products, `${this.slugify(product.name)}.md`);
    await writeFile(mdPath, this.productToMarkdown(product));

    return product;
  }

  async getProduct(name) {
    const filename = `${this.slugify(name)}.json`;
    const filepath = join(this.dirs.products, filename);
    if (!existsSync(filepath)) return null;
    return JSON.parse(await readFile(filepath, 'utf-8'));
  }

  async listProducts() {
    const files = await readdir(this.dirs.products);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  }

  // --- Research ---

  async saveResearch(paper) {
    const filename = `${this.slugify(paper.title).slice(0, 80)}.json`;
    const filepath = join(this.dirs.research, filename);
    paper.indexedAt = new Date().toISOString();
    await writeFile(filepath, JSON.stringify(paper, null, 2));
    return paper;
  }

  async listResearch() {
    const files = await readdir(this.dirs.research);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  }

  // --- Daily Digests ---

  async saveDailyDigest(date, digest) {
    const filename = `${date}.md`;
    const filepath = join(this.dirs.daily, filename);
    await writeFile(filepath, digest);
    return filepath;
  }

  async getLatestDigest() {
    const files = await readdir(this.dirs.daily);
    const sorted = files.filter(f => f.endsWith('.md')).sort().reverse();
    if (sorted.length === 0) return null;
    return readFile(join(this.dirs.daily, sorted[0]), 'utf-8');
  }

  // --- Protocols ---

  async saveProtocol(protocol) {
    const filename = `${this.slugify(protocol.name)}.md`;
    const filepath = join(this.dirs.protocols, filename);
    await writeFile(filepath, protocol.content);
    return filepath;
  }

  // --- Web Articles ---

  async saveWebArticle(article) {
    const filename = `${this.slugify(article.id || article.title)}.json`;
    const filepath = join(this.dirs.webArticles, filename);
    article.savedAt = new Date().toISOString();
    await writeFile(filepath, JSON.stringify(article, null, 2));
    return article;
  }

  async getWebArticle(id) {
    const filename = `${this.slugify(id)}.json`;
    const filepath = join(this.dirs.webArticles, filename);
    if (!existsSync(filepath)) return null;
    return JSON.parse(await readFile(filepath, 'utf-8'));
  }

  async listWebArticles() {
    if (!existsSync(this.dirs.webArticles)) return [];
    const files = await readdir(this.dirs.webArticles);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  }

  // --- Helpers ---

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
  }

  productToMarkdown(p) {
    return `# ${p.name}

**Category:** ${p.category}
**Evidence Grade:** ${p.evidenceGrade}
**Risk Profile:** ${p.riskProfile}

## Description
${p.description}

## Mechanisms of Action
${(p.mechanisms || []).map(m => `- ${m}`).join('\n')}

## Dosage
- **Standard:** ${p.dosage?.standard || 'N/A'}
- **Range:** ${p.dosage?.range || 'N/A'}
- **Notes:** ${p.dosage?.notes || 'N/A'}

## Key Findings
${(p.keyFindings || []).map(f => `- ${f}`).join('\n')}

## Interactions
${(p.interactions || []).map(i => `- ${i}`).join('\n')}

## Side Effects
${(p.sideEffects || []).map(s => `- ${s}`).join('\n')}

## Contraindications
${(p.contraindications || []).map(c => `- ${c}`).join('\n')}

## Sources
${(p.sources || []).map(s => `- ${s}`).join('\n')}

## Suppliers
${(p.suppliers || []).map(s => `- ${s.name}: ${s.url} (${s.price} ${s.currency})`).join('\n')}

---
*Last updated: ${p.lastUpdated}*
`;
  }
}
