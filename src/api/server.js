/**
 * Longivity API Server
 * REST API for the Longivity Agent
 * Handles: consult, news, product info, stack recommendations
 */

import { createServer } from 'http';
import { KnowledgeBase } from '../kb/store.js';
import { readFile } from 'fs/promises';

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
  // Health check
  'GET /': async (req, res) => {
    json(res, {
      name: 'Longivity API',
      version: '0.1.0',
      status: 'running',
      endpoints: [
        'GET /products',
        'GET /products/:name',
        'GET /research',
        'GET /digest',
        'POST /consult',
        'POST /recommend',
      ],
    });
  },

  // List all products
  'GET /products': async (req, res) => {
    const products = await kb.listProducts();
    const details = [];
    for (const name of products) {
      const product = await kb.getProduct(name);
      if (product) {
        details.push({
          name: product.name,
          category: product.category,
          evidenceGrade: product.evidenceGrade,
          riskProfile: product.riskProfile,
          description: product.description,
        });
      }
    }
    json(res, { products: details, count: details.length });
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

    // Simple keyword matching for MVP (will be replaced with embeddings)
    const queryLower = query.toLowerCase();
    const relevant = allProducts.filter(p => {
      const searchText = [
        p.name, p.description, ...(p.mechanisms || []),
        ...(p.tags || []), ...(p.keyFindings || []),
      ].join(' ').toLowerCase();
      return queryLower.split(' ').some(word =>
        word.length > 3 && searchText.includes(word)
      );
    });

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
