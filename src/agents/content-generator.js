/**
 * Content Generator Agent
 * Reads research papers + product data → generates well-written articles
 * Template-based (no LLM needed) with smart grouping by topic
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';

const KB_ROOT = join(process.cwd(), 'knowledge-base');
const RESEARCH_DIR = join(KB_ROOT, 'research');
const PRODUCTS_DIR = join(KB_ROOT, 'products');
const ARTICLES_DIR = join(KB_ROOT, 'articles');

// ─── Topic Keywords for Grouping ────────────────────────────────────────────

const TOPIC_KEYWORDS = {
  'nad-and-cellular-energy': {
    label: 'NAD+ & Cellular Energy',
    keywords: ['nad+', 'nad', 'nicotinamide', 'nmn', 'niacin', 'sirtuin', 'sirt1', 'nicotinamide riboside', 'nr', 'nads'],
    category: 'supplements',
  },
  'senolytics-and-senescence': {
    label: 'Senolytics & Cellular Senescence',
    keywords: ['senolytic', 'senescence', 'senescent', 'senotherap', 'p16', 'sasp', 'dasatinib', 'fisetin', 'celastrol'],
    category: 'research',
  },
  'mitochondrial-health': {
    label: 'Mitochondrial Health',
    keywords: ['mitochondri', 'mitophagy', 'electron transport', 'coq10', 'ubiquinol', 'pqq', 'atp synthase', 'urolithin'],
    category: 'supplements',
  },
  'autophagy-and-cellular-cleanup': {
    label: 'Autophagy & Cellular Cleanup',
    keywords: ['autophagy', 'mtor', 'rapamycin', 'spermidine', 'trehalose', 'fasting'],
    category: 'research',
  },
  'berberine-and-metabolic-health': {
    label: 'Berberine & Metabolic Health',
    keywords: ['berberine', 'ampk', 'metformin', 'glucose regulation', 'metabolic rewiring'],
    category: 'supplements',
  },
  'muscle-aging-and-sarcopenia': {
    label: 'Muscle Aging & Sarcopenia',
    keywords: ['muscle', 'sarcopenia', 'myogenic', 'skeletal muscle', 'muscle stem cell', 'muscle aging'],
    category: 'research',
  },
  'alzheimers-and-neuroprotection': {
    label: "Alzheimer's & Neuroprotection",
    keywords: ['alzheimer', 'neuroprotect', 'cognitive', 'brain aging', 'hippocampal', 'neurodegeneration', 'taurine'],
    category: 'research',
  },
  'vitamins-and-minerals': {
    label: 'Vitamins & Minerals',
    keywords: ['vitamin d', 'vitamin k', 'folate', 'selenium', 'zinc', 'magnesium'],
    category: 'supplements',
  },
  'epigenetics-and-aging': {
    label: 'Epigenetics & Aging Clocks',
    keywords: ['epigenetic', 'methylation', 'crotonylation', 'tet enzyme', 'histone', 'dna repair'],
    category: 'research',
  },
  'polyamines-and-longevity': {
    label: 'Polyamines & Longevity',
    keywords: ['polyamine', 'spermidine', 'putrescine', 'spermine'],
    category: 'supplements',
  },
  'ferroptosis-and-oxidative-stress': {
    label: 'Ferroptosis & Oxidative Stress',
    keywords: ['ferroptosis', 'oxidative stress', 'iron', 'lipid peroxidation', 'nrf2', 'antioxidant', 'ros'],
    category: 'research',
  },
  'gut-longevity-axis': {
    label: 'Gut-Longevity Axis',
    keywords: ['gut', 'microbiome', 'nervous system', 'gut-brain', 'intestin', 'c. elegans longevity'],
    category: 'research',
  },
  'urolithin-a-and-mitophagy': {
    label: 'Urolithin A & Mitophagy',
    keywords: ['urolithin', 'mitophagy', 'pomegranate'],
    category: 'supplements',
  },
  'kidney-aging': {
    label: 'Kidney Aging & Health',
    keywords: ['kidney', 'renal', 'ckd', 'nephron'],
    category: 'research',
  },
  'dietary-nutrition-longevity': {
    label: 'Nutrition & Longevity',
    keywords: ['dietary', 'nutrition', 'diet', 'supplementation', 'phytochemical'],
    category: 'protocols',
  },
  'lung-aging-and-respiratory': {
    label: 'Lung Aging & Respiratory Health',
    keywords: ['lung', 'pulmonary', 'respiratory', 'airway'],
    category: 'research',
  },
};

// ─── Evidence Level Mapping ─────────────────────────────────────────────────

function mapStudyType(studyType) {
  const map = {
    'rct': 'RCT',
    'meta-analysis': 'Meta-Analysis',
    'cohort': 'Cohort',
    'animal': 'Animal',
    'in-vitro': 'In Vitro',
    'in_vitro': 'In Vitro',
    'review': 'Review',
    'preprint': 'Preprint',
    'other': 'Review',
  };
  return map[studyType?.toLowerCase()] || 'Preprint';
}

// Rank evidence for picking the "best" when grouping
function evidenceRank(level) {
  const ranks = { 'Meta-Analysis': 6, 'RCT': 5, 'Cohort': 4, 'Review': 3, 'Animal': 2, 'In Vitro': 1, 'Preprint': 0 };
  return ranks[level] ?? 0;
}

// ─── Slug ───────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ─── Load Data ──────────────────────────────────────────────────────────────

async function loadJsonDir(dir) {
  const files = await readdir(dir);
  const items = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(await readFile(join(dir, file), 'utf-8'));
      items.push(data);
    } catch (e) {
      console.warn(`  ⚠ Skipped ${file}: ${e.message}`);
    }
  }
  return items;
}

// ─── Match Papers to Topics ─────────────────────────────────────────────────

function matchPaperToTopics(paper) {
  const searchText = [
    paper.title || '',
    paper.abstract || '',
    ...(paper.tags || []),
  ].join(' ').toLowerCase();

  const matches = [];
  for (const [topicId, topic] of Object.entries(TOPIC_KEYWORDS)) {
    const score = topic.keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const found = (searchText.match(regex) || []).length;
      return acc + found;
    }, 0);
    if (score > 0) {
      matches.push({ topicId, score });
    }
  }

  // Sort by score, return top matches
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

// ─── Match Products to Topic ────────────────────────────────────────────────

function matchProductsToTopic(topicId, products) {
  const topic = TOPIC_KEYWORDS[topicId];
  if (!topic) return [];

  return products.filter(p => {
    const searchText = [
      p.name || '',
      p.description || '',
      ...(p.mechanisms || []),
      ...(p.tags || []),
    ].join(' ').toLowerCase();

    return topic.keywords.some(kw => searchText.includes(kw.toLowerCase()));
  });
}

// ─── Filter Out Non-Longevity Papers ────────────────────────────────────────

function isLongevityRelevant(paper) {
  const text = [paper.title, paper.abstract, ...(paper.tags || [])].join(' ').toLowerCase();
  
  // Must match at least one longevity-adjacent term
  const longevityTerms = [
    'aging', 'ageing', 'longevity', 'lifespan', 'senescence', 'senolytic',
    'nad+', 'nad', 'mitochondri', 'autophagy', 'mtor', 'sirtuin',
    'oxidative stress', 'ferroptosis', 'epigenetic', 'telomere',
    'muscle aging', 'sarcopenia', 'alzheimer', 'neuroprotect',
    'supplement', 'berberine', 'resveratrol', 'nmn', 'vitamin',
    'spermidine', 'rapamycin', 'fisetin', 'quercetin', 'metformin',
    'urolithin', 'taurine', 'folate', 'polyamine', 'kidney aging',
    'stem cell', 'cellular senescence', 'geroprotect',
    'anti-aging', 'anti-inflammatory', 'antioxidant',
    'caloric restriction', 'fasting', 'healthspan',
    'collagen', 'skin aging', 'cardiovascular',
    'immune aging', 'immunosenescence', 'inflammaging',
    'gut microbiome', 'celastrol', 'akg', 'starvation',
    'lung aging', 'respiratory', 'dietary', 'nutrition',
    'muscle stem', 'kidney', 'ckd', 'vitamin d',
    'phytochemical', 'nanotechnology', 'diabetes',
  ];

  return longevityTerms.some(term => text.includes(term));
}

// ─── Generate Article Body ──────────────────────────────────────────────────

function generateArticleBody(topicId, topic, papers, matchedProducts) {
  const sections = [];

  // Summary section
  sections.push(`## Summary\n`);
  if (papers.length === 1) {
    const p = papers[0];
    const cleanAbstract = cleanText(p.abstract || '');
    sections.push(summarizeAbstract(cleanAbstract));
  } else {
    sections.push(
      `New research sheds light on **${topic.label}** and its implications for healthy aging. ` +
      `We reviewed ${papers.length} recent studies exploring this topic — here's what the science says.\n`
    );
  }

  // Key Findings
  sections.push(`\n## Key Findings\n`);
  for (const paper of papers.slice(0, 5)) {
    const finding = extractKeyFinding(paper);
    if (finding) {
      sections.push(`- **${shortenTitle(paper.title)}:** ${finding}`);
    }
  }

  // What This Means
  sections.push(`\n## What This Means For You\n`);
  sections.push(generatePracticalImplications(topicId, papers, matchedProducts));

  // Related Products
  if (matchedProducts.length > 0) {
    sections.push(`\n## Related Products\n`);
    for (const prod of matchedProducts.slice(0, 4)) {
      sections.push(
        `- **${prod.name}** (Grade ${prod.evidenceGrade}) — ${prod.dosage?.standard || 'See dosage details'}` +
        (prod.mechanisms?.length ? `\n  *Mechanisms:* ${prod.mechanisms.join(', ')}` : '')
      );
    }
  }

  // Sources
  sections.push(`\n## Sources\n`);
  for (const paper of papers) {
    const journal = paper.journal ? ` *${paper.journal}*` : '';
    const doi = paper.doi ? ` [DOI](https://doi.org/${paper.doi})` : '';
    sections.push(`- ${shortenTitle(paper.title)}${journal}${doi}`);
  }

  return sections.join('\n');
}

function cleanText(text) {
  return text
    .replace(/&#x[0-9a-fA-F]+;/g, '')  // remove HTML entities
    .replace(/\s+/g, ' ')
    .trim();
}

function summarizeAbstract(abstract) {
  if (!abstract) return 'This study explores emerging findings in longevity research.\n';
  
  // Take first 2-3 sentences for summary
  const sentences = abstract.match(/[^.!?]+[.!?]+/g) || [abstract];
  const summary = sentences.slice(0, 3).join(' ').trim();
  return summary + '\n';
}

function shortenTitle(title) {
  if (!title) return 'Untitled study';
  // Remove trailing period, clean up HTML entities
  let clean = cleanText(title).replace(/\.$/, '');
  if (clean.length > 100) {
    clean = clean.slice(0, 97) + '...';
  }
  return clean;
}

function extractKeyFinding(paper) {
  const abstract = cleanText(paper.abstract || '');
  if (!abstract) return null;

  // Look for result-oriented sentences
  const sentences = abstract.match(/[^.!?]+[.!?]+/g) || [];
  
  // Prefer sentences with result indicators
  const resultWords = ['demonstrate', 'show', 'found', 'reveal', 'suggest', 'indicate',
    'reduce', 'increase', 'improve', 'extend', 'protect', 'attenuate', 'enhance',
    'mitigate', 'restore', 'activate', 'inhibit', 'prevent'];
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (resultWords.some(w => lower.includes(w))) {
      const trimmed = sentence.trim();
      return trimmed.length > 200 ? trimmed.slice(0, 197) + '...' : trimmed;
    }
  }

  // Fallback: last sentence (often conclusion)
  if (sentences.length > 0) {
    const last = sentences[sentences.length - 1].trim();
    return last.length > 200 ? last.slice(0, 197) + '...' : last;
  }

  return null;
}

function generatePracticalImplications(topicId, papers, products) {
  const implications = {
    'nad-and-cellular-energy': 
      'NAD+ is a critical molecule for cellular energy and DNA repair, and its levels naturally decline with age. ' +
      'These findings reinforce the importance of supporting NAD+ pathways — whether through precursors like NMN or NR, ' +
      'or lifestyle factors that preserve NAD+ levels. Maintaining adequate NAD+ from an early age may be more important than previously thought.',
    'senolytics-and-senescence':
      'Senescent cells — "zombie cells" that stop dividing but refuse to die — contribute to inflammation and tissue damage. ' +
      'Research into senolytics (compounds that clear these cells) continues to show promise. ' +
      'While most senolytic compounds are still experimental, the field is rapidly advancing toward clinical applications.',
    'mitochondrial-health':
      'Your mitochondria are the powerhouses of your cells, and their decline is one of the hallmarks of aging. ' +
      'Supporting mitochondrial function through targeted supplements like CoQ10, Urolithin A, or PQQ, ' +
      'combined with exercise (especially Zone 2 cardio), may help maintain energy and cellular health as you age.',
    'autophagy-and-cellular-cleanup':
      'Autophagy — your body\'s cellular recycling system — is crucial for clearing damaged proteins and organelles. ' +
      'These studies highlight how autophagy can be activated through fasting, rapamycin, or natural compounds like spermidine. ' +
      'Regular autophagy activation may slow the accumulation of cellular damage that drives aging.',
    'berberine-and-metabolic-health':
      'Berberine continues to demonstrate impressive metabolic benefits, activating AMPK — the body\'s "metabolic master switch." ' +
      'Often compared to metformin, berberine may support glucose regulation, reduce inflammation, and modulate the gut microbiome. ' +
      'If you\'re looking for a natural approach to metabolic health, berberine is one of the most evidence-backed options.',
    'muscle-aging-and-sarcopenia':
      'Muscle loss (sarcopenia) is one of the most impactful aspects of aging, affecting mobility, metabolism, and independence. ' +
      'These studies reveal new mechanisms behind muscle stem cell decline and point to both nutritional and exercise-based interventions. ' +
      'Resistance training remains the gold standard, but understanding the molecular basis helps identify complementary strategies.',
    'alzheimers-and-neuroprotection':
      'Protecting brain health is a top priority in longevity research. These findings highlight both the mechanisms of neurodegeneration ' +
      'and potential protective strategies. Compounds like taurine and senolytic approaches show promise in preclinical models. ' +
      'A combination of cognitive engagement, exercise, sleep optimization, and targeted supplements may offer the best protection.',
    'vitamins-and-minerals':
      'Even in 2026, vitamin and mineral deficiencies remain surprisingly common and significantly impact health outcomes. ' +
      'These studies remind us that the foundation of any longevity protocol should include optimizing essential nutrients — ' +
      'particularly Vitamin D, folate, and key minerals. Testing your levels and supplementing accordingly is a simple, high-ROI strategy.',
    'epigenetics-and-aging':
      'Your genes aren\'t your destiny — epigenetic modifications (chemical tags on DNA) control which genes are active and change with age. ' +
      'Understanding these epigenetic clocks and modifications opens doors to interventions that could literally reverse biological aging. ' +
      'This is one of the most exciting frontiers in longevity science.',
    'polyamines-and-longevity':
      'Polyamines (spermidine, putrescine, spermine) are essential for cell growth and autophagy. Their levels decline with age, ' +
      'and supplementing with spermidine has shown promise for extending lifespan in animal models and improving cardiovascular markers in humans. ' +
      'Polyamine-rich foods include wheat germ, soybeans, aged cheese, and mushrooms.',
    'ferroptosis-and-oxidative-stress':
      'Ferroptosis — a form of cell death driven by iron and lipid damage — is increasingly recognized as a key aging mechanism. ' +
      'Managing oxidative stress through antioxidants, Nrf2 activators, and iron balance may help prevent this destructive process. ' +
      'Compounds like sulforaphane and curcumin activate protective Nrf2 pathways naturally.',
    'gut-longevity-axis':
      'The gut-brain-longevity axis is emerging as a central regulator of aging. Your gut microbiome communicates with your brain and ' +
      'influences everything from inflammation to metabolism to mood. Maintaining gut health through fiber, fermented foods, and ' +
      'targeted probiotics (like Akkermansia) may be one of the simplest ways to support healthy aging.',
    'urolithin-a-and-mitophagy':
      'Urolithin A activates mitophagy — the process of recycling damaged mitochondria — and has shown improvements in muscle function ' +
      'in clinical trials. It\'s naturally produced from pomegranate compounds by gut bacteria, but direct supplementation ensures ' +
      'consistent levels regardless of your individual microbiome composition.',
    'kidney-aging':
      'The kidneys are among the organs most affected by aging, with metabolic and epigenetic changes accumulating over time. ' +
      'Supporting kidney health through hydration, blood pressure management, and avoiding nephrotoxic substances becomes increasingly important. ' +
      'Emerging research points to metabolic interventions that could slow kidney aging.',
    'dietary-nutrition-longevity':
      'Nutrition remains the most accessible lever for longevity. These studies reinforce that a whole-foods-based diet, ' +
      'rich in phytochemicals and essential nutrients, provides the foundation for any anti-aging protocol. ' +
      'No supplement can replace a poor diet — start with nutrition, then optimize with targeted supplementation.',
    'lung-aging-and-respiratory':
      'Lung function declines significantly with age, and cellular senescence in lung tissue contributes to respiratory disease. ' +
      'Natural senotherapeutics and anti-inflammatory compounds may help maintain lung health. ' +
      'Regular aerobic exercise remains one of the best ways to preserve respiratory function.',
  };

  return implications[topicId] || 
    'This research contributes to our growing understanding of the aging process and potential interventions. ' +
    'While more human studies are needed, the findings point to actionable strategies for healthy aging. ' +
    'Consult a healthcare professional before making changes to your health routine.';
}

// ─── Generate Engaging Title ────────────────────────────────────────────────

function generateTitle(topicId, topic, papers) {
  const titles = {
    'nad-and-cellular-energy': [
      'NAD+ and the Energy of Youth: What New Research Reveals',
      'Why NAD+ Levels May Be the Key to Aging Well',
      'The NAD+ Connection: From Cellular Energy to Longevity',
    ],
    'senolytics-and-senescence': [
      'Clearing Zombie Cells: The Latest in Senolytic Research',
      'New Senolytics Show Promise for Extending Healthspan',
      'The War on Senescent Cells: What Science Says Now',
    ],
    'mitochondrial-health': [
      'Powering Longevity: New Insights into Mitochondrial Health',
      'Why Your Mitochondria Hold the Key to Aging',
      'Mitochondrial Dysfunction and Aging: Latest Findings',
    ],
    'autophagy-and-cellular-cleanup': [
      'Cellular Spring Cleaning: How Autophagy Fights Aging',
      'Autophagy and Longevity: The Science of Cellular Renewal',
      'Your Body\'s Recycling System May Be the Key to Living Longer',
    ],
    'berberine-and-metabolic-health': [
      'Berberine: Nature\'s Answer to Metabolic Health',
      'The AMPK Activator: How Berberine Supports Longevity',
      'Berberine\'s Multi-System Benefits Continue to Impress Researchers',
    ],
    'muscle-aging-and-sarcopenia': [
      'Fighting Muscle Loss: What New Research Tells Us About Aging',
      'Sarcopenia and Beyond: The Science of Muscle Preservation',
      'Why Muscle Health Is a Longevity Priority',
    ],
    'alzheimers-and-neuroprotection': [
      'Protecting the Aging Brain: New Frontiers in Neuroprotection',
      'From Senescence to Supplements: Fighting Alzheimer\'s on Multiple Fronts',
      'Brain Health and Longevity: What the Latest Research Shows',
    ],
    'vitamins-and-minerals': [
      'Back to Basics: Why Vitamins and Minerals Still Matter for Longevity',
      'Essential Nutrients for Aging Well: New Evidence Reviewed',
      'The Vitamin D Debate and Beyond: Optimizing Nutrient Levels',
    ],
    'epigenetics-and-aging': [
      'Rewriting Your Aging Code: Epigenetics and Longevity',
      'The Epigenetic Clock: Can We Turn Back Time?',
      'Beyond Genetics: How Epigenetic Changes Drive Aging',
    ],
    'polyamines-and-longevity': [
      'Polyamines: The Overlooked Longevity Molecules',
      'Spermidine and Beyond: How Polyamines Support Healthy Aging',
      'The Polyamine Pathway to Longevity',
    ],
    'ferroptosis-and-oxidative-stress': [
      'Iron, Rust, and Aging: Understanding Ferroptosis',
      'Oxidative Stress and Ferroptosis: New Targets for Anti-Aging',
      'Fighting Cellular Rust: The Ferroptosis-Aging Connection',
    ],
    'gut-longevity-axis': [
      'Your Gut Talks to Your Brain — And It Affects How You Age',
      'The Gut-Longevity Axis: How Your Microbiome Shapes Aging',
      'From Gut to Lifespan: New Research on the Microbiome Connection',
    ],
    'urolithin-a-and-mitophagy': [
      'Urolithin A: The Mitophagy Activator Gaining Scientific Momentum',
      'Recycling Damaged Mitochondria: Urolithin A\'s Promise',
      'Urolithin A and Mitophagy: From Pomegranates to Pill Form',
    ],
    'kidney-aging': [
      'The Aging Kidney: Metabolic Changes and What They Mean',
      'Kidney Health and Longevity: What New Research Reveals',
      'How Your Kidneys Age — And What You Can Do About It',
    ],
    'dietary-nutrition-longevity': [
      'Eating for Longevity: What the Science Actually Says',
      'Nutrition as Medicine: Dietary Strategies for Healthy Aging',
      'The Food-Longevity Connection: Latest Evidence Reviewed',
    ],
    'lung-aging-and-respiratory': [
      'Breathing Easy as You Age: Lung Health and Senescence',
      'Natural Approaches to Lung Aging: What the Research Shows',
      'Senotherapeutics for Lung Health: A Promising Frontier',
    ],
  };

  const options = titles[topicId] || [`New Research in ${topic.label}: What You Need to Know`];
  // Deterministic: use number of papers as index
  return options[papers.length % options.length];
}

// ─── Generate Summary ───────────────────────────────────────────────────────

function generateSummary(topicId, topic, papers, products) {
  const paperCount = papers.length;
  const productNames = products.slice(0, 3).map(p => p.name).join(', ');
  const studyTypes = [...new Set(papers.map(p => mapStudyType(p.studyType)))];

  let summary = '';
  
  if (paperCount === 1) {
    const p = papers[0];
    const cleanAbstract = cleanText(p.abstract || '');
    const firstSentence = cleanAbstract.match(/^[^.!?]+[.!?]/)?.[0] || '';
    summary = firstSentence + ' ';
    summary += `Published in ${p.journal || 'a leading journal'}, this ${mapStudyType(p.studyType).toLowerCase()} study `;
    summary += `explores implications for ${topic.label.toLowerCase()}.`;
  } else {
    summary = `A review of ${paperCount} recent ${studyTypes.join(' and ').toLowerCase()} studies on ${topic.label.toLowerCase()}. `;
    if (products.length > 0) {
      summary += `Related supplements include ${productNames}. `;
    }
    summary += `Here's what the latest science tells us about this important area of longevity research.`;
  }

  return summary;
}

// ─── Determine if Featured ──────────────────────────────────────────────────

function shouldFeature(topicId, papers) {
  // Feature if: multiple papers (hot topic), or high-evidence study, or exceptional findings
  if (papers.length >= 3) return true;
  
  const hasHighEvidence = papers.some(p => ['rct', 'meta-analysis', 'cohort'].includes(p.studyType?.toLowerCase()));
  if (hasHighEvidence) return true;

  // Feature certain popular topics
  const hotTopics = ['nad-and-cellular-energy', 'senolytics-and-senescence', 'berberine-and-metabolic-health'];
  if (hotTopics.includes(topicId)) return true;

  return false;
}

// ─── Get Best Evidence Level for Group ──────────────────────────────────────

function bestEvidenceLevel(papers) {
  let best = 'Preprint';
  let bestRank = -1;
  for (const p of papers) {
    const level = mapStudyType(p.studyType);
    const rank = evidenceRank(level);
    if (rank > bestRank) {
      bestRank = rank;
      best = level;
    }
  }
  return best;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

async function generateArticles() {
  console.log('🧬 Longivity Content Generator');
  console.log('━'.repeat(50));

  // Ensure articles directory exists
  if (!existsSync(ARTICLES_DIR)) {
    await mkdir(ARTICLES_DIR, { recursive: true });
  }

  // Load data
  console.log('\n📚 Loading knowledge base...');
  const papers = await loadJsonDir(RESEARCH_DIR);
  const products = await loadJsonDir(PRODUCTS_DIR);
  console.log(`   ${papers.length} research papers`);
  console.log(`   ${products.length} products`);

  // Check existing articles to avoid duplicates
  const existingFiles = await readdir(ARTICLES_DIR).catch(() => []);
  const existingIds = new Set(
    existingFiles
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  );
  console.log(`   ${existingIds.size} existing articles`);

  // Filter to longevity-relevant papers
  const relevantPapers = papers.filter(isLongevityRelevant);
  console.log(`   ${relevantPapers.length} longevity-relevant papers (filtered from ${papers.length})`);

  // Group papers by topic
  console.log('\n🔬 Grouping papers by topic...');
  const topicGroups = {};

  for (const paper of relevantPapers) {
    const matches = matchPaperToTopics(paper);
    if (matches.length === 0) continue;

    // Assign to top matching topic
    const bestTopic = matches[0].topicId;
    if (!topicGroups[bestTopic]) {
      topicGroups[bestTopic] = [];
    }
    topicGroups[bestTopic].push(paper);
  }

  const topicCount = Object.keys(topicGroups).length;
  console.log(`   Found ${topicCount} topic groups`);

  for (const [topicId, topicPapers] of Object.entries(topicGroups)) {
    console.log(`   • ${TOPIC_KEYWORDS[topicId]?.label || topicId}: ${topicPapers.length} papers`);
  }

  // Generate articles
  console.log('\n✍️  Generating articles...');
  let generated = 0;
  let skipped = 0;

  for (const [topicId, topicPapers] of Object.entries(topicGroups)) {
    const topic = TOPIC_KEYWORDS[topicId];
    if (!topic) continue;

    const articleId = topicId;

    // Skip if already exists
    if (existingIds.has(articleId)) {
      console.log(`   ⏭ Skipped "${topic.label}" (already exists)`);
      skipped++;
      continue;
    }

    // Find matching products
    const matchedProducts = matchProductsToTopic(topicId, products);

    // Generate article content
    const title = generateTitle(topicId, topic, topicPapers);
    const summary = generateSummary(topicId, topic, topicPapers, matchedProducts);
    const body = generateArticleBody(topicId, topic, topicPapers, matchedProducts);
    const evidenceLevel = bestEvidenceLevel(topicPapers);
    const featured = shouldFeature(topicId, topicPapers);

    // Collect tags from all papers and products
    const allTags = new Set();
    for (const p of topicPapers) {
      (p.tags || []).forEach(t => allTags.add(t.toLowerCase()));
    }
    for (const p of matchedProducts) {
      (p.tags || []).forEach(t => allTags.add(t.toLowerCase()));
    }
    // Add topic keywords as tags too
    topic.keywords.slice(0, 3).forEach(k => allTags.add(k.toLowerCase()));

    const article = {
      id: articleId,
      title,
      summary,
      body,
      category: topic.category,
      tags: [...allTags].slice(0, 10),
      evidenceLevel,
      relatedProducts: matchedProducts.map(p => slugify(p.name)),
      sourcePapers: topicPapers.map(p => ({
        title: shortenTitle(p.title),
        doi: p.doi || null,
        journal: p.journal || null,
      })),
      createdAt: new Date().toISOString(),
      featured,
    };

    // Save
    const filePath = join(ARTICLES_DIR, `${articleId}.json`);
    await writeFile(filePath, JSON.stringify(article, null, 2));
    console.log(`   ✅ "${title}" (${topicPapers.length} papers, ${matchedProducts.length} products${featured ? ', ⭐ featured' : ''})`);
    generated++;
  }

  console.log('\n' + '━'.repeat(50));
  console.log(`📊 Results: ${generated} generated, ${skipped} skipped`);
  console.log(`📁 Articles saved to: ${ARTICLES_DIR}`);
  console.log('✨ Done!\n');
}

// Run
generateArticles().catch(err => {
  console.error('❌ Content generation failed:', err);
  process.exit(1);
});
