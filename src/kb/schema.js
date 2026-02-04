/**
 * Knowledge Base Schema
 * Defines the structure for all longevity data
 */

// Evidence grades for scientific backing
export const EVIDENCE_GRADES = {
  A: { label: 'Strong', description: 'Multiple RCTs, meta-analyses' },
  B: { label: 'Moderate', description: 'Single RCT or strong observational' },
  C: { label: 'Emerging', description: 'Observational studies, pilot trials' },
  D: { label: 'Preliminary', description: 'In-vitro, animal studies, anecdotal' },
};

// Product categories
export const CATEGORIES = {
  SUPPLEMENT: 'supplement',
  PEPTIDE: 'peptide',
  PHARMACEUTICAL: 'pharmaceutical',
  DEVICE: 'device',
  PROTOCOL: 'protocol',
  LIFESTYLE: 'lifestyle',
};

// Product schema
export const productSchema = {
  id: '',                    // unique identifier
  name: '',                  // product name
  category: '',              // from CATEGORIES
  description: '',           // what it does
  mechanisms: [],            // mechanisms of action
  evidenceGrade: '',         // A/B/C/D
  keyFindings: [],           // summary of research findings
  dosage: {
    standard: '',            // standard dosage
    range: '',               // dosage range
    notes: '',               // special notes (timing, interactions)
  },
  interactions: [],          // known drug/supplement interactions
  sideEffects: [],           // known side effects
  contraindications: [],     // who should NOT take this
  sources: [],               // research paper references
  suppliers: [],             // where to buy { name, url, price, currency }
  communityReports: [],      // anonymized user reports
  expertOpinions: [],        // verified expert reviews
  riskProfile: '',           // low/medium/high
  tags: [],                  // searchable tags
  lastUpdated: '',           // ISO date
  createdAt: '',             // ISO date
};

// Research paper schema
export const researchSchema = {
  id: '',
  title: '',
  authors: [],
  journal: '',
  publishedDate: '',
  doi: '',
  url: '',
  abstract: '',
  summary: '',               // AI-generated summary
  studyType: '',             // RCT, meta-analysis, cohort, case-study, in-vitro, animal
  sampleSize: null,
  duration: '',
  keyFindings: [],
  relevantProducts: [],      // linked product IDs
  evidenceQuality: '',       // A/B/C/D
  tags: [],
  indexedAt: '',
};

// Community report schema
export const communityReportSchema = {
  id: '',
  demographics: {
    ageRange: '',             // e.g., "30-35"
    sex: '',                  // M/F/Other
    healthContext: '',        // general health context
  },
  stack: [],                  // { productId, dosage, duration }
  outcomes: [],               // { biomarker, before, after, unit }
  subjective: '',             // subjective experience
  reportedAt: '',
  verified: false,            // verified by expert
};
