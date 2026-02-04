/**
 * Embeddings module for Longivity semantic search
 * Uses @xenova/transformers for lightweight local embeddings
 */

import { pipeline } from '@xenova/transformers';

let embeddingPipeline = null;

/**
 * Initialize the embedding pipeline
 * Uses a lightweight model that runs locally without API keys
 */
async function initEmbeddings() {
  if (!embeddingPipeline) {
    console.log('[Embeddings] Initializing sentence transformer...');
    try {
      // Use a lightweight sentence transformer model
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2', // Small, fast model (22MB)
        { quantized: true } // Use quantized version for smaller size
      );
      console.log('[Embeddings] Model loaded successfully');
    } catch (error) {
      console.error('[Embeddings] Failed to load model:', error);
      throw error;
    }
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for a piece of text
 * @param {string} text - The text to embed
 * @returns {Promise<Float32Array>} - The embedding vector
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  const pipeline = await initEmbeddings();
  
  // Clean and truncate text (model has token limits)
  const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 500);
  
  try {
    const result = await pipeline(cleanText, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Extract the embedding array
    const embedding = result.data;
    return new Float32Array(embedding);
  } catch (error) {
    console.error('[Embeddings] Generation failed for text:', cleanText.slice(0, 50) + '...', error);
    throw error;
  }
}

/**
 * Compute cosine similarity between two embeddings
 * @param {Float32Array} a - First embedding vector
 * @param {Float32Array} b - Second embedding vector
 * @returns {number} - Cosine similarity score (-1 to 1)
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    throw new Error('Embeddings must be same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Search for the most similar items to a query
 * @param {string} query - The search query
 * @param {Array} items - Array of {text, metadata, embedding} objects
 * @param {number} limit - Maximum number of results to return
 * @param {number} minScore - Minimum similarity score threshold (0-1)
 * @returns {Promise<Array>} - Sorted array of {item, score} objects
 */
export async function searchSimilar(query, items, limit = 10, minScore = 0.1) {
  if (!query || !items || items.length === 0) {
    return [];
  }

  try {
    const queryEmbedding = await generateEmbedding(query);
    const results = [];

    for (const item of items) {
      if (!item.embedding) {
        console.warn('[Search] Item missing embedding:', item.metadata?.name || 'Unknown');
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, item.embedding);
      
      if (score >= minScore) {
        results.push({
          item: item.metadata,
          score,
          text: item.text
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  } catch (error) {
    console.error('[Search] Search failed:', error);
    return [];
  }
}

/**
 * Create searchable index for a collection of items
 * @param {Array} items - Array of {text, metadata} objects
 * @returns {Promise<Array>} - Array of {text, metadata, embedding} objects
 */
export async function createIndex(items) {
  const indexedItems = [];
  
  console.log(`[Embeddings] Creating index for ${items.length} items...`);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      const embedding = await generateEmbedding(item.text);
      indexedItems.push({
        text: item.text,
        metadata: item.metadata,
        embedding
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`[Embeddings] Processed ${i + 1}/${items.length} items`);
      }
    } catch (error) {
      console.error(`[Embeddings] Failed to embed item ${i}:`, item.metadata?.name || 'Unknown', error);
    }
  }
  
  console.log(`[Embeddings] Index complete: ${indexedItems.length}/${items.length} items embedded`);
  return indexedItems;
}

/**
 * Utility function to prepare text for embedding
 * Combines multiple fields into searchable text
 */
export function prepareSearchText(fields) {
  return fields
    .filter(field => field && typeof field === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}