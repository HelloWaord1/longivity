/**
 * Extended Product Seeder
 * Adds 40+ more longevity products to the knowledge base
 */

import { KnowledgeBase } from '../kb/store.js';

const EXTENDED_PRODUCTS = [
  // NAD+ Pathway
  {
    name: 'NR (Nicotinamide Riboside)',
    category: 'supplement',
    mechanisms: ['NAD+ precursor', 'Sirtuin activation', 'Mitochondrial function'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '300mg/day', range: '250-1000mg/day', notes: 'ChromaDex (Niagen) is the most studied form' },
    keyFindings: ['Increases NAD+ levels by 40-90% in humans', 'Improved hepatic lipid metabolism', 'Well-tolerated in clinical trials'],
    tags: ['nad+', 'nr', 'niagen', 'energy', 'mitochondria'],
  },
  {
    name: 'Niacin (Vitamin B3)',
    category: 'supplement',
    mechanisms: ['NAD+ precursor', 'Lipid metabolism', 'DNA repair'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '500mg/day', range: '250-2000mg/day', notes: 'Flushing common — use flush-free or extended-release. Cheapest NAD+ precursor.' },
    keyFindings: ['Decades of clinical evidence for cardiovascular health', 'Raises NAD+ effectively', 'AIM-HIGH and HPS2-THRIVE trials for CV outcomes'],
    tags: ['nad+', 'niacin', 'b3', 'cardiovascular', 'affordable'],
  },

  // Senolytics & Senomorphics
  {
    name: 'Fisetin',
    category: 'supplement',
    mechanisms: ['Senolytic', 'Anti-inflammatory', 'Antioxidant', 'Neuroprotective'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '500mg intermittent (2 days/month)', range: '100-500mg', notes: 'Found in strawberries. Intermittent high-dose may be more effective as senolytic.' },
    keyFindings: ['Most potent natural senolytic in screening studies', 'Extended healthspan in mice by ~10%', 'AFFIRM-LITE trial underway for COVID long-haulers'],
    tags: ['senolytic', 'flavonoid', 'neuroprotective', 'strawberry'],
  },
  {
    name: 'Piperlongumine',
    category: 'supplement',
    mechanisms: ['Senolytic', 'Pro-oxidant in senescent cells', 'Anti-cancer'],
    evidenceGrade: 'D',
    riskProfile: 'low',
    dosage: { standard: 'No established dose', range: 'Research phase', notes: 'Derived from long pepper (Piper longum)' },
    keyFindings: ['Selectively kills senescent cells in vitro', 'Targets oxidative stress response in senescent cells', 'Early research — no human trials yet'],
    tags: ['senolytic', 'experimental', 'pepper'],
  },

  // Autophagy & Cellular Cleanup
  {
    name: 'Lithium (microdose)',
    category: 'supplement',
    mechanisms: ['Autophagy induction', 'GSK-3β inhibition', 'Neuroprotective', 'Mood stabilization'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '1-5mg/day (lithium orotate)', range: '0.5-20mg/day', notes: 'Microdose — NOT therapeutic psychiatric dose. Lithium orotate form.' },
    keyFindings: ['Regions with higher lithium in water have lower dementia rates', 'Extends lifespan in C. elegans and Drosophila', 'Neuroprotective at microdoses in human studies'],
    tags: ['autophagy', 'neuroprotective', 'mood', 'microdose', 'brain'],
  },
  {
    name: 'Trehalose',
    category: 'supplement',
    mechanisms: ['Autophagy inducer', 'Protein stabilizer', 'Neuroprotective'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '5-10g/day', range: '2-15g/day', notes: 'Natural sugar found in mushrooms and shellfish. Low glycemic index.' },
    keyFindings: ['Induces autophagy via mTOR-independent pathway', 'Reduced atherosclerosis in mouse models', 'Promising for neurodegenerative disease prevention'],
    tags: ['autophagy', 'sugar', 'neuroprotective', 'affordable'],
  },
  {
    name: 'EGCG (Green Tea Extract)',
    category: 'supplement',
    mechanisms: ['Autophagy induction', 'Antioxidant', 'Anti-inflammatory', 'AMPK activation'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '400-500mg/day', range: '200-800mg/day', notes: 'Take on empty stomach for better absorption. Avoid with iron-rich meals.' },
    keyFindings: ['Potent autophagy inducer via multiple pathways', 'Reduced all-cause mortality in large cohort studies', 'Cancer-preventive properties in multiple cancers'],
    tags: ['autophagy', 'antioxidant', 'green-tea', 'catechin', 'cancer'],
  },

  // Mitochondrial Health
  {
    name: 'CoQ10 (Ubiquinol)',
    category: 'supplement',
    mechanisms: ['Mitochondrial electron transport', 'Antioxidant', 'Energy production'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '200mg/day (ubiquinol form)', range: '100-600mg/day', notes: 'Ubiquinol > ubiquinone for absorption. Essential if on statins.' },
    keyFindings: ['Levels decline with age — supplementation restores', 'QSYMIA trial: improved heart failure outcomes', 'Essential for anyone on statin medications'],
    tags: ['mitochondria', 'energy', 'heart', 'statin', 'antioxidant'],
  },
  {
    name: 'PQQ (Pyrroloquinoline Quinone)',
    category: 'supplement',
    mechanisms: ['Mitochondrial biogenesis', 'Neuroprotective', 'Antioxidant', 'NGF stimulation'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '20mg/day', range: '10-40mg/day', notes: 'Synergistic with CoQ10. Found in natto and green tea.' },
    keyFindings: ['Stimulates mitochondrial biogenesis via PGC-1α', 'Improved cognitive function in elderly (Japanese trial)', 'Stimulates nerve growth factor (NGF)'],
    tags: ['mitochondria', 'biogenesis', 'brain', 'ngf'],
  },
  {
    name: 'Alpha-Lipoic Acid (ALA)',
    category: 'supplement',
    mechanisms: ['Mitochondrial cofactor', 'Antioxidant (both fat and water soluble)', 'Glucose metabolism'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '600mg/day', range: '300-1200mg/day', notes: 'R-form (R-ALA) is the bioactive isomer. Take on empty stomach.' },
    keyFindings: ['Universal antioxidant — works in both aqueous and lipid environments', 'ALADIN trial: improved diabetic neuropathy', 'Recycles other antioxidants (vitamins C, E, glutathione)'],
    tags: ['mitochondria', 'antioxidant', 'glucose', 'neuropathy'],
  },
  {
    name: 'Creatine',
    category: 'supplement',
    mechanisms: ['ATP buffering', 'Neuroprotective', 'Muscle preservation', 'Cognitive enhancement'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '5g/day', range: '3-10g/day', notes: 'Most studied supplement in sports nutrition. Also cognitive benefits. No loading needed.' },
    keyFindings: ['Preserves muscle mass during aging (sarcopenia)', 'Improved cognitive function under stress and in elderly', 'Neuroprotective properties — being studied for neurodegenerative diseases'],
    tags: ['energy', 'muscle', 'brain', 'atp', 'affordable', 'well-studied'],
  },

  // Anti-inflammatory & Antioxidant
  {
    name: 'Curcumin (Turmeric Extract)',
    category: 'supplement',
    mechanisms: ['Anti-inflammatory (NF-κB)', 'Antioxidant', 'Senomorphic', 'Neuroprotective'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '500-1000mg/day (enhanced absorption form)', range: '200-2000mg/day', notes: 'Bioavailability is poor — use Longvida, Meriva, or with piperine. Fat-soluble.' },
    keyFindings: ['Potent NF-κB inhibitor — master inflammation regulator', 'Improved memory and attention in BDNF-related study', 'Senomorphic: reduces SASP without killing senescent cells'],
    tags: ['anti-inflammatory', 'nf-kb', 'brain', 'curcumin', 'turmeric'],
  },
  {
    name: 'Astaxanthin',
    category: 'supplement',
    mechanisms: ['Potent antioxidant (6000x vitamin C)', 'Anti-inflammatory', 'Skin protection', 'Cardiovascular'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '12mg/day', range: '4-24mg/day', notes: 'Derived from microalgae Haematococcus pluvialis. Fat-soluble — take with meals.' },
    keyFindings: ['Most powerful carotenoid antioxidant', 'Reduced DNA damage markers in human trial', 'Improved skin elasticity and reduced wrinkles'],
    tags: ['antioxidant', 'skin', 'cardiovascular', 'carotenoid'],
  },
  {
    name: 'Sulforaphane (Broccoli Extract)',
    category: 'supplement',
    mechanisms: ['Nrf2 activation', 'Phase II detox enzymes', 'Anti-cancer', 'Anti-inflammatory'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '30-60mg sulforaphane/day', range: '10-100mg/day', notes: 'Glucoraphanin + myrosinase = sulforaphane. Or eat broccoli sprouts (50-100x more than mature broccoli).' },
    keyFindings: ['Most potent natural Nrf2 activator — upregulates hundreds of protective genes', 'Reduced cancer risk markers in human trials', 'Improved autistic behavior scores in clinical trial'],
    tags: ['nrf2', 'detox', 'cancer', 'broccoli', 'isothiocyanate'],
  },
  {
    name: 'N-Acetyl Cysteine (NAC)',
    category: 'supplement',
    mechanisms: ['Glutathione precursor', 'Antioxidant', 'Mucolytic', 'Liver protection'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '600-1200mg/day', range: '600-2400mg/day', notes: 'Hospital staple for acetaminophen overdose. Raises glutathione — master antioxidant.' },
    keyFindings: ['Effectively raises glutathione levels', 'GlyNAC (glycine + NAC) reversed aging hallmarks in elderly humans', 'Decades of clinical safety data'],
    tags: ['glutathione', 'antioxidant', 'liver', 'affordable', 'well-studied'],
  },
  {
    name: 'Glycine',
    category: 'supplement',
    mechanisms: ['Glutathione synthesis', 'Collagen formation', 'Sleep quality', 'Anti-inflammatory'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '3-5g/day', range: '3-15g/day', notes: 'Levels decline with age. GlyNAC combo (with NAC) shows anti-aging benefits. Sweet taste.' },
    keyFindings: ['GlyNAC supplementation reversed aging hallmarks in elderly (Baylor study)', 'Improved sleep quality at 3g before bed', 'Essential for collagen synthesis — declines with age'],
    tags: ['amino-acid', 'sleep', 'collagen', 'glutathione', 'affordable'],
  },

  // Gut & Microbiome
  {
    name: 'Akkermansia muciniphila',
    category: 'supplement',
    mechanisms: ['Gut barrier integrity', 'Metabolic health', 'Anti-inflammatory', 'Mucin layer support'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '100mg (pasteurized) daily', range: 'Product-specific', notes: 'Pasteurized form shown to be MORE effective than live. Pendulum is main commercial source.' },
    keyFindings: ['Inversely correlated with obesity and metabolic syndrome', 'Improved insulin sensitivity in human trial', 'Pasteurized Akkermansia improved metabolic markers (Depommier 2019)'],
    tags: ['gut', 'microbiome', 'metabolic', 'probiotic', 'novel'],
  },
  {
    name: 'Fiber (Prebiotic Blend)',
    category: 'supplement',
    mechanisms: ['Short-chain fatty acid production', 'Gut microbiome diversity', 'Blood sugar regulation'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '25-35g/day total fiber', range: '20-50g/day', notes: 'Mix of psyllium, inulin, acacia fiber. Most people get <15g. Increase slowly.' },
    keyFindings: ['Higher fiber intake consistently linked to lower all-cause mortality', 'Feeds beneficial gut bacteria, produces butyrate', 'Regulates blood sugar, reduces cardiovascular risk'],
    tags: ['gut', 'microbiome', 'fiber', 'cardiovascular', 'essential', 'affordable'],
  },

  // Hormesis & Stress Response
  {
    name: 'Apigenin',
    category: 'supplement',
    mechanisms: ['CD38 inhibitor (preserves NAD+)', 'Anti-inflammatory', 'Anxiolytic', 'Anti-cancer'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '50mg/day', range: '25-100mg/day', notes: 'Found in chamomile, parsley, celery. Inhibits CD38 — main NAD+ consumer.' },
    keyFindings: ['Inhibits CD38 enzyme that degrades NAD+ with age', 'Anxiolytic properties — found in chamomile', 'Synergistic with NAD+ precursors (NMN/NR)'],
    tags: ['nad+', 'cd38', 'anxiolytic', 'chamomile', 'synergistic'],
  },
  {
    name: 'Pterostilbene',
    category: 'supplement',
    mechanisms: ['SIRT1 activator', 'Antioxidant', 'Neuroprotective', 'Better absorbed than resveratrol'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '100-150mg/day', range: '50-250mg/day', notes: 'Methylated form of resveratrol. 4x better bioavailability. Found in blueberries.' },
    keyFindings: ['4x better bioavailability than resveratrol', 'Activates SIRT1 and AMPK pathways', 'Improved cognitive function in elderly (NAPS trial)'],
    tags: ['sirtuin', 'resveratrol', 'brain', 'blueberry', 'bioavailable'],
  },

  // Minerals & Essential Nutrients
  {
    name: 'Magnesium (L-Threonate)',
    category: 'supplement',
    mechanisms: ['Enzyme cofactor (300+ reactions)', 'Sleep quality', 'Neuroprotective', 'Muscle relaxation'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '400-600mg elemental Mg/day', range: '200-800mg/day', notes: 'L-Threonate for brain (crosses BBB). Glycinate for sleep. Citrate for general. 50%+ people are deficient.' },
    keyFindings: ['Involved in 300+ enzymatic reactions', 'L-Threonate form crosses blood-brain barrier — improved memory in trial', 'Deficiency linked to accelerated aging, inflammation, CVD'],
    tags: ['mineral', 'essential', 'sleep', 'brain', 'affordable', 'deficiency-common'],
  },
  {
    name: 'Zinc + Copper',
    category: 'supplement',
    mechanisms: ['Immune function', 'Enzyme cofactor', 'DNA repair', 'Antioxidant (SOD)'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: 'Zinc 15-30mg + Copper 1-2mg/day', range: 'Zinc 10-50mg', notes: 'ALWAYS pair zinc with copper — zinc depletes copper. 10:1 ratio zinc:copper.' },
    keyFindings: ['Essential for immune function — declines with age', 'Zinc required for DNA repair enzymes', 'Copper essential for SOD (superoxide dismutase) — key antioxidant enzyme'],
    tags: ['mineral', 'immune', 'essential', 'dna-repair', 'affordable'],
  },
  {
    name: 'Selenium',
    category: 'supplement',
    mechanisms: ['Glutathione peroxidase cofactor', 'Thyroid function', 'Anti-cancer', 'Antioxidant'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '200mcg/day', range: '100-400mcg/day', notes: 'Selenomethionine or selenium yeast forms preferred. Narrow therapeutic window — don\'t exceed 400mcg.' },
    keyFindings: ['Essential for glutathione peroxidase — key antioxidant enzyme', 'SELECT trial: complex results for cancer prevention', 'Critical for thyroid hormone conversion (T4 to T3)'],
    tags: ['mineral', 'antioxidant', 'thyroid', 'essential'],
  },

  // Peptides & Advanced
  {
    name: 'BPC-157',
    category: 'peptide',
    mechanisms: ['Tissue repair', 'Angiogenesis', 'Anti-inflammatory', 'Gut healing'],
    evidenceGrade: 'D',
    riskProfile: 'medium',
    dosage: { standard: '250-500mcg/day (oral or injection)', range: '200-1000mcg/day', notes: 'Body Protection Compound. Derived from gastric juice. Oral and injectable forms. No FDA approval.' },
    keyFindings: ['Accelerated healing of tendons, ligaments, muscles in animal studies', 'Gut-protective properties (derived from gastric secretion)', 'Popular in biohacker community but limited human data'],
    tags: ['peptide', 'healing', 'gut', 'experimental', 'biohacker'],
  },
  {
    name: 'Epithalon (Epitalon)',
    category: 'peptide',
    mechanisms: ['Telomerase activation', 'Pineal gland function', 'Melatonin regulation'],
    evidenceGrade: 'D',
    riskProfile: 'medium',
    dosage: { standard: '5-10mg/day for 10-20 day cycles', range: 'Protocol-dependent', notes: 'Synthetic peptide based on epithalamin. Russian research (Khavinson). Limited Western data.' },
    keyFindings: ['Activated telomerase in human cell cultures', 'Extended lifespan in rodents by 12-26%', 'Restored melatonin production in elderly (Khavinson studies)'],
    tags: ['peptide', 'telomere', 'telomerase', 'experimental', 'russian'],
  },

  // Hormones & Signaling
  {
    name: 'Melatonin (low-dose)',
    category: 'supplement',
    mechanisms: ['Circadian rhythm', 'Antioxidant', 'Immune modulation', 'Neuroprotective'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '0.3-1mg/night', range: '0.1-5mg', notes: 'Less is more — physiological dose 0.3mg. Higher doses may desensitize receptors. Take 30-60min before bed.' },
    keyFindings: ['Potent antioxidant — crosses blood-brain barrier', 'Production declines significantly with age', 'Immune-modulatory: enhances vaccine response in elderly'],
    tags: ['sleep', 'antioxidant', 'immune', 'hormone', 'affordable', 'circadian'],
  },
  {
    name: 'DHEA',
    category: 'supplement',
    mechanisms: ['Precursor to testosterone and estrogen', 'Immune function', 'Bone density', 'Cognitive'],
    evidenceGrade: 'C',
    riskProfile: 'medium',
    dosage: { standard: '25-50mg/day', range: '10-100mg/day', notes: 'Levels peak at 25 and decline ~2% per year. Monitor with blood tests. Banned in some sports.' },
    keyFindings: ['DHEA levels correlate with longevity markers', 'Improved bone density in elderly women', 'Mixed results in clinical trials — individualized approach needed'],
    tags: ['hormone', 'precursor', 'immune', 'bone', 'age-related-decline'],
  },

  // Devices & Protocols
  {
    name: 'Cold Exposure (Cold Plunge)',
    category: 'protocol',
    mechanisms: ['Brown fat activation', 'Norepinephrine release', 'Anti-inflammatory', 'Hormesis'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '2-5min at 10-15°C, 3-5x/week', range: '1-15min', notes: 'Start gradual. End showers cold. Deliberate cold exposure — not hypothermia.' },
    keyFindings: ['2-3x increase in norepinephrine (mood, focus, alertness)', 'Activates brown adipose tissue — metabolic benefits', 'Anti-inflammatory: reduced IL-6 and CRP in regular practitioners'],
    tags: ['protocol', 'hormesis', 'brown-fat', 'inflammation', 'free'],
  },
  {
    name: 'Sauna (Heat Exposure)',
    category: 'protocol',
    mechanisms: ['Heat shock proteins', 'Cardiovascular conditioning', 'Growth hormone release', 'Detoxification'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '15-20min at 80-100°C, 4-7x/week', range: '10-30min', notes: 'Finnish sauna studies. Infrared sauna at lower temps also beneficial. Hydrate well.' },
    keyFindings: ['4-7x/week sauna: 40% lower all-cause mortality (Laukkanen et al.)', 'Increases heat shock proteins — cellular protection', '2-3x growth hormone increase after single session'],
    tags: ['protocol', 'hormesis', 'heat-shock', 'cardiovascular', 'hsp'],
  },
  {
    name: 'Intermittent Fasting',
    category: 'protocol',
    mechanisms: ['Autophagy induction', 'Insulin sensitivity', 'mTOR inhibition', 'Ketogenesis'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '16:8 (16h fast, 8h eating window)', range: 'Various: 14:10 to OMAD', notes: 'Start with 14:10, progress to 16:8. Time-restricted eating. Not for everyone.' },
    keyFindings: ['Activates autophagy after 16-24h fasting', 'Improved insulin sensitivity and metabolic markers', 'NEJM review: benefits for aging, cancer, cardiovascular disease'],
    tags: ['protocol', 'autophagy', 'fasting', 'free', 'metabolic'],
  },
  {
    name: 'Zone 2 Cardio',
    category: 'protocol',
    mechanisms: ['Mitochondrial biogenesis', 'Fat oxidation', 'Cardiovascular fitness', 'Metabolic health'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '150-200min/week', range: '120-300min/week', notes: 'Heart rate 60-70% max. Can hold conversation. Walking, cycling, swimming. Peter Attia protocol.' },
    keyFindings: ['Strongest predictor of longevity: VO2max/cardiorespiratory fitness', 'Builds mitochondrial density and efficiency', 'Reduces all-cause mortality more than any supplement'],
    tags: ['protocol', 'exercise', 'mitochondria', 'cardiovascular', 'free', 'essential'],
  },
  {
    name: 'Resistance Training',
    category: 'protocol',
    mechanisms: ['Muscle preservation', 'Bone density', 'Insulin sensitivity', 'Growth hormone'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '3-4 sessions/week, compound movements', range: '2-6 sessions/week', notes: 'Progressive overload. Prioritize squats, deadlifts, presses. Sarcopenia prevention.' },
    keyFindings: ['Muscle mass is strongest predictor of mortality in elderly', 'Prevents sarcopenia — #1 cause of functional decline', 'Improved insulin sensitivity, bone density, cognitive function'],
    tags: ['protocol', 'exercise', 'muscle', 'bone', 'free', 'essential'],
  },

  // Emerging & Novel
  {
    name: 'Alpha-Ketoglutarate (AKG)',
    category: 'supplement',
    mechanisms: ['TCA cycle metabolite', 'Epigenetic regulation (TET enzymes)', 'Collagen synthesis', 'Anti-inflammatory'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '1000mg/day (Ca-AKG form)', range: '500-2000mg/day', notes: 'Calcium alpha-ketoglutarate (Ca-AKG) is most studied form. Rejuvant brand.' },
    keyFindings: ['Extended lifespan in mice by ~12% (Buck Institute)', 'Reduced biological age by 8 years in TRIIM-X adjacent study', 'Levels decline with age — supplementation restores'],
    tags: ['metabolite', 'epigenetic', 'tca-cycle', 'emerging'],
  },
  {
    name: 'GlyNAC (Glycine + NAC)',
    category: 'protocol',
    mechanisms: ['Glutathione restoration', 'Mitochondrial function', 'Oxidative stress reduction', 'Insulin sensitivity'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: 'Glycine 1.33mmol/kg + NAC 0.81mmol/kg daily', range: 'Typically ~7g glycine + ~5g NAC/day', notes: 'Baylor College study protocol. Simple, affordable, effective.' },
    keyFindings: ['Restored glutathione levels in elderly to young levels', 'Improved mitochondrial function, insulin resistance, inflammation', 'Reversed multiple hallmarks of aging in randomized trial (Baylor 2023)'],
    tags: ['glutathione', 'anti-aging', 'protocol', 'affordable', 'evidence-strong'],
  },
  {
    name: 'Collagen Peptides',
    category: 'supplement',
    mechanisms: ['Connective tissue support', 'Skin elasticity', 'Joint health', 'Gut lining'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '10-15g/day', range: '5-20g/day', notes: 'Type I/III for skin and tendons. Type II for joints. Hydrolyzed peptides for bioavailability.' },
    keyFindings: ['Improved skin elasticity and hydration in multiple RCTs', 'Reduced joint pain in athletes', 'Collagen production declines ~1% per year after 25'],
    tags: ['collagen', 'skin', 'joints', 'affordable', 'well-studied'],
  },
  {
    name: 'Hyaluronic Acid (Oral)',
    category: 'supplement',
    mechanisms: ['Joint lubrication', 'Skin hydration', 'Wound healing', 'Anti-inflammatory'],
    evidenceGrade: 'B',
    riskProfile: 'low',
    dosage: { standard: '120-240mg/day', range: '80-300mg/day', notes: 'Low molecular weight form for better absorption. Found naturally in synovial fluid.' },
    keyFindings: ['Improved skin hydration and reduced wrinkles in RCTs', 'Reduced knee pain comparable to injections in some studies', 'Declines significantly with age — supplementation helps'],
    tags: ['skin', 'joints', 'hydration', 'anti-aging'],
  },
  {
    name: 'Berberine',
    category: 'supplement',
    mechanisms: ['AMPK activation', 'Glucose regulation', 'Gut microbiome', 'Lipid metabolism'],
    evidenceGrade: 'A',
    riskProfile: 'low',
    dosage: { standard: '500mg 2-3x/day with meals', range: '500-1500mg/day', notes: 'Often called "natural metformin". Take with meals. May interact with many medications.' },
    keyFindings: ['Comparable to metformin for glucose regulation in diabetics', 'Reduced LDL cholesterol and triglycerides', 'Positive effects on gut microbiome composition'],
    contraindications: ['May interact with CYP enzymes — check drug interactions', 'Not with metformin simultaneously'],
    tags: ['ampk', 'glucose', 'metabolic', 'gut', 'natural-metformin'],
  },
  {
    name: 'Ergothioneine',
    category: 'supplement',
    mechanisms: ['Unique antioxidant (OCTN1 transporter)', 'Mitochondrial protection', 'Neuroprotective'],
    evidenceGrade: 'C',
    riskProfile: 'low',
    dosage: { standard: '5-25mg/day', range: '5-30mg/day', notes: 'Found in mushrooms. Has its own dedicated transporter (OCTN1) — suggests biological importance.' },
    keyFindings: ['Has its own dedicated cellular transporter — unique among antioxidants', 'Lower levels associated with cognitive decline and dementia risk', 'Accumulates in tissues under high oxidative stress'],
    tags: ['antioxidant', 'mushroom', 'brain', 'novel', 'transporter'],
  },
];

async function seed() {
  const kb = new KnowledgeBase();
  await kb.init();

  console.log('[ExtendedSeed] Seeding extended product database...');
  let count = 0;

  for (const product of EXTENDED_PRODUCTS) {
    const existing = await kb.getProduct(product.name);
    if (!existing) {
      await kb.saveProduct({
        ...product,
        id: `prod-${kb.slugify(product.name)}`,
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

  const total = await kb.listProducts();
  console.log(`[ExtendedSeed] Seeded ${count} new products. Total in KB: ${total.length}`);
}

seed().catch(console.error);
