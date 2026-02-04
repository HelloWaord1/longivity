/**
 * Search index builder for Longivity
 * Builds and caches semantic search indexes for products and articles
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createIndex, prepareSearchText } from './embeddings.js';
import { KnowledgeBase } from '../kb/store.js';

const INDEX_FILE = 'knowledge-base/search-index.json';

/**
 * Load and prepare products for indexing
 */
async function loadProducts() {
  const kb = new KnowledgeBase();
  await kb.init();
  
  const productNames = await kb.listProducts();
  const products = [];
  
  console.log(`[Index] Loading ${productNames.length} products...`);
  
  for (const name of productNames) {
    try {
      const product = await kb.getProduct(name);
      if (!product) continue;
      
      // Prepare searchable text combining all relevant fields
      const searchText = prepareSearchText([
        product.name,
        product.description,
        product.category,
        ...(product.mechanisms || []),
        ...(product.tags || []),
        ...(product.keyFindings || []),
        product.dosage?.standard || '',
        product.dosage?.notes || ''
      ]);
      
      products.push({
        text: searchText,
        metadata: {
          type: 'product',
          name: product.name,
          slug: kb.slugify(product.name),
          category: product.category,
          evidenceGrade: product.evidenceGrade,
          riskProfile: product.riskProfile,
          description: product.description,
          mechanisms: product.mechanisms,
          tags: product.tags,
          dosage: product.dosage,
          keyFindings: product.keyFindings
        }
      });
    } catch (error) {
      console.error(`[Index] Failed to load product ${name}:`, error);
    }
  }
  
  console.log(`[Index] Prepared ${products.length} products for indexing`);
  return products;
}

/**
 * Load and prepare articles for indexing
 */
async function loadArticles() {
  const articles = [];
  
  // Load generated articles
  const articlesDir = join(process.cwd(), 'knowledge-base', 'articles');
  if (existsSync(articlesDir)) {
    const files = await readdir(articlesDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const data = JSON.parse(await readFile(join(articlesDir, file), 'utf-8'));
        
        const searchText = prepareSearchText([
          data.title || '',
          data.summary || '',
          data.content?.slice(0, 1000) || '', // First 1000 chars of content
          data.category || '',
          ...(data.tags || []),
          ...(data.matchedKeywords || [])
        ]);
        
        articles.push({
          text: searchText,
          metadata: {
            type: 'article',
            subtype: 'generated',
            id: data.id,
            title: data.title,
            summary: data.summary,
            category: data.category,
            tags: data.tags,
            featured: data.featured || false,
            createdAt: data.createdAt
          }
        });
      } catch (error) {
        console.error(`[Index] Failed to load article ${file}:`, error);
      }
    }
  }
  
  // Load web articles
  const webDir = join(process.cwd(), 'knowledge-base', 'web-articles');
  if (existsSync(webDir)) {
    const files = await readdir(webDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const data = JSON.parse(await readFile(join(webDir, file), 'utf-8'));
        
        const searchText = prepareSearchText([
          data.title || '',
          data.summary || '',
          data.content?.slice(0, 1000) || '', // First 1000 chars of content
          data.source || '',
          ...(data.tags || []),
          ...(data.matchedKeywords || [])
        ]);
        
        articles.push({
          text: searchText,
          metadata: {
            type: 'article',
            subtype: 'web',
            id: data.id,
            title: data.title,
            summary: data.summary,
            source: data.source,
            url: data.url,
            tags: data.tags || data.matchedKeywords || [],
            publishedAt: data.publishedAt,
            fetchedAt: data.fetchedAt
          }
        });
      } catch (error) {
        console.error(`[Index] Failed to load web article ${file}:`, error);
      }
    }
  }
  
  console.log(`[Index] Prepared ${articles.length} articles for indexing`);
  return articles;
}

/**
 * Build complete search index
 */
export async function buildIndex() {
  console.log('[Index] Building search index...');
  
  try {
    const [products, articles] = await Promise.all([
      loadProducts(),
      loadArticles()
    ]);
    
    console.log('[Index] Creating embeddings...');
    const [productIndex, articleIndex] = await Promise.all([
      createIndex(products),
      createIndex(articles)
    ]);
    
    const index = {
      products: productIndex,
      articles: articleIndex,
      metadata: {
        createdAt: new Date().toISOString(),
        productCount: productIndex.length,
        articleCount: articleIndex.length,
        totalCount: productIndex.length + articleIndex.length
      }
    };
    
    // Save index to file
    await saveIndex(index);
    
    console.log(`[Index] Index built successfully:`);
    console.log(`  Products: ${index.metadata.productCount}`);
    console.log(`  Articles: ${index.metadata.articleCount}`);
    console.log(`  Total: ${index.metadata.totalCount}`);
    
    return index.metadata;
  } catch (error) {
    console.error('[Index] Failed to build index:', error);
    throw error;
  }
}

/**
 * Save index to file
 */
async function saveIndex(index) {
  // Ensure directory exists
  const indexDir = join(process.cwd(), 'knowledge-base');
  if (!existsSync(indexDir)) {
    await mkdir(indexDir, { recursive: true });
  }
  
  // Convert Float32Array embeddings to regular arrays for JSON serialization
  const serializableIndex = {
    products: index.products.map(item => ({
      ...item,
      embedding: Array.from(item.embedding)
    })),
    articles: index.articles.map(item => ({
      ...item,
      embedding: Array.from(item.embedding)
    })),
    metadata: index.metadata
  };
  
  await writeFile(
    INDEX_FILE,
    JSON.stringify(serializableIndex, null, 2),
    'utf-8'
  );
  
  console.log(`[Index] Saved to ${INDEX_FILE}`);
}

/**
 * Load search index from file
 */
export async function loadIndex() {
  if (!existsSync(INDEX_FILE)) {
    console.log('[Index] No index file found, building new index...');
    await buildIndex();
  }
  
  try {
    const data = JSON.parse(await readFile(INDEX_FILE, 'utf-8'));
    
    // Convert arrays back to Float32Array
    const index = {
      products: data.products.map(item => ({
        ...item,
        embedding: new Float32Array(item.embedding)
      })),
      articles: data.articles.map(item => ({
        ...item,
        embedding: new Float32Array(item.embedding)
      })),
      metadata: data.metadata
    };
    
    console.log(`[Index] Loaded index (${index.metadata.totalCount} items)`);
    return index;
  } catch (error) {
    console.error('[Index] Failed to load index:', error);
    console.log('[Index] Building new index...');
    await buildIndex();
    return await loadIndex();
  }
}

/**
 * Get search index age in hours
 */
export async function getIndexAge() {
  if (!existsSync(INDEX_FILE)) {
    return Infinity;
  }
  
  try {
    const data = JSON.parse(await readFile(INDEX_FILE, 'utf-8'));
    const createdAt = new Date(data.metadata.createdAt);
    const now = new Date();
    return (now - createdAt) / (1000 * 60 * 60); // hours
  } catch {
    return Infinity;
  }
}

/**
 * Check if index needs rebuilding (older than 24 hours)
 */
export async function needsRebuild() {
  const age = await getIndexAge();
  return age > 24; // Rebuild if older than 24 hours
}

// Allow running this script directly to build index
if (import.meta.url === `file://${process.argv[1]}`) {
  buildIndex().then(result => {
    console.log('Index built successfully:', result);
    process.exit(0);
  }).catch(error => {
    console.error('Index build failed:', error);
    process.exit(1);
  });
}