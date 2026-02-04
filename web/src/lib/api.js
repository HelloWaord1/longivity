const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://longivity-production.up.railway.app';

export async function fetchProducts() {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products || [];
}

export async function fetchProduct(name) {
  const res = await fetch(`${API_URL}/products/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function fetchResearch() {
  const res = await fetch(`${API_URL}/research`);
  if (!res.ok) throw new Error('Failed to fetch research');
  const data = await res.json();
  return data.papers || [];
}

export async function fetchDigest() {
  const res = await fetch(`${API_URL}/digest`);
  if (!res.ok) throw new Error('Failed to fetch digest');
  const data = await res.json();
  return data.digest || '';
}

export async function consultAI(query) {
  const res = await fetch(`${API_URL}/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to consult');
  return res.json();
}

export async function getRecommendation({ budget, age, goals }) {
  const res = await fetch(`${API_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget, age, goals }),
  });
  if (!res.ok) throw new Error('Failed to get recommendation');
  return res.json();
}

export function getGradeColor(grade) {
  const g = (grade || 'D').toUpperCase();
  switch (g) {
    case 'A': return { text: 'text-grade-a', class: 'grade-a' };
    case 'B': return { text: 'text-grade-b', class: 'grade-b' };
    case 'C': return { text: 'text-grade-c', class: 'grade-c' };
    case 'D': return { text: 'text-grade-d', class: 'grade-d' };
    default: return { text: 'text-secondary', class: '' };
  }
}

export function getCategoryEmoji(category) {
  return '';
}

export function getCategoryGradient(category) {
  return '';
}
