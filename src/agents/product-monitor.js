/**
 * Product Monitor Agent
 * Tracks longevity supplements, prices, ratings, and certifications
 * Runs daily as OpenClaw cron job
 */

import { KnowledgeBase } from '../kb/store.js';

// Core longevity products to monitor
const CORE_PRODUCTS = [
  {
    name: 'NMN (Nicotinamide Mononucleotide)',
    category: 'supplement',
    mechanisms: ['NAD+ precursor', 'Sirtuin activation', 'DNA repair'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '500mg/day', range: '250-1000mg/day', notes: 'Sublingual may improve bioavailability' },
    keyFindings: [
      'Increases NAD+ levels in humans (doi:10.1126/science.abf1899)',
      'Improves insulin sensitivity in prediabetic women (doi:10.1126/science.abe9985)',
      'Enhances aerobic capacity in amateur runners (doi:10.1016/j.jare.2022.01.001)',
    ],
    tags: ['nad+', 'nmn', 'anti-aging', 'energy', 'dna-repair'],
  },
  {
    name: 'Resveratrol',
    category: 'supplement',
    mechanisms: ['Sirtuin activation (SIRT1)', 'Antioxidant', 'Anti-inflammatory'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '500mg/day', range: '150-1500mg/day', notes: 'Take with fat for better absorption. Synergistic with NMN.' },
    keyFindings: [
      'Activates SIRT1 and extends lifespan in model organisms',
      'Improves cardiovascular markers in humans',
      'Bioavailability concern — micronized forms preferred',
    ],
    tags: ['sirtuin', 'antioxidant', 'cardiovascular', 'polyphenol'],
  },
  {
    name: 'Rapamycin (low-dose)',
    category: 'pharmaceutical',
    mechanisms: ['mTOR inhibition', 'Autophagy induction', 'Immune modulation'],
    evidenceGrade: 'B',
    riskProfile: 'medium',
    dosage: { standard: '5-6mg/week', range: '1-8mg/week', notes: 'Intermittent dosing (weekly or biweekly). Requires medical supervision.' },
    keyFindings: [
      'Extends lifespan in mice by 10-25%',
      'PEARL trial: improved immune function in elderly at low doses',
      'Off-label use growing in longevity community',
    ],
    contraindications: ['Immunocompromised', 'Active infections', 'Upcoming surgery'],
    tags: ['mtor', 'autophagy', 'prescription', 'immune'],
  },
  {
    name: 'Metformin',
    category: 'pharmaceutical',
    mechanisms: ['AMPK activation', 'mTOR inhibition', 'Glucose regulation'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '500-1000mg/day', range: '500-2000mg/day', notes: 'Start low, increase gradually. May deplete B12.' },
    keyFindings: [
      'TAME trial ongoing — largest anti-aging drug trial',
      'Diabetics on metformin live longer than non-diabetic controls',
      'May blunt exercise benefits — timing matters',
    ],
    contraindications: ['Kidney disease (eGFR <30)', 'Active alcoholism', 'Severe liver disease'],
    tags: ['ampk', 'glucose', 'prescription', 'tame-trial'],
  },
  {
    name: 'Quercetin + Dasatinib',
    category: 'protocol',
    mechanisms: ['Senolytic — clears senescent cells', 'Anti-inflammatory'],
    evidenceGrade: 'C',
    riskProfile: 'medium',
    dosage: { standard: 'D:100mg + Q:1000mg, 3 days/month', range: 'Various protocols', notes: 'Intermittent dosing only. Dasatinib requires prescription.' },
    keyFindings: [
      'First senolytic combination shown to clear senescent cells in humans',
      'Improved physical function in IPF patients',
      'Hit-and-run approach — cells cleared but drugs not continuously needed',
    ],
    tags: ['senolytic', 'senescent-cells', 'protocol', 'intermittent'],
  },
  {
    name: 'Spermidine',
    category: 'supplement',
    mechanisms: ['Autophagy induction', 'Cardioprotective', 'Epigenetic regulation'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '1-5mg/day', range: '1-10mg/day', notes: 'Found naturally in wheat germ, natto, aged cheese' },
    keyFindings: [
      'Higher dietary spermidine intake associated with lower mortality in Bruneck Study',
      'Induces autophagy and extends lifespan in multiple organisms',
      'SmartAge trial: improved memory in elderly',
    ],
    tags: ['autophagy', 'cardioprotective', 'memory', 'polyamine'],
  },
  {
    name: 'Urolithin A',
    category: 'supplement',
    mechanisms: ['Mitophagy activation', 'Mitochondrial health', 'Muscle function'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '500-1000mg/day', range: '250-1000mg/day', notes: 'Gut microbiome converts ellagic acid to urolithin A, but only 40% of people can. Direct supplementation bypasses this.' },
    keyFindings: [
      'Improved mitochondrial health biomarkers in elderly (ATLAS trial)',
      'Enhanced muscle endurance and strength in older adults',
      'Manufactured by Timeline (Mitopure)',
    ],
    tags: ['mitophagy', 'mitochondria', 'muscle', 'gut-microbiome'],
  },
  {
    name: 'Taurine',
    category: 'supplement',
    mechanisms: ['Antioxidant', 'Anti-inflammatory', 'Osmotic regulation', 'Bile acid conjugation'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '1-3g/day', range: '500mg-6g/day', notes: 'Levels decline with age. Very safe even at high doses.' },
    keyFindings: [
      'Taurine deficiency identified as driver of aging (Science, 2023)',
      'Supplementation extended healthy lifespan in mice by ~10%',
      'Improved markers of aging in middle-aged monkeys',
    ],
    tags: ['amino-acid', 'antioxidant', 'affordable', 'well-studied'],
  },
  {
    name: 'Omega-3 (EPA/DHA)',
    category: 'supplement',
    mechanisms: ['Anti-inflammatory', 'Cardiovascular', 'Neuroprotective', 'Cell membrane integrity'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '2-4g/day (combined EPA+DHA)', range: '1-5g/day', notes: 'Higher EPA:DHA ratio for inflammation. Test omega-3 index (target 8-12%).' },
    keyFindings: [
      'Strong evidence for cardiovascular benefit',
      'Higher omega-3 index associated with longer telomeres',
      'VITAL trial: reduced heart attack risk by 28%',
    ],
    tags: ['omega-3', 'cardiovascular', 'brain', 'inflammation', 'essential'],
  },
  {
    name: 'Vitamin D3 + K2',
    category: 'supplement',
    mechanisms: ['Immune modulation', 'Calcium metabolism', 'Gene expression', 'Bone health'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: 'D3: 2000-5000 IU/day, K2: 100-200mcg/day', range: 'D3: 1000-10000 IU', notes: 'Test 25(OH)D levels. Target 40-60 ng/mL. K2 (MK-7 form) directs calcium to bones.' },
    keyFindings: [
      'Deficiency linked to higher all-cause mortality',
      'Immune function, cancer risk reduction at optimal levels',
      'Most studied supplement — strong safety profile',
    ],
    tags: ['vitamin-d', 'immune', 'bone', 'essential', 'affordable'],
  },
];

