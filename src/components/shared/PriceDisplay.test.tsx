import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PriceDisplay } from './PriceDisplay';
import * as VatContextModule from '@/context/VatContext';

describe('PriceDisplay component', () => {
  it('renders range ex-VAT and Excl. VAT label below price', () => {
    vi.spyOn(VatContextModule, 'useVat').mockReturnValue({
      showPricesIncludingVat: false,
      setShowPricesIncludingVat: vi.fn(),
    });

    render(
      <PriceDisplay
        amount={2.66}
        minAmount={1.95}
        showBelowVatLabel={true}
      />
    );

    expect(screen.getByText('£1.95 – £2.66')).toBeDefined();
    expect(screen.getByText('Excl. VAT')).toBeDefined();
  });

  it('renders range inc-VAT and Inc. VAT label when VAT is enabled', () => {
    vi.spyOn(VatContextModule, 'useVat').mockReturnValue({
      showPricesIncludingVat: true,
      setShowPricesIncludingVat: vi.fn(),
    });

    render(
      <PriceDisplay
        amount={2.66}
        minAmount={1.95}
        showBelowVatLabel={true}
      />
    );

    // 1.95 * 1.2 = 2.34, 2.66 * 1.2 = 3.192 => 3.19
    expect(screen.getByText('£2.34 – £3.19')).toBeDefined();
    expect(screen.getByText('Inc. VAT')).toBeDefined();
  });

  it('renders single price when minAmount is equal to amount', () => {
    vi.spyOn(VatContextModule, 'useVat').mockReturnValue({
      showPricesIncludingVat: false,
      setShowPricesIncludingVat: vi.fn(),
    });

    render(
      <PriceDisplay
        amount={2.66}
        minAmount={2.66}
        showBelowVatLabel={true}
      />
    );

    expect(screen.getByText('£2.66')).toBeDefined();
    expect(screen.getByText('Excl. VAT')).toBeDefined();
  });
});

