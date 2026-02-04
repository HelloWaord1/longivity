/**
 * Longivity API Server
 * REST API for the Longivity Agent
 * Handles: consult, news, product info, stack recommendations
 */

import { createServer } from 'http';
import { KnowledgeBase } from '../kb/store.js';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const kb = new KnowledgeBase();
const PORT = process.env.PORT || 3000;

/**
 * Simple JSON router
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Route handlers
 */
const routes = {
  // Serve frontend
  'GET /': async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getIndexHtml());
  },

  // API info
  'GET /api': async (req, res) => {
    json(res, {
      name: 'Longivity API',
      version: '0.1.0',
      status: 'running',
      endpoints: [
        'GET /products',
        'GET /products/:name',
        'GET /research',
        'GET /digest',
        'GET /articles  (supports ?type=generated|web|all, ?source=, ?category=, ?limit=)',
        'GET /articles/:id',
        'POST /consult',
        'POST /recommend',
      ],
    });
  },

  // List all products (with optional filters via query params)
  'GET /products': async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const filterCategory = url.searchParams.get('category');
    const filterGrade = url.searchParams.get('grade');
    const search = url.searchParams.get('q');

    const products = await kb.listProducts();
    const details = [];
    for (const name of products) {
      const product = await kb.getProduct(name);
      if (!product) continue;
      if (filterCategory && product.category !== filterCategory) continue;
      if (filterGrade && product.evidenceGrade !== filterGrade) continue;
      if (search) {
        const searchLower = search.toLowerCase();
        const text = [product.name, product.description, ...(product.tags || []), ...(product.mechanisms || [])].join(' ').toLowerCase();
        if (!text.includes(searchLower)) continue;
      }
      details.push({
        name: product.name,
        slug: kb.slugify(product.name),
        category: product.category,
        evidenceGrade: product.evidenceGrade,
        riskProfile: product.riskProfile,
        description: product.description,
        dosage: product.dosage?.standard,
        mechanisms: product.mechanisms,
        tags: product.tags,
      });
    }
    // Sort: A first, then B, C, D
    const gradeOrder = { A: 0, B: 1, C: 2, D: 3 };
    details.sort((a, b) => (gradeOrder[a.evidenceGrade] || 3) - (gradeOrder[b.evidenceGrade] || 3));
    
    // Get unique categories for filters
    const categories = [...new Set(details.map(p => p.category))];
    
    json(res, { products: details, count: details.length, categories });
  },

  // Get specific product
  'GET /products/:name': async (req, res, params) => {
    const product = await kb.getProduct(params.name);
    if (!product) {
      return json(res, { error: 'Product not found' }, 404);
    }
    json(res, { product });
  },

  // List research papers
  'GET /research': async (req, res) => {
    const papers = await kb.listResearch();
    json(res, { papers, count: papers.length });
  },

  // Get latest digest
  'GET /digest': async (req, res) => {
    const digest = await kb.getLatestDigest();
    if (!digest) {
      return json(res, { error: 'No digest available yet' }, 404);
    }
    json(res, { digest, format: 'markdown' });
  },

  // List articles (supports ?category=, ?featured=true, ?limit=, ?tag=, ?type=generated|web|all, ?source=)
  'GET /articles': async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const filterCategory = url.searchParams.get('category');
    const filterFeatured = url.searchParams.get('featured');
    const filterTag = url.searchParams.get('tag');
    const filterType = url.searchParams.get('type') || 'all'; // generated, web, all
    const filterSource = url.searchParams.get('source');
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    const articles = [];

    // Load generated articles
    if (filterType === 'all' || filterType === 'generated') {
      const articlesDir = join(process.cwd(), 'knowledge-base', 'articles');
      if (existsSync(articlesDir)) {
        const files = await readdir(articlesDir);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          try {
            const data = JSON.parse(await readFile(join(articlesDir, file), 'utf-8'));
            data.type = data.type || 'generated';
            articles.push(data);
          } catch (e) {
            // skip bad files
          }
        }
      }
    }

    // Load web articles
    if (filterType === 'all' || filterType === 'web') {
      const webDir = join(process.cwd(), 'knowledge-base', 'web-articles');
      if (existsSync(webDir)) {
        const files = await readdir(webDir);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          try {
            const data = JSON.parse(await readFile(join(webDir, file), 'utf-8'));
            data.type = 'web';
            articles.push(data);
          } catch (e) {
            // skip bad files
          }
        }
      }
    }

    // Apply filters
    const filtered = articles.filter(data => {
      if (filterCategory && data.category !== filterCategory) return false;
      if (filterFeatured === 'true' && !data.featured) return false;
      if (filterTag && !(data.tags || data.matchedKeywords || []).includes(filterTag.toLowerCase())) return false;
      if (filterSource && data.source !== filterSource) return false;
      return true;
    });

    // Sort: featured first, then by date (use createdAt or publishedAt or fetchedAt)
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const dateA = new Date(a.publishedAt || a.createdAt || 0);
      const dateB = new Date(b.publishedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    const limited = filtered.slice(0, limit);
    const categories = [...new Set(articles.map(a => a.category))];
    const sources = [...new Set(articles.filter(a => a.type === 'web').map(a => a.source).filter(Boolean))];

    json(res, { articles: limited, count: limited.length, total: filtered.length, categories, sources });
  },

  // Get single article by id (checks both generated and web articles)
  'GET /articles/:id': async (req, res, params) => {
    // Try generated articles first
    const articlesDir = join(process.cwd(), 'knowledge-base', 'articles');
    const filePath = join(articlesDir, `${params.id}.json`);
    
    if (existsSync(filePath)) {
      try {
        const article = JSON.parse(await readFile(filePath, 'utf-8'));
        article.type = article.type || 'generated';
        return json(res, { article });
      } catch (e) {
        return json(res, { error: 'Failed to read article' }, 500);
      }
    }

    // Try web articles
    const webDir = join(process.cwd(), 'knowledge-base', 'web-articles');
    const webPath = join(webDir, `${params.id}.json`);
    
    if (existsSync(webPath)) {
      try {
        const article = JSON.parse(await readFile(webPath, 'utf-8'));
        article.type = 'web';
        return json(res, { article });
      } catch (e) {
        return json(res, { error: 'Failed to read article' }, 500);
      }
    }

    json(res, { error: 'Article not found' }, 404);
  },

  // Consult endpoint — answer longevity questions
  'POST /consult': async (req, res) => {
    const body = await parseBody(req);
    const { query, healthProfile } = body;

    if (!query) {
      return json(res, { error: 'query is required' }, 400);
    }

    // Search knowledge base for relevant products
    const products = await kb.listProducts();
    const allProducts = [];
    for (const name of products) {
      const p = await kb.getProduct(name);
      if (p) allProducts.push(p);
    }

    // Keyword matching to find relevant products
    const queryLower = query.toLowerCase();
    const relevant = allProducts.filter(p => {
      const searchText = [
        p.name, p.description, ...(p.mechanisms || []),
        ...(p.tags || []), ...(p.keyFindings || []),
      ].join(' ').toLowerCase();
      return queryLower.split(' ').some(word =>
        word.length > 3 && searchText.includes(word)
      );
    }).slice(0, 8); // limit context size

    // If Anthropic key available, use Claude for intelligent answers
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const productContext = relevant.map(p => 
          `- ${p.name} (Grade ${p.evidenceGrade}, ${p.riskProfile} risk): ${p.description}\n  Mechanisms: ${(p.mechanisms || []).join(', ')}\n  Dosage: ${p.dosage?.standard || 'N/A'}\n  Key findings: ${(p.keyFindings || []).slice(0, 2).join('; ')}`
        ).join('\n\n');

        const systemPrompt = `You are Longivity AI, a longevity science assistant. Answer questions about supplements, protocols, and longevity research based on the evidence-graded knowledge base provided.

Rules:
- Be concise and evidence-based
- Always mention evidence grades (A=strong RCTs, B=good evidence, C=emerging, D=preliminary)
- Include dosage information when relevant
- Note contraindications and risks
- End with a brief disclaimer
- Use markdown formatting (## headings, **bold**, - bullet points)
- Keep answers under 500 words`;

        const userMessage = productContext 
          ? `Knowledge base context:\n${productContext}\n\nUser question: ${query}`
          : `No specific products found in the knowledge base for this query. Answer based on general longevity science knowledge.\n\nUser question: ${query}`;

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          }),
        });

        if (claudeRes.ok) {
          const claudeData = await claudeRes.json();
          const answer = claudeData.content?.[0]?.text || '';

          return json(res, {
            query,
            answer,
            relevantProducts: relevant.map(p => ({
              name: p.name,
              category: p.category,
              evidenceGrade: p.evidenceGrade,
              mechanisms: p.mechanisms,
              dosage: p.dosage,
              keyFindings: p.keyFindings,
              riskProfile: p.riskProfile,
            })),
            count: relevant.length,
            model: 'claude',
            note: 'This is not medical advice. Consult a healthcare professional.',
          });
        }
        // Fall through to keyword-only response if Claude fails
        console.error('[Consult] Claude API error:', claudeRes.status);
      } catch (err) {
        console.error('[Consult] Claude error:', err.message);
        // Fall through to keyword-only response
      }
    }

    // Fallback: keyword-only response (no LLM)
    json(res, {
      query,
      relevantProducts: relevant.map(p => ({
        name: p.name,
        category: p.category,
        evidenceGrade: p.evidenceGrade,
        mechanisms: p.mechanisms,
        dosage: p.dosage,
        keyFindings: p.keyFindings,
        riskProfile: p.riskProfile,
      })),
      count: relevant.length,
      note: 'This is not medical advice. Consult a healthcare professional.',
    });
  },

  // Recommend a stack based on profile
  'POST /recommend': async (req, res) => {
    const body = await parseBody(req);
    const { budget, goals, age, sex, conditions } = body;

    if (!budget) {
      return json(res, { error: 'budget (monthly, USD) is required' }, 400);
    }

    const products = await kb.listProducts();
    const allProducts = [];
    for (const name of products) {
      const p = await kb.getProduct(name);
      if (p) allProducts.push(p);
    }

    // Tier-based recommendation for MVP
    const stack = buildStack(allProducts, {
      budget: Number(budget),
      goals: goals || [],
      age: age || null,
      sex: sex || null,
      conditions: conditions || [],
    });

    json(res, {
      stack,
      budget: Number(budget),
      note: 'This is not medical advice. Consult a healthcare professional before starting any supplement regimen.',
    });
  },
};

