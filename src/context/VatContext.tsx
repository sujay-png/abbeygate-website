'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type VatContextType = {
  showPricesIncludingVat: boolean;
  setShowPricesIncludingVat: (value: boolean) => void;
};

const VatContext = createContext<VatContextType | undefined>(undefined);

export const VatProvider = ({ children }: { children: React.ReactNode }) => {
  const [showPricesIncludingVat, setShowPricesIncludingVat] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('abbeygate_show_vat');
    if (stored !== null) {
      setShowPricesIncludingVat(stored === 'true');
    }
  }, []);

  const handleSetVat = (value: boolean) => {
    setShowPricesIncludingVat(value);
    localStorage.setItem('abbeygate_show_vat', value.toString());
  };

  // We don't hide children, we just let it hydrate to avoid flashing layout, 
  // though hydration mismatch might occur if we switch instantly. 
  // It's better to just render children.
  return (
    <VatContext.Provider value={{ showPricesIncludingVat, setShowPricesIncludingVat: handleSetVat }}>
      {children}
    </VatContext.Provider>
  );
};

export const useVat = () => {
  const context = useContext(VatContext);
  if (context === undefined) {
    throw new Error('useVat must be used within a VatProvider');
  }
  return context;
};
