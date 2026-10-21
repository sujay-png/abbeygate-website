'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

type OrderLineItem = {
  id: string | number;
  name: string;
  quantity: number;
  total: number;
  image?: string;
  meta?: Array<{ key: string; value: any }>;
};

type Props = {
  lineItems: OrderLineItem[];
  subtotal: number;
  shippingTotal: number;
  shippingLabel?: string;
  taxTotal: number;
  total: number;
  totalPaid?: number;
  defaultOpen?: boolean;
  className?: string;
};

export function OrderSummaryDropdown({
  lineItems,
  subtotal,
  shippingTotal,
  shippingLabel = 'Standard Shipping',
  taxTotal,
  total,
  totalPaid,
  defaultOpen = false,
  className = '',
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-[var(--brand-border)] bg-brand-cream/60 overflow-hidden ${className}`}>
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-cream transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-primary-dark">Order summary</span>
          <ChevronDown
            className={`w-4 h-4 text-brand-grey transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
        <div className="text-right">
          <span className="font-bold text-sm text-brand-primary-dark">
            {formatPrice(totalPaid ?? total)}
          </span>
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="border-t border-[var(--brand-border)] bg-white p-4 sm:p-5 text-sm space-y-5">
          {/* Items List */}
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {lineItems.map((item, idx) => (
              <div key={item.id ? `${item.id}-${idx}` : idx} className="flex gap-3.5 pb-4 border-b border-[var(--brand-border)] last:border-b-0 last:pb-0">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-white border border-[var(--brand-border)] flex items-center justify-center">
                  <Image
                    src={item.image || '/images/logo/abbeygate-logo.png'}
                    alt={item.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-primary-dark leading-tight">{item.name}</p>
                  <p className="mt-1 text-xs text-brand-grey">Qty {item.quantity}</p>

                  {item.meta && item.meta.length > 0 && (
                    <div className="mt-2 text-[11px] space-y-0.5 text-brand-grey pl-2 border-l border-brand-primary/20">
                      {item.meta.map((m, mIdx) => (
                        <p key={mIdx}>
                          <span className="font-medium text-brand-body">{m.key}:</span>{' '}
                          {m.value?.toString().includes('http') ? (
                            <a
                              href={m.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-primary hover:underline break-all"
                            >
                              View file
                            </a>
                          ) : (
                            m.value
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right font-medium text-brand-primary-dark text-sm">
                  {formatPrice(item.total)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-[var(--brand-border)] pt-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-brand-grey">
              <span>Subtotal</span>
              <span className="font-medium text-brand-body">{formatPrice(subtotal)}</span>
            </div>

            {shippingTotal > 0 && (
              <div className="flex justify-between text-brand-grey">
                <span>Shipping</span>
                <span className="font-medium text-brand-body">{formatPrice(shippingTotal)}</span>
              </div>
            )}

            {taxTotal > 0 && (
              <div className="flex justify-between text-brand-grey">
                <span>VAT (20%)</span>
                <span className="font-medium text-brand-body">{formatPrice(taxTotal)}</span>
              </div>
            )}

            <div className="border-t border-[var(--brand-border)] pt-2.5 flex justify-between font-bold text-base text-brand-primary-dark">
              <span>Total paid</span>
              <span>{formatPrice(totalPaid ?? total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