export class ProductMonitor {
  constructor() {
    this.kb = new KnowledgeBase();
  }

  async init() {
    await this.kb.init();
  }

  /**
   * Seed the knowledge base with core products
   */
  async seedCoreProducts() {
    console.log('[ProductMonitor] Seeding core longevity products...');
    let count = 0;

    for (const product of CORE_PRODUCTS) {
      const existing = await this.kb.getProduct(product.name);
      if (!existing) {
        await this.kb.saveProduct({
          ...product,
          id: `prod-${this.kb.slugify(product.name)}`,
          description: product.keyFindings?.[0] || '',
          interactions: product.interactions || [],
          sideEffects: product.sideEffects || [],
          contraindications: product.contraindications || [],
          sources: [],
          suppliers: [],
          communityReports: [],
          expertOpinions: [],
        });
        count++;
      }
    }

    console.log(`[ProductMonitor] Seeded ${count} new products.`);
    return count;
  }

  /**
   * Run monitoring cycle - check for price updates, new products
   * In MVP, this seeds core data. Later: web scraping for prices
   */
  async run() {
    console.log('[ProductMonitor] Starting monitoring cycle...');
    await this.seedCoreProducts();
    const products = await this.kb.listProducts();
    console.log(`[ProductMonitor] Knowledge base has ${products.length} products.`);
    return { products: products.length };
  }
}
