const PROTOCOL_KEY = 'longivity-protocol';

function isBrowser() {
  return typeof window !== 'undefined';
}

function getStoredProtocol() {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(PROTOCOL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getProtocol() {
  const protocol = getStoredProtocol();
  if (!protocol) return { items: [], createdAt: null, lastUpdated: null, goals: null, budget: null, age: null };
  return protocol;
}

export function getProtocolItems() {
  return getProtocol().items || [];
}

export function saveProtocol(items, metadata = {}) {
  if (!isBrowser()) return getProtocol();
  const existing = getStoredProtocol();
  const now = new Date().toISOString();
  const protocol = {
    items: items || [],
    createdAt: existing?.createdAt || now,
    lastUpdated: now,
    goals: metadata.goals || existing?.goals || null,
    budget: metadata.budget || existing?.budget || null,
    age: metadata.age || existing?.age || null,
  };
  localStorage.setItem(PROTOCOL_KEY, JSON.stringify(protocol));
  return protocol;
}

export function addToProtocol(product) {
  if (!isBrowser()) return getProtocol();
  const protocol = getProtocol();
  const existing = protocol.items.find((item) => item.slug === product.slug);
  if (existing) return protocol;
  const item = {
    name: product.name,
    slug: product.slug,
    dosage: product.dosage || null,
    monthlyCost: product.monthlyCost || null,
    evidenceGrade: product.evidenceGrade || 'D',
    reasoning: product.reasoning || null,
  };
  const updatedItems = [...protocol.items, item];
  return saveProtocol(updatedItems);
}

export function removeFromProtocol(slug) {
  if (!isBrowser()) return getProtocol();
  const protocol = getProtocol();
  const updatedItems = protocol.items.filter((item) => item.slug !== slug);
  return saveProtocol(updatedItems);
}

export function clearProtocol() {
  if (!isBrowser()) return { items: [], createdAt: null, lastUpdated: null, goals: null, budget: null, age: null };
  localStorage.removeItem(PROTOCOL_KEY);
  return { items: [], createdAt: null, lastUpdated: null, goals: null, budget: null, age: null };
}

export function getProtocolTotal() {
  const protocol = getProtocol();
  return protocol.items.reduce((sum, item) => sum + (item.monthlyCost || 0), 0);
}

export function getProtocolCount() {
  return getProtocolItems().length;
}

export function isInProtocol(slug) {
  return getProtocolItems().some((item) => item.slug === slug);
}