/**
 * Build a personalized stack based on budget and profile
 * MVP: simple tiered approach. Later: AI-driven optimization
 */
function buildStack(products, profile) {
  const { budget, goals, age, conditions } = profile;

  // Sort by evidence grade (A first) then risk (low first)
  const gradeOrder = { A: 0, B: 1, C: 2, D: 3 };
  const riskOrder = { low: 0, medium: 1, high: 2 };

  const sorted = [...products]
    .filter(p => p.category !== 'pharmaceutical') // exclude Rx for basic stack
    .sort((a, b) => {
      const gDiff = (gradeOrder[a.evidenceGrade] || 3) - (gradeOrder[b.evidenceGrade] || 3);
      if (gDiff !== 0) return gDiff;
      return (riskOrder[a.riskProfile] || 2) - (riskOrder[b.riskProfile] || 2);
    });

  // Budget tiers (approximate monthly cost)
  const tiers = {
    essential: { maxItems: 3, label: 'Essential', minBudget: 0 },
    standard: { maxItems: 5, label: 'Standard', minBudget: 50 },
    advanced: { maxItems: 8, label: 'Advanced', minBudget: 150 },
    premium: { maxItems: 12, label: 'Premium', minBudget: 300 },
  };

  let tier;
  if (budget >= 300) tier = tiers.premium;
  else if (budget >= 150) tier = tiers.advanced;
  else if (budget >= 50) tier = tiers.standard;
  else tier = tiers.essential;

  const stack = sorted.slice(0, tier.maxItems).map(p => ({
    name: p.name,
    category: p.category,
    evidenceGrade: p.evidenceGrade,
    dosage: p.dosage?.standard || 'See product details',
    reasoning: p.keyFindings?.[0] || p.description,
  }));

  return {
    tier: tier.label,
    items: stack,
    monthlyBudget: budget,
    itemCount: stack.length,
  };
}

