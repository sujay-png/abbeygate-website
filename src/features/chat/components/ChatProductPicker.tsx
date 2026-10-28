'use client';

import React, { useState } from 'react';

interface ChatProductPickerProps {
  lineItems: Array<{ id?: number; name: string; quantity?: number }>;
  orderNumber: string;
  onSelectProduct: (productName: string) => void;
}

export function ChatProductPicker({
  lineItems,
  orderNumber,
  onSelectProduct,
}: ChatProductPickerProps) {
  const [customItem, setCustomItem] = useState('');
  const [showCustom, setShowCustom] = useState(lineItems.length === 0);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItem.trim()) return;
    onSelectProduct(customItem.trim());
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 font-sans">
        Which product from Order #{orderNumber}?
      </div>

      <div className="flex flex-col gap-1.5">
        {lineItems.map((item, idx) => (
          <button
            key={item.id || idx}
            type="button"
            onClick={() => onSelectProduct(`${item.name}${item.quantity ? ` (Qty: ${item.quantity})` : ''}`)}
            className="text-left px-3 py-2 rounded-lg border border-[#e5decb] bg-white hover:border-[#4b2255] hover:bg-[#faf6ee] transition-all text-[12px] font-medium text-brand-body flex items-center justify-between group shadow-2xs"
          >
            <span className="truncate flex-1 group-hover:text-[#4b2255] font-sans">
              📖 {item.name}
            </span>
            {item.quantity && (
              <span className="text-[11px] font-semibold text-gray-500 ml-2">
                Qty: {item.quantity}
              </span>
            )}
          </button>
        ))}

        {/* Whole order option */}
        <button
          type="button"
          onClick={() => onSelectProduct('Whole Order / Delivery')}
          className="text-left px-3 py-2 rounded-lg border border-dashed border-[#d8cbb0] bg-white hover:border-[#4b2255] hover:bg-[#faf6ee] transition-all text-[12px] font-medium text-gray-700 flex items-center gap-2"
        >
          <span>📦</span>
          <span>Whole Order / Delivery &amp; Packaging</span>
        </button>
      </div>

      {showCustom ? (
        <form onSubmit={handleCustomSubmit} className="pt-2 flex gap-2">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Type product name or item description..."
            className="flex-1 px-3 py-1.5 text-[12px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4b2255]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!customItem.trim()}
            className="px-3 py-1.5 bg-[#4b2255] text-white text-[12px] font-bold rounded-md hover:bg-[#34143d] transition-colors disabled:opacity-50"
          >
            Select
          </button>
        </form>
      ) : (
        <div className="pt-1 text-right">
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="text-[11px] text-[#4b2255] hover:underline"
          >
            Item not listed above?
          </button>
        </div>
      )}
    </div>
  );
}
