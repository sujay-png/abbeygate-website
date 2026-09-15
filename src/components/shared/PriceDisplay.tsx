'use client';

import React from 'react';
import { useVat } from '@/context/VatContext';
import { VAT_RATE, formatGBP } from '@/features/products/utils/pricing';

interface PriceDisplayProps {
  amount: number; // The ex-VAT base amount
  className?: string;
  showVatLabel?: boolean;
}

export const PriceDisplay = ({ amount, className = '', showVatLabel = false }: PriceDisplayProps) => {
  const { showPricesIncludingVat } = useVat();

  const finalAmount = showPricesIncludingVat ? amount * (1 + VAT_RATE) : amount;
  const label = showPricesIncludingVat ? 'inc VAT' : 'ex VAT';

  return (
    <span className={className}>
      {formatGBP(finalAmount)}
      {showVatLabel && <span className="ml-1 text-[0.8em] font-normal text-gray-500">({label})</span>}
    </span>
  );
};