/**
 * Request router
 */
async function handleRequest(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // Exact match
    const key = `${method} ${path}`;
    if (routes[key]) {
      return await routes[key](req, res);
    }

    // Param routes
    if (method === 'GET' && path.startsWith('/articles/')) {
      const id = decodeURIComponent(path.replace('/articles/', ''));
      return await routes['GET /articles/:id'](req, res, { id });
    }

    if (method === 'GET' && path.startsWith('/products/')) {
      const name = decodeURIComponent(path.replace('/products/', ''));
      return await routes['GET /products/:name'](req, res, { name });
    }

    json(res, { error: 'Not found', path }, 404);
  } catch (err) {
    console.error('Request error:', err);
    json(res, { error: 'Internal server error' }, 500);
  }
}

/**
 * Start server
 */
async function start() {
  await kb.init();

  const server = createServer(handleRequest);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🧬 Longivity API running on http://0.0.0.0:${PORT}`);
    console.log(`   Endpoints: GET /products, GET /digest, POST /consult, POST /recommend`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

function getIndexHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Longivity — AI-Powered Longevity Platform</title>
<style>
:root{--bg:#0a0a0f;--bg2:#12121a;--bg3:#1a1a2e;--t:#e4e4e7;--tm:#71717a;--ac:#22d3ee;--ach:#06b6d4;--g:#4ade80;--y:#fbbf24;--r:#f87171;--b:#27272a;--rad:12px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--ac);text-decoration:none}
.ctr{max-width:1100px;margin:0 auto;padding:0 20px}
nav{position:fixed;top:0;width:100%;z-index:100;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;background:rgba(10,10,15,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--b)}
nav .logo{font-size:20px;font-weight:700}
nav ul{display:flex;gap:28px;list-style:none}
nav a{color:var(--tm);font-size:14px}
nav a:hover{color:var(--t)}
.hero{min-height:90vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:80px 20px}
.badge{display:inline-flex;padding:5px 14px;border:1px solid var(--b);border-radius:100px;font-size:13px;color:var(--ac);margin-bottom:28px;background:var(--bg2)}
.hero h1{font-size:clamp(36px,7vw,68px);font-weight:700;line-height:1.1;margin-bottom:20px;background:linear-gradient(135deg,var(--t),var(--ac));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{font-size:18px;color:var(--tm);max-width:600px;margin-bottom:36px}
.btns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:var(--rad);font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all .2s}
.bp{background:var(--ac);color:var(--bg)}
.bp:hover{background:var(--ach);transform:translateY(-1px)}
.bs{background:var(--bg2);color:var(--t);border:1px solid var(--b)}
.bs:hover{background:var(--bg3)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;margin:44px 0}
.stat-v{font-size:32px;font-weight:700;color:var(--ac)}
.stat-l{font-size:13px;color:var(--tm);margin-top:2px}
.sec{padding:80px 20px}
.sec h2{font-size:32px;font-weight:700;margin-bottom:12px}
.sec .sub{font-size:16px;color:var(--tm);margin-bottom:40px;max-width:560px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.card{background:var(--bg2);border:1px solid var(--b);border-radius:var(--rad);padding:28px;transition:border-color .2s}
.card:hover{border-color:var(--ac)}
.card .ic{font-size:28px;margin-bottom:12px}
.card h3{font-size:18px;margin-bottom:6px}
.card p{color:var(--tm);font-size:14px}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.pcard{background:var(--bg2);border:1px solid var(--b);border-radius:var(--rad);padding:20px;transition:all .2s;cursor:pointer}
.pcard:hover{border-color:var(--ac);transform:translateY(-2px)}
.pname{font-size:16px;font-weight:600;margin-bottom:6px}
.pmeta{display:flex;gap:10px;margin-bottom:10px}
.tag{display:inline-flex;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:600}
.ga{background:rgba(74,222,128,.15);color:var(--g)}
.gb{background:rgba(34,211,238,.15);color:var(--ac)}
.gc{background:rgba(251,191,36,.15);color:var(--y)}
.gd{background:rgba(248,113,113,.15);color:var(--r)}
.tcat{background:rgba(113,113,122,.15);color:var(--tm)}
.pdesc{font-size:13px;color:var(--tm)}
.chat-c{max-width:760px;margin:0 auto}
.msgs{min-height:250px;max-height:450px;overflow-y:auto;padding:20px 0}
.msg{margin-bottom:14px;padding:14px;border-radius:var(--rad)}
.msg.u{background:var(--bg3);margin-left:36px}
.msg.a{background:var(--bg2);border:1px solid var(--b);margin-right:36px}
.msg .rl{font-size:11px;color:var(--ac);margin-bottom:3px;font-weight:600;text-transform:uppercase}
.cinp{display:flex;gap:10px}
.cinp input{flex:1;padding:12px 18px;border-radius:var(--rad);border:1px solid var(--b);background:var(--bg2);color:var(--t);font-size:15px;outline:none}
.cinp input:focus{border-color:var(--ac)}
.rform{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px}
.rform label{font-size:13px;color:var(--tm);display:block;margin-bottom:3px}
.rform input{padding:10px 14px;border-radius:var(--rad);border:1px solid var(--b);background:var(--bg2);color:var(--t);font-size:14px;outline:none;width:130px}
.scard{background:var(--bg2);border:1px solid var(--b);border-radius:var(--rad);padding:20px;margin-bottom:10px}
.stier{font-size:13px;color:var(--ac);font-weight:600;margin-bottom:14px}
footer{padding:40px 20px;text-align:center;color:var(--tm);border-top:1px solid var(--b);font-size:13px}
@media(max-width:768px){nav ul{display:none}.hero h1{font-size:32px}.grid{grid-template-columns:1fr}.msg.u{margin-left:0}.msg.a{margin-right:0}}
</style>
</head>
<body>
<nav><div class="logo">🧬 Longivity</div><ul><li><a href="#products">Products</a></li><li><a href="#chat">Ask AI</a></li><li><a href="#stack">My Stack</a></li><li><a href="#digest">Research</a></li></ul></nav>

<section class="hero">
<div class="badge">🔬 AI-Powered Longevity Platform</div>
<h1>Live Longer,<br>Live Better</h1>
<p>Multi-agent AI system that monitors all longevity research, supplements, and protocols — then builds your personalized stack based on your health data and budget.</p>
<div class="btns"><a href="#stack" class="btn bp">Get Your Stack →</a><a href="#chat" class="btn bs">Ask About Longevity</a></div>
<div class="stats ctr">
<div style="text-align:center"><div class="stat-v">$20.2B</div><div class="stat-l">Global Market by 2033</div></div>
<div style="text-align:center"><div class="stat-v" id="paper-count">44+</div><div class="stat-l">Research Papers</div></div>
<div style="text-align:center"><div class="stat-v" id="prod-count">10</div><div class="stat-l">Evidence-Graded Products</div></div>
<div style="text-align:center"><div class="stat-v">24/7</div><div class="stat-l">AI Monitoring</div></div>
</div>
</section>

<section class="sec ctr">
<h2>How It Works</h2>
<p class="sub">Not another supplement brand — an AI aggregator that picks the best from the entire market.</p>
<div class="grid">
<div class="card"><div class="ic">🔍</div><h3>Multi-Agent Research</h3><p>AI agents continuously monitor PubMed, bioRxiv, supplement markets, and biohacker communities.</p></div>
<div class="card"><div class="ic">🧬</div><h3>Evidence Grading</h3><p>Every product rated A-D based on scientific evidence: RCTs, meta-analyses, cohort studies.</p></div>
<div class="card"><div class="ic">🤖</div><h3>AI Personalization</h3><p>Your AI agent builds a unique stack based on health data, genetics, and budget — $10 to $100K+/month.</p></div>
<div class="card"><div class="ic">📦</div><h3>Monthly Delivery</h3><p>Personalized box monthly. Stack adapts as new research emerges and your health data changes.</p></div>
<div class="card"><div class="ic">👨‍⚕️</div><h3>Expert Verified</h3><p>Every protocol reviewed by verified gerontologists and clinical researchers.</p></div>
<div class="card"><div class="ic">🌐</div><h3>Works with Any AI</h3><p>Connect via MCP (Claude), REST API (ChatGPT/Gemini), or use our web interface.</p></div>
</div>
</section>

<section id="products" class="sec ctr">
<h2>Knowledge Base</h2>
<p class="sub">Evidence-graded longevity products monitored by our AI agents.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
<input id="psearch" placeholder="Search products..." style="flex:1;min-width:200px;padding:10px 16px;border-radius:var(--rad);border:1px solid var(--b);background:var(--bg2);color:var(--t);font-size:14px;outline:none" oninput="filterProducts()">
<select id="pcat" onchange="filterProducts()" style="padding:10px 16px;border-radius:var(--rad);border:1px solid var(--b);background:var(--bg2);color:var(--t);font-size:14px;outline:none"><option value="">All Categories</option></select>
<select id="pgrade" onchange="filterProducts()" style="padding:10px 16px;border-radius:var(--rad);border:1px solid var(--b);background:var(--bg2);color:var(--t);font-size:14px;outline:none"><option value="">All Grades</option><option value="A">Grade A</option><option value="B">Grade B</option><option value="C">Grade C</option><option value="D">Grade D</option></select>
</div>
<div id="pcount" style="color:var(--tm);font-size:13px;margin-bottom:14px"></div>
<div class="pgrid" id="products-grid"></div>
</section>

<section id="chat" class="sec ctr">
<h2>Ask Longivity AI</h2>
<p class="sub">Your longevity questions, answered with evidence-graded research.</p>
<div class="chat-c">
<div class="msgs" id="messages">
<div class="msg a"><div class="rl">🧬 Longivity</div>Ask me anything about longevity! Try: "How to boost NAD+?" or "What are senolytics?"</div>
</div>
<div class="cinp"><input id="q" placeholder="Ask about longevity..." onkeydown="if(event.key==='Enter')ask()"><button class="btn bp" onclick="ask()">Send</button></div>
</div>
</section>

<section id="stack" class="sec ctr">
<h2>Build Your Stack</h2>
<p class="sub">Get a personalized longevity stack based on your budget.</p>
<div class="rform">
<div><label>Monthly Budget (USD)</label><input id="budget" type="number" value="50" min="10" max="100000"></div>
<div><label>Age</label><input id="age" type="number" value="30" min="18" max="100" style="width:90px"></div>
<div style="display:flex;align-items:flex-end"><button class="btn bp" onclick="getStack()">Get My Stack →</button></div>
</div>
<div id="stack-result"></div>
</section>

<section id="digest" class="sec ctr">
<h2>Research Digest</h2>
<p class="sub">Latest longevity research from PubMed and bioRxiv.</p>
<div id="digest-content" style="background:var(--bg2);border:1px solid var(--b);border-radius:var(--rad);padding:28px;font-family:monospace;font-size:13px;max-height:500px;overflow:auto;color:var(--tm);white-space:pre-wrap">Loading...</div>
</section>

<footer><p>🧬 Longivity — AI-powered longevity platform</p><p style="margin-top:6px">Built with OpenClaw · © 2026 · Not medical advice.</p></footer>

<script>
const API=location.origin;
const gc={'A':'ga','B':'gb','C':'gc','D':'gd'};

let allProducts=[];
async function loadProducts(){
  try{const r=await fetch(API+'/products');const d=await r.json();
  allProducts=d.products||[];
  document.getElementById('prod-count').textContent=d.count;
  // populate category filter
  const cats=d.categories||[...new Set(allProducts.map(p=>p.category))];
  const sel=document.getElementById('pcat');
  cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;sel.appendChild(o)});
  renderProducts(allProducts)}
  catch(e){console.error(e)}
}
function filterProducts(){
  const q=(document.getElementById('psearch').value||'').toLowerCase();
  const cat=document.getElementById('pcat').value;
  const grade=document.getElementById('pgrade').value;
  const filtered=allProducts.filter(p=>{
    if(cat&&p.category!==cat)return false;
    if(grade&&p.evidenceGrade!==grade)return false;
    if(q){const t=[p.name,p.description,...(p.tags||[]),...(p.mechanisms||[])].join(' ').toLowerCase();if(!t.includes(q))return false}
    return true});
  renderProducts(filtered);
}
function renderProducts(products){
  const el=document.getElementById('products-grid');
  document.getElementById('pcount').textContent=products.length+' products';
  el.innerHTML=products.map(p=>'<div class="pcard" data-slug="'+esc(p.slug||'')+'" onclick="showProduct(this.dataset.slug)"><div class="pname">'+esc(p.name)+'</div><div class="pmeta"><span class="tag '+(gc[p.evidenceGrade]||'gd')+'">Grade '+p.evidenceGrade+'</span><span class="tag tcat">'+p.category+'</span></div><div class="pdesc">'+esc(p.description)+'</div>'+(p.dosage?'<div style="color:var(--ac);font-size:12px;margin-top:6px">💊 '+esc(p.dosage)+'</div>':'')+'</div>').join('')
}
async function showProduct(slug){
  try{const r=await fetch(API+'/products/'+slug);const d=await r.json();const p=d.product;
  if(!p)return;
  const modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);z-index:200;display:flex;justify-content:center;align-items:center;padding:20px';
  modal.id='modal';modal.onclick=e=>{if(e.target===modal)modal.remove()};
  let html='<div style="background:var(--bg2);border:1px solid var(--b);border-radius:var(--rad);padding:32px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto">';
  html+='<div style="display:flex;justify-content:space-between;align-items:start"><h2 style="font-size:24px">'+esc(p.name)+'</h2><button onclick="document.getElementById(String.fromCharCode(109,111,100,97,108)).remove()" style="background:none;border:none;color:var(--tm);font-size:24px;cursor:pointer">✕</button></div>';
  html+='<div class="pmeta" style="margin:12px 0"><span class="tag '+(gc[p.evidenceGrade]||'gd')+'">Grade '+p.evidenceGrade+'</span><span class="tag tcat">'+p.category+'</span><span class="tag" style="background:rgba(113,113,122,.1);color:var(--tm)">'+esc(p.riskProfile)+' risk</span></div>';
  if(p.mechanisms&&p.mechanisms.length)html+='<div style="margin:12px 0"><b style="font-size:13px;color:var(--ac)">Mechanisms:</b><div style="color:var(--tm);font-size:14px;margin-top:4px">'+p.mechanisms.map(m=>esc(m)).join(' · ')+'</div></div>';
  if(p.dosage)html+='<div style="margin:12px 0;background:var(--bg3);padding:14px;border-radius:8px"><b style="font-size:13px;color:var(--ac)">Dosage</b><div style="font-size:15px;margin-top:4px">'+esc(p.dosage.standard||'')+'</div><div style="font-size:13px;color:var(--tm)">Range: '+esc(p.dosage.range||'')+'</div>'+(p.dosage.notes?'<div style="font-size:13px;color:var(--y);margin-top:4px">⚠️ '+esc(p.dosage.notes)+'</div>':'')+'</div>';
  if(p.keyFindings&&p.keyFindings.length)html+='<div style="margin:12px 0"><b style="font-size:13px;color:var(--ac)">Key Findings:</b><ul style="color:var(--tm);font-size:14px;margin-top:4px;padding-left:20px">'+p.keyFindings.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul></div>';
  if(p.contraindications&&p.contraindications.length)html+='<div style="margin:12px 0"><b style="font-size:13px;color:var(--r)">Contraindications:</b><ul style="color:var(--tm);font-size:14px;margin-top:4px;padding-left:20px">'+p.contraindications.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></div>';
  if(p.tags&&p.tags.length)html+='<div style="margin:12px 0;display:flex;gap:6px;flex-wrap:wrap">'+p.tags.map(t=>'<span style="padding:2px 8px;border-radius:100px;font-size:11px;background:rgba(34,211,238,.1);color:var(--ac)">#'+esc(t)+'</span>').join('')+'</div>';
  html+='</div>';
  modal.innerHTML=html;document.body.appendChild(modal)}
  catch(e){console.error(e)}
}

async function loadDigest(){
  try{const r=await fetch(API+'/digest');const d=await r.json();
  document.getElementById('digest-content').textContent=d.digest||'No digest yet.'}
  catch(e){document.getElementById('digest-content').textContent='Failed to load digest.'}
}

async function loadResearch(){
  try{const r=await fetch(API+'/research');const d=await r.json();
  document.getElementById('paper-count').textContent=d.count+'+'}
  catch(e){}
}

async function ask(){
  const input=document.getElementById('q');
  const query=input.value.trim();if(!query)return;
  input.value='';
  const msgs=document.getElementById('messages');
  msgs.innerHTML+='<div class="msg u"><div class="rl">🧑 You</div>'+esc(query)+'</div>';
  msgs.innerHTML+='<div class="msg a" id="loading"><div class="rl">🧬 Longivity</div>Searching...</div>';
  msgs.scrollTop=msgs.scrollHeight;
  try{
    const r=await fetch(API+'/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query})});
    const d=await r.json();
    document.getElementById('loading').remove();
    let reply='';
    if(d.relevantProducts&&d.relevantProducts.length>0){
      reply='Found '+d.count+' product(s):<br><br>';
      d.relevantProducts.forEach(p=>{
        reply+='<b>'+esc(p.name)+'</b> (Grade '+p.evidenceGrade+', '+p.riskProfile+' risk)<br>';
        reply+='Mechanisms: '+esc((p.mechanisms||[]).join(', '))+'<br>';
        reply+='Dosage: '+esc(p.dosage?.standard||'N/A')+'<br>';
        if(p.keyFindings&&p.keyFindings[0])reply+='Key: '+esc(p.keyFindings[0])+'<br>';
        reply+='<br>'});
      reply+='⚠️ '+esc(d.note);
    }else{reply='No specific products found for "'+esc(query)+'". Try: NMN, NAD+, rapamycin, senolytics, omega-3, taurine, spermidine, metformin, resveratrol, urolithin A.'}
    msgs.innerHTML+='<div class="msg a"><div class="rl">🧬 Longivity</div>'+reply+'</div>';
  }catch(e){document.getElementById('loading')?.remove();msgs.innerHTML+='<div class="msg a"><div class="rl">🧬 Longivity</div>Error. Try again.</div>'}
  msgs.scrollTop=msgs.scrollHeight;
}

async function getStack(){
  const budget=document.getElementById('budget').value;
  const age=document.getElementById('age').value;
  const el=document.getElementById('stack-result');
  el.innerHTML='<p style="color:var(--tm)">Building your stack...</p>';
  try{
    const r=await fetch(API+'/recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({budget:+budget,age:+age})});
    const d=await r.json();const s=d.stack;
    let html='<div class="stier">'+s.tier+' Tier — '+s.itemCount+' products for $'+s.monthlyBudget+'/month</div>';
    s.items.forEach(i=>{html+='<div class="scard"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><strong>'+esc(i.name)+'</strong><span class="tag '+(gc[i.evidenceGrade]||'gd')+'">Grade '+i.evidenceGrade+'</span></div><div style="color:var(--ac);font-size:13px;margin-bottom:3px">💊 '+esc(i.dosage)+'</div><div style="color:var(--tm);font-size:13px">'+esc(i.reasoning)+'</div></div>'});
    html+='<p style="color:var(--tm);font-size:12px;margin-top:14px">⚠️ Not medical advice. Consult a healthcare professional.</p>';
    el.innerHTML=html;
  }catch(e){el.innerHTML='<p style="color:var(--r)">Error loading stack.</p>'}
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
loadProducts();loadDigest();loadResearch();
</script>
</body></html>`;
}
