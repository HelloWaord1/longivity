/**
 * Longivity MCP Server
 * Allows Claude, ChatGPT (via Actions), and other LLMs to interact
 * with Longivity knowledge base natively.
 * 
 * Protocol: MCP (Model Context Protocol)
 * Transport: stdio (for Claude Desktop / OpenClaw integration)
 */

import { KnowledgeBase } from '../kb/store.js';

const kb = new KnowledgeBase();

// MCP Protocol helpers
function jsonRpc(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function jsonRpcError(id, code, message) {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
}

// Tool definitions
const TOOLS = [
  {
    name: 'longivity_products',
    description: 'List all evidence-graded longevity products in the knowledge base. Returns product names, categories, evidence grades (A/B/C/D), and risk profiles.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: supplement, pharmaceutical, protocol, device, lifestyle',
          enum: ['supplement', 'pharmaceutical', 'protocol', 'device', 'lifestyle'],
        },
      },
    },
  },
  {
    name: 'longivity_product_details',
    description: 'Get detailed information about a specific longevity product including mechanisms, dosage, evidence, interactions, and key research findings.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Product name (e.g., "nmn-nicotinamide-mononucleotide", "rapamycin-low-dose", "omega-3-epa-dha")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'longivity_consult',
    description: 'Ask a longevity question. Searches the knowledge base for relevant products, protocols, and research. Good for questions like "How to boost NAD+?", "What are senolytics?", "Best supplements for mitochondria?"',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Longevity question to search for',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'longivity_recommend',
    description: 'Get a personalized longevity supplement stack recommendation based on monthly budget. Returns an optimized selection of evidence-graded products.',
    inputSchema: {
      type: 'object',
      properties: {
        budget: {
          type: 'number',
          description: 'Monthly budget in USD (minimum 10)',
        },
        age: {
          type: 'number',
          description: 'User age (optional, helps optimize recommendations)',
        },
        goals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Health goals (e.g., ["energy", "cognitive", "longevity", "cardiovascular"])',
        },
      },
      required: ['budget'],
    },
  },
  {
    name: 'longivity_research_digest',
    description: 'Get the latest research digest — a summary of recent longevity papers from PubMed and bioRxiv, curated by AI research agents.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'longivity_research_list',
    description: 'List all indexed research papers in the knowledge base.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool handlers
async function handleTool(name, args) {
  switch (name) {
    case 'longivity_products': {
      const products = await kb.listProducts();
      const details = [];
      for (const pname of products) {
        const p = await kb.getProduct(pname);
        if (p && (!args.category || p.category === args.category)) {
          details.push({
            name: p.name,
            category: p.category,
            evidenceGrade: p.evidenceGrade,
            riskProfile: p.riskProfile,
            description: p.description,
            dosage: p.dosage?.standard,
          });
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ products: details, count: details.length }, null, 2) }] };
    }

    case 'longivity_product_details': {
      const product = await kb.getProduct(args.name);
      if (!product) {
        return { content: [{ type: 'text', text: `Product "${args.name}" not found. Use longivity_products to see available products.` }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify(product, null, 2) }] };
    }

    case 'longivity_consult': {
      const products = await kb.listProducts();
      const allProducts = [];
      for (const pname of products) {
        const p = await kb.getProduct(pname);
        if (p) allProducts.push(p);
      }

      const queryLower = (args.query || '').toLowerCase();
      const relevant = allProducts.filter(p => {
        const searchText = [
          p.name, p.description, ...(p.mechanisms || []),
          ...(p.tags || []), ...(p.keyFindings || []),
        ].join(' ').toLowerCase();
        return queryLower.split(' ').some(word =>
          word.length > 3 && searchText.includes(word)
        );
      });

      const result = {
        query: args.query,
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
        disclaimer: 'This is not medical advice. Consult a healthcare professional.',
      };

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    case 'longivity_recommend': {
      const products = await kb.listProducts();
      const allProducts = [];
      for (const pname of products) {
        const p = await kb.getProduct(pname);
        if (p) allProducts.push(p);
      }

      const gradeOrder = { A: 0, B: 1, C: 2, D: 3 };
      const riskOrder = { low: 0, medium: 1, high: 2 };

      const sorted = [...allProducts]
        .filter(p => p.category !== 'pharmaceutical')
        .sort((a, b) => {
          const gDiff = (gradeOrder[a.evidenceGrade] || 3) - (gradeOrder[b.evidenceGrade] || 3);
          if (gDiff !== 0) return gDiff;
          return (riskOrder[a.riskProfile] || 2) - (riskOrder[b.riskProfile] || 2);
        });

      const budget = Number(args.budget) || 50;
      let maxItems;
      let tier;
      if (budget >= 300) { maxItems = 12; tier = 'Premium'; }
      else if (budget >= 150) { maxItems = 8; tier = 'Advanced'; }
      else if (budget >= 50) { maxItems = 5; tier = 'Standard'; }
      else { maxItems = 3; tier = 'Essential'; }

      const stack = sorted.slice(0, maxItems).map(p => ({
        name: p.name,
        category: p.category,
        evidenceGrade: p.evidenceGrade,
        dosage: p.dosage?.standard,
        reasoning: p.keyFindings?.[0] || p.description,
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            stack: { tier, items: stack, monthlyBudget: budget, itemCount: stack.length },
            disclaimer: 'This is not medical advice. Consult a healthcare professional.',
          }, null, 2),
        }],
      };
    }

    case 'longivity_research_digest': {
      const digest = await kb.getLatestDigest();
      return { content: [{ type: 'text', text: digest || 'No digest available yet. Run the research monitor first.' }] };
    }

    case 'longivity_research_list': {
      const papers = await kb.listResearch();
      return { content: [{ type: 'text', text: JSON.stringify({ papers, count: papers.length }, null, 2) }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
}

// MCP stdio transport
async function main() {
  await kb.init();

  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin });

  process.stderr.write('[Longivity MCP] Server started. Waiting for requests...\n');

  rl.on('line', async (line) => {
    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;

      switch (method) {
        case 'initialize':
          process.stdout.write(jsonRpc(id, {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'longivity',
              version: '0.1.0',
            },
          }) + '\n');
          break;

        case 'notifications/initialized':
          // Client acknowledged init
          break;

        case 'tools/list':
          process.stdout.write(jsonRpc(id, { tools: TOOLS }) + '\n');
          break;

        case 'tools/call': {
          const { name, arguments: args } = params;
          try {
            const result = await handleTool(name, args || {});
            process.stdout.write(jsonRpc(id, result) + '\n');
          } catch (err) {
            process.stdout.write(jsonRpcError(id, -32000, err.message) + '\n');
          }
          break;
        }

        default:
          if (id) {
            process.stdout.write(jsonRpcError(id, -32601, `Method not found: ${method}`) + '\n');
          }
      }
    } catch (err) {
      process.stderr.write(`[Longivity MCP] Parse error: ${err.message}\n`);
    }
  });
}

main().catch(err => {
  process.stderr.write(`[Longivity MCP] Fatal: ${err.message}\n`);
  process.exit(1);
});
