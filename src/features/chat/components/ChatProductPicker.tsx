'use client';

import React, { useState } from 'react';

interface ChatProductPickerProps {
  lineItems: Array<{ id?: number; name: string; quantity?: number }>;
  orderNumber: string;
  onSelectProducts: (selectedItemsSummary: string) => void;
  onBack: () => void;
}

export function ChatProductPicker({
  lineItems,
  orderNumber,
  onSelectProducts,
  onBack,
}: ChatProductPickerProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [showCustom, setShowCustom] = useState(lineItems.length === 0);

  // Toggle single item
  const handleToggleItem = (itemString: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemString)
        ? prev.filter((i) => i !== itemString)
        : [...prev, itemString]
    );
  };

  // Toggle select all items
  const handleSelectAll = () => {
    if (selectedItems.length === lineItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        lineItems.map(
          (i) => `${i.name}${i.quantity ? ` (Qty: ${i.quantity})` : ''}`
        )
      );
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedItems.length === 0) return;
    onSelectProducts(selectedItems.join('; '));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItem.trim()) return;
    onSelectProducts(customItem.trim());
  };

  return (
    <div className="mt-2 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500 font-sans">
          Select item(s) from Order #{orderNumber}:
        </span>
        {lineItems.length > 1 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] text-[#4b2255] font-semibold hover:underline"
          >
            {selectedItems.length === lineItems.length ? 'Deselect All' : 'Select All Items'}
          </button>
        )}
      </div>

      {lineItems.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {lineItems.map((item, idx) => {
            const itemString = `${item.name}${item.quantity ? ` (Qty: ${item.quantity})` : ''}`;
            const isChecked = selectedItems.includes(itemString);

            return (
              <label
                key={item.id || idx}
                className={`flex items-start gap-2.5 p-2 rounded-lg border text-[12px] cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-[#f4edf7] border-[#4b2255] text-[#250d2c] font-medium shadow-xs'
                    : 'bg-white border-[#e5decb] text-gray-700 hover:bg-[#faf6ee]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleItem(itemString)}
                  className="mt-0.5 rounded border-gray-300 text-[#4b2255] focus:ring-[#4b2255]"
                />
                <span className="flex-1 leading-snug">
                  {item.name}{' '}
                  {item.quantity && (
                    <span className="text-gray-500 font-normal">
                      × {item.quantity}
                    </span>
                  )}
                </span>
              </label>
            );
          })}

          {/* Whole order option */}
          <label
            className={`flex items-start gap-2.5 p-2 rounded-lg border text-[12px] cursor-pointer transition-all ${
              selectedItems.includes('Whole Order / Delivery & Packaging')
                ? 'bg-[#f4edf7] border-[#4b2255] text-[#250d2c] font-medium shadow-xs'
                : 'bg-white border-dashed border-[#d8cbb0] text-gray-700 hover:bg-[#faf6ee]'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedItems.includes('Whole Order / Delivery & Packaging')}
              onChange={() => handleToggleItem('Whole Order / Delivery & Packaging')}
              className="mt-0.5 rounded border-gray-300 text-[#4b2255] focus:ring-[#4b2255]"
            />
            <span className="flex-1 leading-snug">
              📦 Whole Order / Delivery &amp; Packaging
            </span>
          </label>
        </div>
      )}

      {/* Confirm Button when items selected */}
      {selectedItems.length > 0 && (
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-2 bg-[#4b2255] hover:bg-[#34143d] text-white text-[12px] font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Continue with Selected ({selectedItems.length})</span>
          <span>&rarr;</span>
        </button>
      )}

      {showCustom ? (
        <form onSubmit={handleCustomSubmit} className="pt-1 flex gap-2">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Type item description..."
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
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] text-[#4b2255] hover:underline flex items-center gap-1 font-medium"
          >
            &larr; Choose different order
          </button>
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="text-[11px] text-gray-500 hover:text-gray-800 underline"
          >
            Item not listed?
          </button>
        </div>
      )}
    </div>
  );
}
