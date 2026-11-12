'use client';

import React from 'react';
import { useVat } from '@/context/VatContext';
import { VAT_RATE, formatGBP } from '@/features/products/utils/pricing';

interface PriceDisplayProps {
  amount: number; // The ex-VAT base amount
  minAmount?: number; // The ex-VAT lowest tiered amount
  className?: string;
  showVatLabel?: boolean;
  showBelowVatLabel?: boolean;
}

export const PriceDisplay = ({
  amount,
  minAmount,
  className = '',
  showVatLabel = false,
  showBelowVatLabel = false,
}: PriceDisplayProps) => {
  const { showPricesIncludingVat } = useVat();

  const finalAmount = showPricesIncludingVat ? amount * (1 + VAT_RATE) : amount;
  const finalMinAmount =
    minAmount !== undefined && minAmount > 0
      ? showPricesIncludingVat
        ? minAmount * (1 + VAT_RATE)
        : minAmount
      : null;

  const label = showPricesIncludingVat ? 'inc VAT' : 'ex VAT';
  const belowVatLabel = showPricesIncludingVat ? 'Inc. VAT' : 'Excl. VAT';

  const hasRange =
    finalMinAmount !== null && finalMinAmount < finalAmount - 0.005;

  const priceText = hasRange
    ? `${formatGBP(finalMinAmount)} – ${formatGBP(finalAmount)}`
    : formatGBP(finalAmount);

  if (showBelowVatLabel) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="text-[15px] font-bold text-brand-body leading-snug">
          {priceText}
        </span>
        <span className="text-[12px] font-normal text-gray-500 leading-tight mt-0.5">
          {belowVatLabel}
        </span>
      </div>
    );
  }

  return (
    <span className={className}>
      {priceText}
      {showVatLabel && <span className="ml-1 text-[0.8em] font-normal text-gray-500">({label})</span>}
    </span>
  );
};
