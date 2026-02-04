'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getProtocol as getProtocolFromStorage,
  addToProtocol as addToProtocolStorage,
  removeFromProtocol as removeFromProtocolStorage,
  clearProtocol as clearProtocolStorage,
  saveProtocol as saveProtocolStorage,
} from './protocol';

const ProtocolContext = createContext(null);

export function ProtocolProvider({ children }) {
  const [protocol, setProtocol] = useState({ items: [], createdAt: null, lastUpdated: null, goals: null, budget: null, age: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProtocol(getProtocolFromStorage());
    setMounted(true);
  }, []);

  const addToProtocol = useCallback((product) => {
    const updated = addToProtocolStorage(product);
    setProtocol(updated);
  }, []);

  const removeFromProtocol = useCallback((slug) => {
    const updated = removeFromProtocolStorage(slug);
    setProtocol(updated);
  }, []);

  const clearProtocol = useCallback(() => {
    const updated = clearProtocolStorage();
    setProtocol(updated);
  }, []);

  const saveProtocol = useCallback((items, metadata = {}) => {
    const updated = saveProtocolStorage(items, metadata);
    setProtocol(updated);
  }, []);

  const isInProtocol = useCallback(
    (slug) => (protocol.items || []).some((item) => item.slug === slug),
    [protocol.items]
  );

  const items = protocol.items || [];
  const total = items.reduce((sum, item) => sum + (item.monthlyCost || 0), 0);
  const count = items.length;

  return (
    <ProtocolContext.Provider
      value={{
        protocol,
        items,
        count,
        total,
        mounted,
        addToProtocol,
        removeFromProtocol,
        clearProtocol,
        saveProtocol,
        isInProtocol,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (!context) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}
